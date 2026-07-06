// processor.go — FFmpeg command builder and executor. Translates resolved profiles into FFmpeg commands for all supported operations.
package processor

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

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
	OnProgress  func(float64)
}

type ProcessResult struct {
	OutputPath string
}

func Process(ctx context.Context, req ProcessRequest) (*ProcessResult, error) {
	if err := os.MkdirAll(req.OutputDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %v", err)
	}

	switch req.Profile.Operation {
	case "transcode":
		return processTranscode(ctx, req)
	case "compress":
		return processCompress(ctx, req)
	case "scale":
		return processScale(ctx, req)
	case "extract_audio":
		return processExtractAudio(ctx, req)
	case "thumbnail":
		return processThumbnail(ctx, req)
	case "preview_gif":
		return processPreviewGIF(ctx, req)
	case "watermark":
		return processWatermark(ctx, req)
	default:
		return nil, fmt.Errorf("unsupported operation: %s", req.Profile.Operation)
	}
}

func processTranscode(ctx context.Context, req ProcessRequest) (*ProcessResult, error) {
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
	return runAndReturn(ctx, req, args, outputPath)
}

func processCompress(ctx context.Context, req ProcessRequest) (*ProcessResult, error) {
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
	return runAndReturn(ctx, req, args, outputPath)
}

func processScale(ctx context.Context, req ProcessRequest) (*ProcessResult, error) {
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
	return runAndReturn(ctx, req, args, outputPath)
}

func processExtractAudio(ctx context.Context, req ProcessRequest) (*ProcessResult, error) {
	p := req.Profile.Parameters
	outputFormat := getParam(p, "format", "mp3")
	outputPath := filepath.Join(req.OutputDir, "output."+outputFormat)

	args := []string{"-i", req.InputPath, "-vn"}

	if bitrate := getParam(p, "bitrate", ""); bitrate != "" {
		args = append(args, "-b:a", bitrate)
	}

	args = append(args, "-y", outputPath)
	return runAndReturn(ctx, req, args, outputPath)
}

func processThumbnail(ctx context.Context, req ProcessRequest) (*ProcessResult, error) {
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
	return runAndReturn(ctx, req, args, outputPath)
}

func processPreviewGIF(ctx context.Context, req ProcessRequest) (*ProcessResult, error) {
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

	return runAndReturn(ctx, req, args, outputPath)
}

func processWatermark(ctx context.Context, req ProcessRequest) (*ProcessResult, error) {
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

	return runAndReturn(ctx, req, args, outputPath)
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

func runAndReturn(ctx context.Context, req ProcessRequest, args []string, outputPath string) (*ProcessResult, error) {
	log.Printf("[ffmpeg] %s", strings.Join(args, " "))

	cmd := exec.CommandContext(ctx, "ffmpeg", args...)

	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to get stderr pipe: %v", err)
	}

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("ffmpeg start failed: %v", err)
	}

	durationRe := regexp.MustCompile(`Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})`)
	timeRe := regexp.MustCompile(`time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})`)

	var totalDuration time.Duration
	var lastReported float64

	scanner := bufio.NewScanner(stderrPipe)
	// FFmpeg outputs long lines sometimes, increase buffer
	buf := make([]byte, 0, 64*1024)
	scanner.Buffer(buf, 1024*1024)
	
	// Split by carriage return to handle FFmpeg's continuous status updates on one line
	scanner.Split(func(data []byte, atEOF bool) (advance int, token []byte, err error) {
		if atEOF && len(data) == 0 {
			return 0, nil, nil
		}
		if i := strings.IndexAny(string(data), "\r\n"); i >= 0 {
			return i + 1, data[0:i], nil
		}
		if atEOF {
			return len(data), data, nil
		}
		return 0, nil, nil
	})

	for scanner.Scan() {
		line := scanner.Text()
		
		if totalDuration == 0 {
			if matches := durationRe.FindStringSubmatch(line); len(matches) == 5 {
				totalDuration = parseFFmpegTime(matches)
			}
		}

		if totalDuration > 0 && req.OnProgress != nil {
			if matches := timeRe.FindStringSubmatch(line); len(matches) == 5 {
				currentTime := parseFFmpegTime(matches)
				progress := float64(currentTime) / float64(totalDuration) * 100
				progress = math.Round(progress*100) / 100
				if progress > 100 {
					progress = 100
				}
				// Debounce to 1% intervals
				if progress - lastReported >= 1.0 || progress == 100 {
					req.OnProgress(progress)
					lastReported = progress
					// Terminal feedback at coarser intervals so it stays readable
					if progress == 100 || int(progress)%5 == 0 {
						log.Printf("[ffmpeg] %s progress: %.0f%%", filepath.Base(outputPath), progress)
					}
				}
			}
		}
	}

	if err := cmd.Wait(); err != nil {
		if ctx.Err() == context.Canceled {
			log.Printf("[ffmpeg] %s cancelled", filepath.Base(outputPath))
			return nil, fmt.Errorf("ffmpeg cancelled by context")
		}
		log.Printf("[ffmpeg] %s failed: %v", filepath.Base(outputPath), err)
		return nil, fmt.Errorf("ffmpeg failed: %v", err)
	}

	// Final progress bump
	if req.OnProgress != nil && lastReported < 100.0 {
		req.OnProgress(100.0)
	}

	log.Printf("[ffmpeg] %s done", filepath.Base(outputPath))
	return &ProcessResult{OutputPath: outputPath}, nil
}

func parseFFmpegTime(matches []string) time.Duration {
	h, _ := strconv.Atoi(matches[1])
	m, _ := strconv.Atoi(matches[2])
	s, _ := strconv.Atoi(matches[3])
	ms, _ := strconv.Atoi(matches[4])
	return time.Duration(h)*time.Hour +
		time.Duration(m)*time.Minute +
		time.Duration(s)*time.Second +
		time.Duration(ms)*10*time.Millisecond
}
