FROM golang:1.24-bookworm AS builder
WORKDIR /app

# Copy go mod files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code and build binaries
COPY . .
RUN CGO_ENABLED=0 go build -o /api ./cmd/api
RUN CGO_ENABLED=0 go build -o /worker ./cmd/worker

# Final minimal image
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy binaries and config
COPY --from=builder /api /api
COPY --from=builder /worker /worker
COPY --from=builder /app/internal/config /app/internal/config

# Create storage directories
RUN mkdir -p /app/storage/uploads /app/storage/renders /app/storage/tmp
WORKDIR /app

# Run both API and Worker in one container
COPY <<'EOF' /start.sh
#!/bin/sh
# Start the worker in the background
/worker &
# Start the API in the foreground
exec /api
EOF
RUN chmod +x /start.sh

# Render.com provides the PORT environment variable dynamically
EXPOSE ${PORT:-9090}

CMD ["/start.sh"]
