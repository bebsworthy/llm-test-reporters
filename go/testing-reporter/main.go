package main

import (
	"flag"
	"fmt"
	"io"
	"os"
	"os/exec"
	shared "github.com/llm-reporters/go-shared"
)

func main() {
	// Parse command line flags
	var (
		mode       = flag.String("mode", "", "Output mode: summary or detailed")
		outputFile = flag.String("output", "", "Output file path")
		help       = flag.Bool("help", false, "Show help")
	)
	flag.Parse()

	if *help {
		printHelp()
		return
	}

	// Get remaining args for go test
	testArgs := flag.Args()

	// Load configuration
	config := shared.NewReporterConfig()
	
	// Override from environment
	if envMode := os.Getenv("LLM_OUTPUT_MODE"); envMode != "" {
		config.Mode = envMode
	}
	if envFile := os.Getenv("LLM_OUTPUT_FILE"); envFile != "" {
		config.OutputFile = envFile
	}
	
	// Override from flags
	if *mode != "" {
		config.Mode = *mode
	}
	if *outputFile != "" {
		config.OutputFile = *outputFile
	}

	// Validate mode
	if config.Mode != "summary" && config.Mode != "detailed" {
		config.Mode = "summary"
	}

	// Prepare output writer
	var writer io.Writer = os.Stdout
	if config.OutputFile != "" {
		file, err := os.Create(config.OutputFile)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error creating output file: %v\n", err)
			os.Exit(1)
		}
		defer file.Close()
		writer = file
	}

	// Get working directory for full paths
	workingDir, err := os.Getwd()
	if err != nil {
		workingDir = "."
	}
	
	// Create parser with working directory
	parser := shared.NewParserWithDir(config, writer, workingDir)
	
	// Check if we're reading from stdin (piped input)
	stat, _ := os.Stdin.Stat()
	if (stat.Mode() & os.ModeCharDevice) == 0 {
		// Data is being piped to stdin
		if err := parser.ProcessStream(os.Stdin); err != nil {
			fmt.Fprintf(os.Stderr, "Error processing output: %v\n", err)
			os.Exit(1)
		}
	} else {
		// Run go test command
		args := append([]string{"test", "-json"}, testArgs...)
		cmd := exec.Command("go", args...)
		cmd.Stderr = os.Stderr

		// Get command output
		stdout, err := cmd.StdoutPipe()
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error creating pipe: %v\n", err)
			os.Exit(1)
		}

		// Start the command
		if err := cmd.Start(); err != nil {
			fmt.Fprintf(os.Stderr, "Error starting go test: %v\n", err)
			os.Exit(1)
		}

		// Process the output
		if err := parser.ProcessStream(stdout); err != nil {
			fmt.Fprintf(os.Stderr, "Error processing output: %v\n", err)
		}

		// Wait for command to complete
		if err := cmd.Wait(); err != nil {
			// This is expected if tests fail
			if _, ok := err.(*exec.ExitError); !ok {
				fmt.Fprintf(os.Stderr, "Error running go test: %v\n", err)
			}
			os.Exit(1)
		}
	}
}

func printHelp() {
	fmt.Println("Go LLM Test Reporter")
	fmt.Println()
	fmt.Println("Usage: llm-go-test [flags] [go test flags]")
	fmt.Println()
	fmt.Println("Flags:")
	fmt.Println("  -mode string")
	fmt.Println("        Output mode: summary or detailed (default: summary)")
	fmt.Println("  -output string")
	fmt.Println("        Output file path (default: stdout)")
	fmt.Println("  -help")
	fmt.Println("        Show this help message")
	fmt.Println()
	fmt.Println("Environment variables:")
	fmt.Println("  LLM_OUTPUT_MODE    Output mode (summary/detailed)")
	fmt.Println("  LLM_OUTPUT_FILE    Output file path")
	fmt.Println()
	fmt.Println("Examples:")
	fmt.Println("  llm-go-test                    # Run all tests in summary mode")
	fmt.Println("  llm-go-test -mode detailed     # Run all tests in detailed mode")
	fmt.Println("  llm-go-test ./...              # Run all tests recursively")
	fmt.Println("  llm-go-test -v ./...           # Verbose output passed to go test")
	fmt.Println("  llm-go-test -run TestSpecific  # Run specific test")
}