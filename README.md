# Render Queue

A Go-based video rendering backend prototype that combines:

- an HTTP API for creating/querying render jobs,
- an FFmpeg worker proof-of-concept,
- Redis + Asynq foundations for background task processing.

---

## Project Snapshot

**Status:** In active development (prototype stage)  
**Last verified date:** March 21, 2026  
**Branch:** `main`  
**Build status:** `go build ./...` passes

### Current Scope (Implemented)

1. **HTTP Job API**
   - `POST /jobs` creates a render job
   - `GET /jobs/{id}` fetches a job by ID
   - Job state is currently stored in an in-memory store

2. **Worker FFmpeg Prototype**
   - Reads `temp/input-test.mp4`
   - Applies centered text overlay via FFmpeg `drawtext`
   - Writes output to `temp/output-test.mp4`

3. **Async Task Definition Layer**
   - Asynq task type: `video:render`
   - Payload model and task factory implemented in `internal/tasks`

4. **Containerized Dev Setup**
   - `docker-compose.yml` includes:
     - `app` service (Go + FFmpeg installed in container)
     - `redis` service

---

## Repository Structure

```text
render-queue/
├─ api/
│  ├─ handler.go          # HTTP handlers + route registration
│  └─ models.go           # Job models, statuses, in-memory JobStore
├─ cmd/
│  ├─ api/
│  │  └─ main.go          # Starts API server on :8080
│  └─ worker/
│     └─ main.go          # FFmpeg worker prototype
├─ internal/
│  └─ tasks/
│     └─ tasks.go         # Asynq task definitions and payload
├─ temp/                  # Local media assets (ignored in git)
├─ docker-compose.yml
├─ go.mod
├─ go.sum
└─ .gitignore
```

---

## Tech Stack

- **Language:** Go 1.25
- **Queue foundation:** Asynq (`github.com/hibiken/asynq`)
- **ID generation:** UUID (`github.com/google/uuid`)
- **Media engine:** FFmpeg
- **Broker / backend:** Redis
- **Runtime:** Local + Docker Compose

---

## Implemented API Contract

### `POST /jobs`

Create a new render job.

**Request body:**

```json
{
  "video_id": "video-001",
  "template": "basic-overlay",
  "dynamic_text": "AUTOMATED WITH GO"
}
```

**Validation rules:**

- `video_id`, `template`, and `dynamic_text` are required.

**Success response:** `201 Created`

```json
{
  "id": "<uuid>",
  "video_id": "video-001",
  "template": "basic-overlay",
  "dynamic_text": "AUTOMATED WITH GO",
  "status": "pending",
  "created_at": "2026-03-21T00:00:00Z",
  "updated_at": "2026-03-21T00:00:00Z"
}
```

### `GET /jobs/{id}`

Get job status/details.

**Success response:** `200 OK` with job JSON  
**Failure response:** `404 Not Found` if job does not exist

---

## How to Run

### Option A: Local Go run

From `render-queue/`:

```bash
go run ./cmd/api
```

API listens on `:8080`.

Run worker prototype separately:

```bash
go run ./cmd/worker
```

### Option B: Docker Compose (dev dependencies)

```bash
docker compose up -d
```

This starts Redis and a Go container with FFmpeg installed.

---

## Quick API Test

Create a job:

```bash
curl -X POST http://localhost:8080/jobs \
  -H "Content-Type: application/json" \
  -d '{"video_id":"video-001","template":"basic-overlay","dynamic_text":"HELLO"}'
```

Fetch job by ID:

```bash
curl http://localhost:8080/jobs/<job-id>
```

---

## What Has Been Done So Far (Timeline)

### Commit: `6bcf872` — _env setup and test_

- Added `.gitignore`
- Added worker prototype at `cmd/worker/main.go`
- Added initial `docker-compose.yml`
- Added Go module setup (`go.mod`)

### Commit: `18d456d` — _api setup for jobs_ (current `HEAD`)

- Added job API handlers and models
- Added API entrypoint (`cmd/api/main.go`)
- Added task model/factory (`internal/tasks/tasks.go`)
- Updated dependencies (`go.mod`, `go.sum`)
- Updated Docker compose config

---

## Current Gaps / In-Progress Areas

- API and worker are not yet fully connected through Asynq processing.
- Job store is in-memory only (non-persistent).
- Worker currently uses fixed local file paths in `temp/`.
- No authentication/authorization, retries, dead-letter queue, or observability yet.
- No automated test suite yet.

---

## Suggested Next Milestones

1. Wire `POST /jobs` to enqueue Asynq tasks.
2. Implement worker consumer that updates job status (`processing` → `completed` / `failed`).
3. Replace in-memory `JobStore` with persistent storage.
4. Parameterize input/output media paths and template behavior.
5. Add structured logging, error handling, and basic integration tests.

---

## Development Notes

- `temp/` is intentionally gitignored for media artifacts.
- Generated binary `api.exe` may appear locally during builds; binaries are ignored via `.gitignore`.
- Keep FFmpeg availability consistent between local and container environments to avoid filter/font discrepancies.
