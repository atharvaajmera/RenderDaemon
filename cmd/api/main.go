package main

import (
	"fmt"
	"log"
	"net/http"

	"render-queue/api"
	"render-queue/internal/config"
)

func main() {
	store := api.NewJobStore()
	cfg := config.NewConfigManager()
	handler := api.NewHandler(store, cfg)

	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	addr := ":9090"
	fmt.Printf("Render Queue API server starting on %s\n", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
