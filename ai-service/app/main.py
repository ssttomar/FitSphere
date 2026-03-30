from io import BytesIO
import base64
import json
import logging
import os
from typing import Any, Dict, List

import numpy as np
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from openai import OpenAI

app = FastAPI(title="FitSphere AI Service", version="0.1.0")
logger = logging.getLogger("fitsphere.ai")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://10.212.52.68:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProgressSnapshot(BaseModel):
    weeklyWorkoutCount: int = 0
    weeklyRunKm: int = 0
    weeklyCaloriesBurned: int = 0
    fatigueLevel: int = 4


class WeeklyPlanRequest(BaseModel):
    profile: Dict[str, Any]
    progress: ProgressSnapshot | None = None


class AnalyzeImageResponse(BaseModel):
    reply: str
    intent: str
    macros: Dict[str, float] | None = None
    source: str = "llm"


def _mock_macro_estimate(image_bytes: bytes) -> Dict[str, float]:
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    array = np.asarray(image, dtype=np.float32)

    # Placeholder heuristic until a production CV model is plugged in.
    brightness = float(array.mean() / 255.0)
    calories = max(120.0, min(950.0, 320.0 + brightness * 410.0))
    protein = max(8.0, calories * 0.13 / 4.0)
    carbs = max(15.0, calories * 0.46 / 4.0)
    fat = max(5.0, calories * 0.33 / 9.0)

    return {
        "calories": round(calories, 1),
        "protein": round(protein, 1),
        "carbs": round(carbs, 1),
        "fat": round(fat, 1),
    }


def _get_llm_client() -> OpenAI | None:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").strip()
    return OpenAI(api_key=api_key, base_url=base_url)


def _extract_json_object(text: str) -> Dict[str, Any]:
    payload = text.strip()
    if not payload:
        return {}

    try:
        parsed = json.loads(payload)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        pass

    start = payload.find("{")
    end = payload.rfind("}")
    if start >= 0 and end > start:
        try:
            parsed = json.loads(payload[start : end + 1])
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}
    return {}


def _extract_chat_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: List[str] = []
        for item in content:
            if isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)
        return "\n".join(parts).strip()
    return ""


def _normalize_macros(raw: Any) -> Dict[str, float] | None:
    if not isinstance(raw, dict):
        return None

    required = ("calories", "protein", "carbs", "fat")
    normalized: Dict[str, float] = {}

    for key in required:
        value = raw.get(key)
        if value is None:
            return None
        try:
            normalized[key] = round(float(value), 1)
        except (TypeError, ValueError):
            return None
    return normalized


def _is_food_prompt(prompt: str) -> bool:
    lower = prompt.lower()
    keywords = [
        "meal",
        "food",
        "eat",
        "eating",
        "calorie",
        "calories",
        "macro",
        "protein",
        "carb",
        "fat",
        "nutrition",
        "diet",
        "plate",
    ]
    return any(k in lower for k in keywords)


def _fallback_image_coach(prompt: str, image_bytes: bytes) -> AnalyzeImageResponse:
    if _is_food_prompt(prompt):
        macros = _mock_macro_estimate(image_bytes)
        return AnalyzeImageResponse(
            reply=(
                "I could not reach the LLM right now, but here is a fallback nutrition estimate. "
                "If you add your goal (cut, maintain, or bulk), I can tailor this recommendation."
            ),
            intent="food",
            macros=macros,
            source="fallback",
        )

    return AnalyzeImageResponse(
        reply=(
            "I could not reach the LLM right now. For physique analysis, share your goal "
            "(cut, lean bulk, or recomposition), training days per week, and whether you want "
            "feedback on posture, symmetry, or muscle balance."
        ),
        intent="physique",
        source="fallback",
    )


