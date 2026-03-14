package main

import (
	"fmt"
	"log"
	"net/http"

	"render-queue/api"
)

func main() {
	store := api.NewJobStore()
	handler := api.NewHandler(store)

	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	addr := ":8080"
	fmt.Printf("Render Queue API server starting on %s\n", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
