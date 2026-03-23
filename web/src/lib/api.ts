export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081";

export type AuthResponse = {
  userId: string;
  token: string;
  displayName: string;
  fitnessCategory: string;
};

export type WeeklyPlanResponse = {
  goal: string;
  preferredCategory: string;
  rationale: string;
  week: Array<{
    day: string;
    focus: string;
    durationMinutes: number;
    intensity: string;
    blocks: string[];
  }>;
};

export class ApiError extends Error {
  status: number;
  body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    const fallback = `Request failed with status ${response.status}`;
    let message = body || fallback;

    try {
      const parsed = body ? (JSON.parse(body) as { message?: string; error?: string }) : null;
      if (parsed?.message) message = parsed.message;
      else if (parsed?.error) message = parsed.error;
    } catch {
      // Keep plain-text response body as-is.
    }

    throw new ApiError(message, response.status, body);
  }

  return response.json() as Promise<T>;
}
