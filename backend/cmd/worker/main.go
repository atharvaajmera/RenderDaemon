// main.go — Asynq worker that consumes video:render tasks, resolves profiles, and runs FFmpeg via the VideoProcessor.
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"

	"github.com/hibiken/asynq"
	"github.com/joho/godotenv"
	"render-queue/internal/config"
	"render-queue/internal/db"
	"render-queue/internal/processor"
	"render-queue/internal/repository"
	"render-queue/internal/tasks"
	"render-queue/internal/workflow"
)

var (
	cfg  *config.ConfigManager
	repo repository.JobRepository
)

func main() {
	godotenv.Load()

	redisAddr := os.Getenv("REDIS_HOST") + ":" + os.Getenv("REDIS_PORT")
	databaseURL := os.Getenv("DATABASE_URL")

	ctx := context.Background()
	pool, err := db.Connect(ctx, databaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	repo = repository.NewPostgresJobRepository(pool)

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

	fmt.Printf("Worker starting (Redis: %s, Concurrency: %d)\n", redisAddr, concurrency)
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

	patchStatus(ctx, payload.JobID, "processing", "")
	inputPath := filepath.Join("storage", payload.InputVideoURL)
	outputDir := filepath.Join("storage", "tmp", payload.JobID)

	fontPath := ""
	if _, err := os.Stat("storage/font.ttf"); err == nil {
		fontPath = "storage/font.ttf"
	}

	req := processor.ProcessRequest{
		InputPath:   inputPath,
		OutputDir:   outputDir,
		DynamicText: processor.DynamicText{Top: payload.DynamicText.Top, Bottom: payload.DynamicText.Bottom},
		FontPath:    fontPath,
		OnProgress: func(progress float64) {
			patchProgress(context.Background(), payload.JobID, progress)
		},
	}

	var result *processor.ProcessResult
	var processErr error

	if wf := cfg.Workflows().Get(payload.TemplateID); wf != nil {
		log.Printf("[job %s] executing workflow: %s", payload.JobID, wf.Name)
		exec := workflow.NewExecutor(cfg.Profiles())
		result, processErr = exec.Execute(ctx, wf, req, func(msg string) {
			patchStatus(ctx, payload.JobID, "processing", msg)
		})
	} else if profile := cfg.Profiles().ResolveProfile(payload.TemplateID); profile != nil {
		log.Printf("[job %s] executing profile: %s", payload.JobID, profile.Operation)
		req.Profile = profile
		result, processErr = processor.Process(ctx, req)
	} else {
		errMsg := fmt.Sprintf("unknown template_id (not a profile or workflow): %s", payload.TemplateID)
		patchStatus(ctx, payload.JobID, "failed", errMsg)
		return fmt.Errorf("unknown template: %s", payload.TemplateID)
	}

	if processErr != nil {
		errMsg := fmt.Sprintf("processing failed: %v", processErr)
		log.Printf("[job %s] %s", payload.JobID, errMsg)
		patchStatus(ctx, payload.JobID, "failed", errMsg)
		return fmt.Errorf("processing error: %w", processErr)
	}

	// Move outputs to renders folder and clean up temp workspace
	if err := finalizeRenderOutputs(payload.JobID); err != nil {
		errMsg := fmt.Sprintf("failed to finalize outputs: %v", err)
		log.Printf("[job %s] %s", payload.JobID, errMsg)
		patchStatus(ctx, payload.JobID, "failed", errMsg)
		return fmt.Errorf("finalization error: %w", err)
	}

	// Update the final output path to the renders directory
	finalOutputPath := filepath.Join("storage", "renders", payload.JobID, filepath.Base(result.OutputPath))
	log.Printf("[job %s] completed — output: %s", payload.JobID, finalOutputPath)
	patchStatus(ctx, payload.JobID, "completed", finalOutputPath)
	return nil
}

func finalizeRenderOutputs(jobID string) error {
	tempDir := filepath.Join("storage", "tmp", jobID)
	renderDir := filepath.Join("storage", "renders", jobID)

	if err := os.MkdirAll(renderDir, 0755); err != nil {
		return fmt.Errorf("failed to create render directory: %w", err)
	}

	entries, err := os.ReadDir(tempDir)
	if err != nil {
		return fmt.Errorf("failed to read temp directory: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		src := filepath.Join(tempDir, entry.Name())
		dst := filepath.Join(renderDir, entry.Name())
		if err := os.Rename(src, dst); err != nil {
			return fmt.Errorf("failed to move file %s to %s: %w", src, dst, err)
		}
	}

	// Clean up tempDir (recursively deletes any remaining step subfolders)
	os.RemoveAll(tempDir)
	return nil
}

func patchStatus(ctx context.Context, jobID, status, result string) {
	_, err := repo.UpdateStatus(ctx, jobID, status, result)
	if err != nil {
		log.Printf("[job %s] failed to update status to %s: %v", jobID, status, err)
	}
}

func patchProgress(ctx context.Context, jobID string, progress float64) {
	_, err := repo.UpdateProgress(ctx, jobID, progress)
	if err != nil {
		log.Printf("[job %s] failed to update progress %f: %v", jobID, progress, err)
	}
}