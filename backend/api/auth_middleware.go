package api

import (
	"context"
	"net/http"
	"os"
	"strings"
)

type contextKey string

const UserIDKey contextKey = "user_id"

func (h *Handler) AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Allow background workers if they provide the correct secret
		workerSecret := os.Getenv("WORKER_SECRET")
		if workerSecret != "" && r.Header.Get("X-Worker-Secret") == workerSecret {
			ctx := context.WithValue(r.Context(), UserIDKey, "system_worker")
			next(w, r.WithContext(ctx))
			return
		}

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Unauthorized: missing Authorization header", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Unauthorized: invalid Authorization header format", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		// Call the database to validate the session token
		userID, err := h.Repo.ValidateSession(r.Context(), tokenString)
		if err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		if userID == "" {
			http.Error(w, "Unauthorized: invalid or expired session", http.StatusUnauthorized)
			return
		}

		// Inject the user ID into the request context
		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		next(w, r.WithContext(ctx))
	}
}
