from io import BytesIO
from typing import Any, Dict, List

import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

app = FastAPI(title="FitSphere AI Service", version="0.1.0")

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


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze-food")
async def analyze_food(file: UploadFile = File(...)) -> Dict[str, float]:
    content = await file.read()
    return _mock_macro_estimate(content)


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
