# FitSphere

Premium fitness social platform concept inspired by Strava, Nike Training Club, Apple Fitness+, Whoop, and Linear aesthetics.

## Monorepo Structure

- `web`: Next.js (App Router) premium frontend with Framer Motion, GSAP, Recharts, and React Three Fiber.
- `backend-spring`: Spring Boot REST API starter with security, JWT service, tracking endpoints, and dashboard/feed APIs.
- `ai-service`: FastAPI microservice with a placeholder food image macro estimation endpoint.
- `docker-compose.yml`: Local orchestration for frontend, backend, AI service, PostgreSQL, and Redis.

## Frontend Features Implemented

- Cinematic hero with slow-motion training video, premium gradient overlays, and particle field.
- Horizontal training carousel for Gym, Running, and Calisthenics with looping background clips.
- Interactive 3D athlete scene (runner, powerlifter, calisthenics) with dynamic lighting.
- Onboarding and feature modules (tracking, communities, AI calorie tracker, achievements).
- Glassmorphism analytics dashboard with animated charts.
- Social feed preview cards with interaction controls.

## Backend API Starter Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/onboarding`
- `GET /api/auth/me`
- `GET /api/dashboard/{userId}`
- `POST /api/tracking/workout`
- `POST /api/tracking/running`
- `POST /api/tracking/calisthenics`
- `GET /api/social/feed`
- `POST /api/coach/weekly-plan`

All endpoints except `/api/auth/register` and `/api/auth/login` require `Authorization: Bearer <jwt>`.

## AI Service Endpoint

- `POST /analyze-food` with `multipart/form-data` image upload
- Returns estimated calories/protein/carbs/fat (placeholder heuristic)

## Run Frontend Only

```powershell
cd web
npm install
npm run dev
```

## Run Full Stack with Docker

```powershell
docker compose up --build
```

Frontend: `http://localhost:3000`  
Backend: `http://localhost:8080`  
AI service: `http://localhost:8000`

## Next Steps to Reach Production

1. Replace mock tracking/feed data with persisted PostgreSQL models.
2. Add JWT filter + refresh token flow in Spring Security.
3. Integrate Cloudinary or S3 media uploads and signed URLs.
4. Wire frontend data fetching to backend endpoints via typed API clients.
5. Replace AI heuristic with real CV model inference pipeline.
6. Add GitHub Actions for lint, test, docker build, and deployment.
