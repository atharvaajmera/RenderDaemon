// file_handler.go — HTTP handlers for file upload and download operations.
package api

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/google/uuid"
)

const defaultMaxUploadMB = 500

// getMaxUploadBytes reads MAX_UPLOAD_SIZE_MB from env, defaults to 500 MB.
func getMaxUploadBytes() int64 {
	if val, err := strconv.Atoi(os.Getenv("MAX_UPLOAD_SIZE_MB")); err == nil && val > 0 {
		return int64(val) * 1024 * 1024
	}
	return defaultMaxUploadMB * 1024 * 1024
}

// handleUpload — POST /upload
func (h *Handler) handleUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method not allowed, use POST",
		})
		return
	}

	maxBytes := getMaxUploadBytes()
	r.Body = http.MaxBytesReader(w, r.Body, maxBytes)

	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": fmt.Sprintf("failed to parse upload (max %d MB): %s", maxBytes/(1024*1024), err.Error()),
		})
		return
	}
	defer r.MultipartForm.RemoveAll()

	file, header, err := r.FormFile("file")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "missing 'file' field in multipart form: " + err.Error(),
		})
		return
	}
	defer file.Close()

	fileID := uuid.New().String()
	uploadDir := filepath.Join("temp", "uploads", fileID)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to create upload directory: " + err.Error(),
		})
		return
	}

	filename := filepath.Base(header.Filename)
	destPath := filepath.Join(uploadDir, filename)

	dest, err := os.Create(destPath)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to save file: " + err.Error(),
		})
		return
	}
	defer dest.Close()

	written, err := io.Copy(dest, file)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to write file: " + err.Error(),
		})
		return
	}

	// Return the relative path that can be used as input_video_url in POST /jobs
	relativePath := filepath.Join("uploads", fileID, filename)

	writeJSON(w, http.StatusCreated, map[string]any{
		"file_id":  fileID,
		"filename": filename,
		"size":     written,
		"path":     relativePath,
	})
}
