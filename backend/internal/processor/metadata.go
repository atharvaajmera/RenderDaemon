package processor

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"strconv"
	"strings"
)

type VideoInfo struct {
	Duration float64
	Width    int
	Height   int
	FPS      float64
	Codec    string
	Format   string
	FileSize int64
}

type ffprobeOutput struct {
	Streams []struct {
		CodecType string `json:"codec_type"`
		CodecName string `json:"codec_name"`
		Width     int    `json:"width"`
		Height    int    `json:"height"`
		AvgFrameRate string `json:"avg_frame_rate"`
	} `json:"streams"`
	Format struct {
		FormatName string `json:"format_name"`
		Duration   string `json:"duration"`
		Size       string `json:"size"`
	} `json:"format"`
}

func GetVideoInfo(ctx context.Context, inputPath string) (*VideoInfo, error) {
	cmd := exec.CommandContext(ctx, "ffprobe", 
		"-v", "quiet", 
		"-print_format", "json", 
		"-show_format", 
		"-show_streams", 
		inputPath,
	)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		if ctx.Err() == context.Canceled {
			return nil, fmt.Errorf("ffprobe cancelled by context")
		}
		return nil, fmt.Errorf("ffprobe failed: %v, stderr: %s", err, stderr.String())
	}

	var parsed ffprobeOutput
	if err := json.Unmarshal(stdout.Bytes(), &parsed); err != nil {
		return nil, fmt.Errorf("failed to parse ffprobe output: %v", err)
	}

	info := &VideoInfo{
		Format: parsed.Format.FormatName,
	}

	if parsed.Format.Duration != "" {
		if d, err := strconv.ParseFloat(parsed.Format.Duration, 64); err == nil {
			info.Duration = d
		}
	}

	if parsed.Format.Size != "" {
		if s, err := strconv.ParseInt(parsed.Format.Size, 10, 64); err == nil {
			info.FileSize = s
		}
	}

	for _, stream := range parsed.Streams {
		if stream.CodecType == "video" {
			info.Codec = stream.CodecName
			info.Width = stream.Width
			info.Height = stream.Height
			info.FPS = parseFramerate(stream.AvgFrameRate)
			break
		}
	}

	return info, nil
}

func parseFramerate(fpsStr string) float64 {
	if fpsStr == "" || fpsStr == "0/0" {
		return 0
	}
	parts := strings.Split(fpsStr, "/")
	if len(parts) == 1 {
		if val, err := strconv.ParseFloat(parts[0], 64); err == nil {
			return val
		}
		return 0
	}
	if len(parts) == 2 {
		num, err1 := strconv.ParseFloat(parts[0], 64)
		den, err2 := strconv.ParseFloat(parts[1], 64)
		if err1 == nil && err2 == nil && den != 0 {
			return num / den
		}
	}
	return 0
}
