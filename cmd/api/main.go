package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/hibiken/asynq"
	"render-queue/api"
	"render-queue/internal/config"
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

	queueClient := asynq.NewClient(asynq.RedisClientOpt{Addr: redisAddr})
	defer queueClient.Close()

	store := api.NewJobStore()
	cfg := config.NewConfigManager()
	handler := api.NewHandler(store, cfg, queueClient)

	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	addr := ":9090"
	fmt.Printf("Render Queue API server starting on %s (Redis: %s)\n", addr, redisAddr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
