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

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    const body = await response.text();
    throw new Error(body || fallback);
  }

  return response.json() as Promise<T>;
}
