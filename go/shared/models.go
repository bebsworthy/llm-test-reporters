package shared

import (
	"time"
)

// TestStatus represents the status of a test
type TestStatus string

const (
	StatusPassed  TestStatus = "passed"
	StatusFailed  TestStatus = "failed"
	StatusSkipped TestStatus = "skipped"
)

// ErrorInfo contains detailed error information
type ErrorInfo struct {
	Type        string `json:"type"`
	Message     string `json:"message"`
	Expected    string `json:"expected,omitempty"`
	Actual      string `json:"actual,omitempty"`
	CodeContext string `json:"code_context,omitempty"`
	StackTrace  string `json:"stack_trace,omitempty"`
	FixHint     string `json:"fix_hint,omitempty"`
}

// TestResult represents a single test result
type TestResult struct {
	Name       string        `json:"name"`
	FullName   string        `json:"full_name"`
	Status     TestStatus    `json:"status"`
	Duration   time.Duration `json:"duration"`
	FilePath   string        `json:"file_path,omitempty"`
	LineNumber int           `json:"line_number,omitempty"`
	Error      *ErrorInfo    `json:"error,omitempty"`
}

// TestSuite represents a collection of tests
type TestSuite struct {
	Name     string       `json:"name"`
	FilePath string       `json:"file_path"`
	Tests    []TestResult `json:"tests"`
}

// ReporterConfig holds configuration for the reporter
type ReporterConfig struct {
	Mode            string `json:"mode"`
	OutputFile      string `json:"output_file,omitempty"`
	TruncateLength  int    `json:"truncate_length"`
	StackTraceLines int    `json:"stack_trace_lines"`
}

// NewReporterConfig creates a new reporter configuration with defaults
func NewReporterConfig() *ReporterConfig {
	return &ReporterConfig{
		Mode:            "summary",
		TruncateLength:  80,
		StackTraceLines: 3,
	}
}

// TestEvent represents a test event from go test -json
type TestEvent struct {
	Time    time.Time `json:"Time"`
	Action  string    `json:"Action"`
	Package string    `json:"Package"`
	Test    string    `json:"Test"`
	Output  string    `json:"Output"`
	Elapsed float64   `json:"Elapsed"`
}