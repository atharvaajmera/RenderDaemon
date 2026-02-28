package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
)

func main() {
	fmt.Println("Starting Go FFmpeg Engine...")

	inputVideo := "temp/input-test.mp4"
	fontFile := "temp/font.ttf"
	outputVideo := "temp/output-test.mp4"

	if _, err := os.Stat(inputVideo); os.IsNotExist(err) {
		log.Fatalf("Missing input video: %s", inputVideo)
	}
	if _, err := os.Stat(fontFile); os.IsNotExist(err) {
		log.Fatalf("Missing font file: %s", fontFile)
	}

	filter := fmt.Sprintf("drawtext=fontfile=%s:text='AUTOMATED WITH GO':fontcolor=white:fontsize=96:box=1:boxcolor=black@0.5:boxborderw=10:x=(w-text_w)/2:y=(h-text_h)/2", fontFile)

	args := []string{
		"-i", inputVideo,      
		"-vf", filter,         
		"-codec:a", "copy",    
		"-y",  
		outputVideo,
	}

	cmd := exec.Command("ffmpeg", args...)

	cmd.Stderr = os.Stderr
	cmd.Stdout = os.Stdout

	fmt.Println("Executing FFmpeg...")
	
	err := cmd.Run()

	if err != nil {
		log.Fatalf("FFmpeg process failed: %v\n", err)
	}

	fmt.Println("Render Complete! Check your temp/ folder for output.mp4")
}