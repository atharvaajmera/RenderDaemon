// processor.go — FFmpeg command builder and executor. Translates resolved profiles into FFmpeg commands for all supported operations.
package processor

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"

	"render-queue/internal/config"
)

type DynamicText struct {
	Top    string
	Bottom string
}

type ProcessRequest struct {
	InputPath   string
	OutputDir   string
	Profile     *config.Profile
	DynamicText DynamicText
	FontPath    string
}

type ProcessResult struct {
	OutputPath string
}

func Process(req ProcessRequest) (*ProcessResult, error) {
	if err := os.MkdirAll(req.OutputDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %v", err)
	}

	switch req.Profile.Operation {
	case "transcode":
		return processTranscode(req)
	case "compress":
		return processCompress(req)
	case "scale":
		return processScale(req)
	case "extract_audio":
		return processExtractAudio(req)
	case "thumbnail":
		return processThumbnail(req)
	case "preview_gif":
		return processPreviewGIF(req)
	case "watermark":
		return processWatermark(req)
	default:
		return nil, fmt.Errorf("unsupported operation: %s", req.Profile.Operation)
	}
}

func processTranscode(req ProcessRequest) (*ProcessResult, error) {
	p := req.Profile.Parameters
	outputFormat := getParam(p, "format", "mp4")
	outputPath := filepath.Join(req.OutputDir, "output."+outputFormat)

	args := []string{"-i", req.InputPath}

	vf := buildDrawtextFilter(req.DynamicText, req.FontPath)
	if vf != "" {
		args = append(args, "-vf", vf)
	}

	if codec := getParam(p, "codec", ""); codec != "" {
		args = append(args, "-c:v", codec)
	}
	if preset := getParam(p, "preset", ""); preset != "" {
		args = append(args, "-preset", preset)
	}
	if crf := getParam(p, "crf", ""); crf != "" {
		args = append(args, "-crf", crf)
	}

	args = append(args, "-c:a", "copy", "-y", outputPath)
	return runAndReturn(args, outputPath)
}

func processCompress(req ProcessRequest) (*ProcessResult, error) {
	p := req.Profile.Parameters
	outputFormat := getParam(p, "format", "mp4")
	outputPath := filepath.Join(req.OutputDir, "output."+outputFormat)

	args := []string{"-i", req.InputPath}

	var videoFilters []string
	if res := getParam(p, "resolution", ""); res != "" {
		videoFilters = append(videoFilters, "scale="+resolutionToScale(res))
	}

	textFilter := buildDrawtextFilter(req.DynamicText, req.FontPath)
	if textFilter != "" {
		videoFilters = append(videoFilters, textFilter)
	}

	if len(videoFilters) > 0 {
		args = append(args, "-vf", strings.Join(videoFilters, ","))
	}

	if codec := getParam(p, "codec", ""); codec != "" {
		args = append(args, "-c:v", codec)
	}

	if targetMB := getParam(p, "target_size_mb", ""); targetMB != "" {
		if sizeBytes, err := mbToBytes(targetMB); err == nil {
			args = append(args, "-fs", strconv.FormatInt(sizeBytes, 10))
		}
	}

	args = append(args, "-c:a", "copy", "-y", outputPath)
	return runAndReturn(args, outputPath)
}

func processScale(req ProcessRequest) (*ProcessResult, error) {
	p := req.Profile.Parameters
	outputFormat := getParam(p, "format", "mp4")
	outputPath := filepath.Join(req.OutputDir, "output."+outputFormat)

	args := []string{"-i", req.InputPath}

	var videoFilters []string
	if res := getParam(p, "resolution", ""); res != "" {
		videoFilters = append(videoFilters, "scale="+resolutionToScale(res))
	}

	textFilter := buildDrawtextFilter(req.DynamicText, req.FontPath)
	if textFilter != "" {
		videoFilters = append(videoFilters, textFilter)
	}

	if len(videoFilters) > 0 {
		args = append(args, "-vf", strings.Join(videoFilters, ","))
	}

	if codec := getParam(p, "codec", ""); codec != "" {
		args = append(args, "-c:v", codec)
	}
	if preset := getParam(p, "preset", ""); preset != "" {
		args = append(args, "-preset", preset)
	}

	if targetMB := getParam(p, "target_size_mb", ""); targetMB != "" {
		if sizeBytes, err := mbToBytes(targetMB); err == nil {
			args = append(args, "-fs", strconv.FormatInt(sizeBytes, 10))
		}
	}

	args = append(args, "-c:a", "copy", "-y", outputPath)
	return runAndReturn(args, outputPath)
}

