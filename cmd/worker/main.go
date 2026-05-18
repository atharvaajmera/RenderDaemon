// main.go — Asynq worker that consumes video:render tasks, resolves profiles, and runs FFmpeg via the VideoProcessor.
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/hibiken/asynq"
	"github.com/joho/godotenv"
	"render-queue/internal/config"
	"render-queue/internal/processor"
	"render-queue/internal/tasks"
	"render-queue/internal/workflow"
)

var (
	cfg    *config.ConfigManager
	apiURL string
)

func main() {
	godotenv.Load()

	redisAddr := os.Getenv("REDIS_HOST") + ":" + os.Getenv("REDIS_PORT")
	apiURL = os.Getenv("API_URL")

	concurrency := 3
	if val, err := strconv.Atoi(os.Getenv("WORKER_CONCURRENCY")); err == nil && val > 0 {
		concurrency = val
	}

	cfg = config.NewConfigManager()

	srv := asynq.NewServer(
		asynq.RedisClientOpt{Addr: redisAddr},
		asynq.Config{Concurrency: concurrency},
	)

	mux := asynq.NewServeMux()
	mux.HandleFunc(tasks.TypeRenderVideo, handleRenderVideo)

	fmt.Printf("Worker starting (Redis: %s, API: %s, Concurrency: %d)\n", redisAddr, apiURL, concurrency)
	if err := srv.Run(mux); err != nil {
		log.Fatalf("worker failed: %v", err)
	}
}

func handleRenderVideo(ctx context.Context, t *asynq.Task) error {
	var payload tasks.RenderVideoPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to decode payload: %v", err)
	}

	log.Printf("[job %s] received — template: %s, input: %s", payload.JobID, payload.TemplateID, payload.InputVideoURL)

	patchStatus(payload.JobID, "processing", "")
	inputPath := filepath.Join("temp", payload.InputVideoURL)
	outputDir := filepath.Join("temp", "output", payload.JobID)

	fontPath := ""
	if _, err := os.Stat("temp/font.ttf"); err == nil {
		fontPath = "temp/font.ttf"
	}

	req := processor.ProcessRequest{
		InputPath:   inputPath,
		OutputDir:   outputDir,
		DynamicText: processor.DynamicText{Top: payload.DynamicText.Top, Bottom: payload.DynamicText.Bottom},
		FontPath:    fontPath,
		OnProgress: func(progress float64) {
			patchProgress(payload.JobID, progress)
		},
	}

	var result *processor.ProcessResult
	var processErr error

	if wf := cfg.Workflows().Get(payload.TemplateID); wf != nil {
		log.Printf("[job %s] executing workflow: %s", payload.JobID, wf.Name)
		exec := workflow.NewExecutor(cfg.Profiles())
		result, processErr = exec.Execute(ctx, wf, req, func(msg string) {
			patchStatus(payload.JobID, "processing", msg)
		})
	} else if profile := cfg.Profiles().ResolveProfile(payload.TemplateID); profile != nil {
		log.Printf("[job %s] executing profile: %s", payload.JobID, profile.Operation)
		req.Profile = profile
		result, processErr = processor.Process(ctx, req)
	} else {
		errMsg := fmt.Sprintf("unknown template_id (not a profile or workflow): %s", payload.TemplateID)
		patchStatus(payload.JobID, "failed", errMsg)
		return fmt.Errorf(errMsg)
	}

	if processErr != nil {
		errMsg := fmt.Sprintf("processing failed: %v", processErr)
		log.Printf("[job %s] %s", payload.JobID, errMsg)
		patchStatus(payload.JobID, "failed", errMsg)
		return fmt.Errorf(errMsg)
	}

	log.Printf("[job %s] completed — output: %s", payload.JobID, result.OutputPath)
	patchStatus(payload.JobID, "completed", result.OutputPath)
	return nil
}

func patchStatus(jobID, status, result string) {
	body, _ := json.Marshal(map[string]string{
		"status": status,
		"result": result,
	})

	req, err := http.NewRequest(http.MethodPatch, fmt.Sprintf("%s/jobs/%s/status", apiURL, jobID), bytes.NewReader(body))
	if err != nil {
		log.Printf("[job %s] failed to create PATCH request: %v", jobID, err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("[job %s] failed to PATCH status to %s: %v", jobID, status, err)
		return
	}
	resp.Body.Close()
}

func patchProgress(jobID string, progress float64) {
	body, _ := json.Marshal(map[string]float64{
		"progress": progress,
	})

	req, err := http.NewRequest(http.MethodPatch, fmt.Sprintf("%s/jobs/%s/progress", apiURL, jobID), bytes.NewReader(body))
	if err != nil {
		log.Printf("[job %s] failed to create PATCH request: %v", jobID, err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("[job %s] failed to PATCH progress %f: %v", jobID, progress, err)
		return
	}
	resp.Body.Close()
}