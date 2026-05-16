// file_handler.go — HTTP handlers for file upload and download operations.
package api

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

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

// handleDownload — GET /download/{job_id}/{filename}
func (h *Handler) handleDownload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method not allowed, use GET",
		})
		return
	}

	// Parse path: /download/{job_id}/{filename}
	path := strings.TrimPrefix(r.URL.Path, "/download/")
	parts := strings.SplitN(path, "/", 2)

	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "path must be /download/{job_id}/{filename}",
		})
		return
	}

	jobID := parts[0]
	filename := parts[1]

	// Path traversal protection — reject any segment containing ".."
	if strings.Contains(jobID, "..") || strings.Contains(filename, "..") {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid path",
		})
		return
	}

	filePath := filepath.Join("temp", "output", jobID, filepath.Base(filename))

	info, err := os.Stat(filePath)
	if err != nil || info.IsDir() {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "file not found",
		})
		return
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filepath.Base(filename)))
	http.ServeFile(w, r, filePath)
}

// handleJobOutputs — GET /jobs/{id}/outputs
func (h *Handler) handleJobOutputs(w http.ResponseWriter, r *http.Request, jobID string) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method not allowed, use GET",
		})
		return
	}

	job := h.Store.Get(jobID)
	if job == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "job not found",
		})
		return
	}

	dirPath := filepath.Join("temp", "output", jobID)
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		if os.IsNotExist(err) {
			writeJSON(w, http.StatusOK, []map[string]any{})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to read outputs directory: " + err.Error(),
		})
		return
	}

	outputs := make([]map[string]any, 0)
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			continue
		}
		outputs = append(outputs, map[string]any{
			"filename":     entry.Name(),
			"size":         info.Size(),
			"download_url": fmt.Sprintf("/download/%s/%s", jobID, entry.Name()),
		})
	}

	writeJSON(w, http.StatusOK, outputs)
}