func processExtractAudio(req ProcessRequest) (*ProcessResult, error) {
	p := req.Profile.Parameters
	outputFormat := getParam(p, "format", "mp3")
	outputPath := filepath.Join(req.OutputDir, "output."+outputFormat)

	args := []string{"-i", req.InputPath, "-vn"}

	if bitrate := getParam(p, "bitrate", ""); bitrate != "" {
		args = append(args, "-b:a", bitrate)
	}

	args = append(args, "-y", outputPath)
	return runAndReturn(args, outputPath)
}

func processThumbnail(req ProcessRequest) (*ProcessResult, error) {
	p := req.Profile.Parameters
	outputFormat := getParam(p, "format", "jpg")
	outputPath := filepath.Join(req.OutputDir, "thumbnail."+outputFormat)

	args := []string{"-i", req.InputPath}

	if timestamp := getParam(p, "time", ""); timestamp != "" {
		args = append(args, "-ss", timestamp)
	}

	if res := getParam(p, "resolution", ""); res != "" {
		args = append(args, "-vf", "scale="+resolutionToScale(res))
	}

	args = append(args, "-frames:v", "1", "-y", outputPath)
	return runAndReturn(args, outputPath)
}

func processPreviewGIF(req ProcessRequest) (*ProcessResult, error) {
	p := req.Profile.Parameters
	outputPath := filepath.Join(req.OutputDir, "preview.gif")

	args := []string{"-i", req.InputPath}

	if start := getParam(p, "start", ""); start != "" {
		args = append(args, "-ss", start)
	}
	if duration := getParam(p, "duration", ""); duration != "" {
		args = append(args, "-t", duration)
	}

	fps := getParam(p, "fps", "10")
	width := getParam(p, "width", "320")
	palettegen := fmt.Sprintf("fps=%s,scale=%s:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse", fps, width)
	args = append(args, "-filter_complex", palettegen, "-y", outputPath)

	return runAndReturn(args, outputPath)
}

func processWatermark(req ProcessRequest) (*ProcessResult, error) {
	p := req.Profile.Parameters
	outputFormat := getParam(p, "format", "mp4")
	outputPath := filepath.Join(req.OutputDir, "output."+outputFormat)

	watermarkPath := getParam(p, "watermark_path", "")
	if watermarkPath == "" {
		return nil, fmt.Errorf("watermark operation requires watermark_path parameter")
	}

	posX := getParam(p, "position_x", "10")
	posY := getParam(p, "position_y", "10")
	overlay := fmt.Sprintf("overlay=%s:%s", posX, posY)

	textFilter := buildDrawtextFilter(req.DynamicText, req.FontPath)
	if textFilter != "" {
		overlay = overlay + "," + textFilter
	}

	args := []string{
		"-i", req.InputPath,
		"-i", watermarkPath,
		"-filter_complex", overlay,
		"-c:a", "copy",
		"-y", outputPath,
	}

	return runAndReturn(args, outputPath)
}

func buildDrawtextFilter(dt DynamicText, fontPath string) string {
	var filters []string

	if dt.Top != "" {
		f := "drawtext="
		if fontPath != "" {
			f += "fontfile=" + fontPath + ":"
		}
		f += fmt.Sprintf("text='%s':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.5:boxborderw=10:x=(w-text_w)/2:y=30",
			escapeFFmpegText(dt.Top))
		filters = append(filters, f)
	}

	if dt.Bottom != "" {
		f := "drawtext="
		if fontPath != "" {
			f += "fontfile=" + fontPath + ":"
		}
		f += fmt.Sprintf("text='%s':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.5:boxborderw=10:x=(w-text_w)/2:y=h-text_h-30",
			escapeFFmpegText(dt.Bottom))
		filters = append(filters, f)
	}

	return strings.Join(filters, ",")
}

func escapeFFmpegText(text string) string {
	text = strings.ReplaceAll(text, "\\", "\\\\")
	text = strings.ReplaceAll(text, "'", "'\\''")
	text = strings.ReplaceAll(text, ":", "\\:")
	return text
}

func resolutionToScale(res string) string {
	return strings.Replace(res, "x", ":", 1)
}

func mbToBytes(mb string) (int64, error) {
	val, err := strconv.ParseFloat(mb, 64)
	if err != nil {
		return 0, err
	}
	return int64(val * 1024 * 1024), nil
}

func getParam(params map[string]string, key, fallback string) string {
	if v, ok := params[key]; ok && v != "" {
		return v
	}
	return fallback
}

func runAndReturn(args []string, outputPath string) (*ProcessResult, error) {
	cmd := exec.Command("ffmpeg", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("ffmpeg failed: %v", err)
	}

	return &ProcessResult{OutputPath: outputPath}, nil
}
