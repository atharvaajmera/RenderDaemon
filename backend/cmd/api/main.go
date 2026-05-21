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

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	godotenv.Load()

	redisAddr := os.Getenv("REDIS_HOST") + ":" + os.Getenv("REDIS_PORT")
	apiPort := os.Getenv("API_PORT")

	queueClient := asynq.NewClient(asynq.RedisClientOpt{Addr: redisAddr})
	defer queueClient.Close()

	inspector := asynq.NewInspector(asynq.RedisClientOpt{Addr: redisAddr})
	defer inspector.Close()

	store := api.NewJobStore()
	cfg := config.NewConfigManager()
	handler := api.NewHandler(store, cfg, queueClient, inspector)

	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	addr := ":" + apiPort
	fmt.Printf("Render Queue API starting on %s (Redis: %s)\n", addr, redisAddr)
	if err := http.ListenAndServe(addr, enableCORS(mux)); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
