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
	"render-queue/internal/config"
	"render-queue/internal/processor"
	"render-queue/internal/tasks"
)

var (
	cfg    *config.ConfigManager
	apiURL string
)

func main() {
	redisAddr := "localhost:6379"
	if envAddr := os.Getenv("REDIS_HOST"); envAddr != "" {
		redisPort := os.Getenv("REDIS_PORT")
		if redisPort == "" {
			redisPort = "6379"
		}
		redisAddr = envAddr + ":" + redisPort
	}

	apiURL = "http://localhost:9090"
	if envAPI := os.Getenv("API_URL"); envAPI != "" {
		apiURL = envAPI
	}

	cfg = config.NewConfigManager()

	concurrency := 3
	if envConc := os.Getenv("WORKER_CONCURRENCY"); envConc != "" {
		if val, err := strconv.Atoi(envConc); err == nil && val > 0 {
			concurrency = val
		}
	}

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

	profile := cfg.Profiles().ResolveProfile(payload.TemplateID)
	if profile == nil {
		errMsg := fmt.Sprintf("unknown template_id: %s", payload.TemplateID)
		patchStatus(payload.JobID, "failed", errMsg)
		return fmt.Errorf(errMsg)
	}

	inputPath := filepath.Join("temp", payload.InputVideoURL)
	outputDir := filepath.Join("temp", "output", payload.JobID)

	fontPath := ""
	if _, err := os.Stat("temp/font.ttf"); err == nil {
		fontPath = "temp/font.ttf"
	}

	req := processor.ProcessRequest{
		InputPath:   inputPath,
		OutputDir:   outputDir,
		Profile:     profile,
		DynamicText: processor.DynamicText{Top: payload.DynamicText.Top, Bottom: payload.DynamicText.Bottom},
		FontPath:    fontPath,
	}

	result, err := processor.Process(req)
	if err != nil {
		errMsg := fmt.Sprintf("processing failed: %v", err)
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