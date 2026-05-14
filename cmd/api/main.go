package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/hibiken/asynq"
	"github.com/joho/godotenv"
	"render-queue/api"
	"render-queue/internal/config"
)

func main() {
	godotenv.Load()

	redisAddr := os.Getenv("REDIS_HOST") + ":" + os.Getenv("REDIS_PORT")
	apiPort := os.Getenv("API_PORT")

	queueClient := asynq.NewClient(asynq.RedisClientOpt{Addr: redisAddr})
	defer queueClient.Close()

	store := api.NewJobStore()
	cfg := config.NewConfigManager()
	handler := api.NewHandler(store, cfg, queueClient)

	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	addr := ":" + apiPort
	fmt.Printf("Render Queue API starting on %s (Redis: %s)\n", addr, redisAddr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
