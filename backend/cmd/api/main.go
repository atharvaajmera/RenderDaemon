package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/hibiken/asynq"
	"github.com/joho/godotenv"
	"render-queue/api"
	"render-queue/internal/config"
	"render-queue/internal/db"
	"render-queue/internal/repository"
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

	redisURL := os.Getenv("REDIS_URL")
	apiPort := os.Getenv("API_PORT")

	ctx := context.Background()
	databaseURL := os.Getenv("DATABASE_URL")
	pool, err := db.Connect(ctx, databaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	if err := db.RunMigrations(ctx, pool); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	redisOpt, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		log.Fatalf("failed to parse redis url: %v", err)
	}

	queueClient := asynq.NewClient(redisOpt)
	defer queueClient.Close()

	inspector := asynq.NewInspector(redisOpt)
	defer inspector.Close()

	repo := repository.NewPostgresJobRepository(pool)
	cfg := config.NewConfigManager()
	handler := api.NewHandler(repo, cfg, queueClient, inspector)

	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	addr := ":" + apiPort
	fmt.Printf("Render Queue API starting on %s (Redis: %s)\n", addr, redisURL)
	if err := http.ListenAndServe(addr, enableCORS(mux)); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