def _analyze_with_llm(prompt: str, image_bytes: bytes) -> AnalyzeImageResponse | None:
    client = _get_llm_client()
    if not client:
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini").strip() or "gpt-4.1-mini"
    api_style = os.getenv("OPENAI_API_STYLE", "auto").strip().lower()
    image_b64 = base64.b64encode(image_bytes).decode("ascii")

    system_prompt = (
        "You are FitSphere AI Coach. Analyze the user image and the user prompt. "
        "Return ONLY valid JSON with this exact shape: "
        "{\"reply\": string, \"intent\": \"food\"|\"physique\"|\"general\", "
        "\"macros\": {\"calories\": number, \"protein\": number, \"carbs\": number, \"fat\": number} | null}. "
        "Rules: Only include macros when the image/prompt is food-related. "
        "For physique/general, set macros to null and provide practical coaching in reply. "
        "Keep reply concise and actionable."
    )

    raw_text = ""

    if api_style in {"auto", "responses"}:
        try:
            response = client.responses.create(
                model=model,
                temperature=0.2,
                max_output_tokens=500,
                input=[
                    {
                        "role": "system",
                        "content": [{"type": "input_text", "text": system_prompt}],
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "input_text", "text": f"User prompt: {prompt}"},
                            {
                                "type": "input_image",
                                "image_url": f"data:image/jpeg;base64,{image_b64}",
                            },
                        ],
                    },
                ],
            )
            raw_text = getattr(response, "output_text", "") or ""
        except Exception:
            if api_style == "responses":
                raise

    if not raw_text and api_style in {"auto", "chat"}:
        chat_response = client.chat.completions.create(
            model=model,
            temperature=0.2,
            max_tokens=500,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"User prompt: {prompt}"},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                        },
                    ],
                },
            ],
        )
        choice = chat_response.choices[0] if chat_response.choices else None
        message_content = choice.message.content if choice and choice.message else ""
        raw_text = _extract_chat_text(message_content)

    parsed = _extract_json_object(raw_text)
    if not parsed:
        return None

    reply = str(parsed.get("reply", "")).strip()
    intent = str(parsed.get("intent", "general")).strip().lower()
    if intent not in {"food", "physique", "general"}:
        intent = "general"

    macros = _normalize_macros(parsed.get("macros"))
    if intent != "food":
        macros = None

    if not reply:
        return None

    return AnalyzeImageResponse(reply=reply, intent=intent, macros=macros, source="llm")


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze-food")
async def analyze_food(file: UploadFile = File(...)) -> Dict[str, float]:
    content = await file.read()
    return _mock_macro_estimate(content)


@app.post("/analyze-image", response_model=AnalyzeImageResponse)
async def analyze_image(prompt: str = Form(...), file: UploadFile = File(...)) -> AnalyzeImageResponse:
    content = await file.read()

    if not content:
        return AnalyzeImageResponse(
            reply="The uploaded file was empty. Please upload a valid image.",
            intent="general",
            source="fallback",
        )

    try:
        llm_result = _analyze_with_llm(prompt=prompt, image_bytes=content)
        if llm_result:
            return llm_result
    except Exception:
        logger.exception("LLM image analysis failed")

    return _fallback_image_coach(prompt=prompt, image_bytes=content)


@app.post("/recommend-weekly-plan")
def recommend_weekly_plan(request: WeeklyPlanRequest) -> Dict[str, Any]:
    profile = request.profile
    progress = request.progress or ProgressSnapshot()

    goal = str(profile.get("fitnessGoal", "Strength"))
    category = str(profile.get("preferredCategory", "Gym"))
    days = int(profile.get("trainingDaysPerWeek", 4) or 4)
    duration = int(profile.get("sessionDurationMinutes", 60) or 60)

    intensity = "high"
    if progress.fatigueLevel >= 8:
        intensity = "low"
    elif progress.fatigueLevel >= 6:
        intensity = "moderate"

    templates: Dict[str, List[str]] = {
        "gym": ["Upper Strength", "Lower Strength", "Push Hypertrophy", "Pull + Core", "Power + Mobility"],
        "running": ["Intervals", "Easy Run", "Tempo", "Recovery Run", "Long Run"],
        "calisthenics": ["Pull Skill", "Push Skill", "Core + Balance", "Strength Endurance", "Mobility"],
    }

    blocks = templates.get(category.lower(), templates["gym"])
    week = []
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    for i in range(min(days, 7)):
        week.append(
            {
                "day": day_names[i],
                "focus": blocks[i % len(blocks)],
                "durationMinutes": duration,
                "intensity": intensity.capitalize(),
                "blocks": [
                    "Warm-up 10 min",
                    f"Main work {max(25, duration - 20)} min",
                    "Cooldown and mobility 10 min",
                ],
            }
        )

    return {
        "goal": goal,
        "preferredCategory": category,
        "rationale": f"AI model generated a {days}-day plan for {goal} with {intensity} intensity based on fatigue {progress.fatigueLevel}.",
        "week": week,
    }
