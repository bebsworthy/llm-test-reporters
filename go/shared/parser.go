package shared

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"
)

// Parser processes go test JSON output
type Parser struct {
	config      *ReporterConfig
	formatter   *Formatter
	classifier  *ErrorClassifier
	suites      map[string]*TestSuite
	testOutputs map[string][]string
	testStart   map[string]time.Time
	workingDir  string
	testFiles   map[string]string // maps test name to file path
}

// NewParser creates a new parser instance
func NewParser(config *ReporterConfig, writer io.Writer) *Parser {
	return &Parser{
		config:      config,
		formatter:   NewFormatter(config, writer),
		classifier:  NewErrorClassifier(),
		suites:      make(map[string]*TestSuite),
		testOutputs: make(map[string][]string),
		testStart:   make(map[string]time.Time),
		workingDir:  ".",
		testFiles:   make(map[string]string),
	}
}

// NewParserWithDir creates a new parser instance with a specific working directory
func NewParserWithDir(config *ReporterConfig, writer io.Writer, workingDir string) *Parser {
	return &Parser{
		config:      config,
		formatter:   NewFormatter(config, writer),
		classifier:  NewErrorClassifier(),
		suites:      make(map[string]*TestSuite),
		testOutputs: make(map[string][]string),
		testStart:   make(map[string]time.Time),
		workingDir:  workingDir,
		testFiles:   make(map[string]string),
	}
}

// ProcessStream processes the JSON event stream from go test
func (p *Parser) ProcessStream(reader io.Reader) error {
	scanner := bufio.NewScanner(reader)
	p.formatter.Start()
	
	var exitCode int
	
	for scanner.Scan() {
		var event TestEvent
		if err := json.Unmarshal(scanner.Bytes(), &event); err != nil {
			continue
		}
		
		if err := p.processEvent(&event); err != nil {
			return err
		}
		
		// Track exit code from fail events
		if event.Action == "fail" && event.Test == "" {
			exitCode = 1
		}
	}
	
	// Output all suites
	for _, suite := range p.suites {
		p.formatter.AddSuite(suite)
	}
	
	p.formatter.Finish(exitCode)
	return scanner.Err()
}

func (p *Parser) processEvent(event *TestEvent) error {
	switch event.Action {
	case "run":
		if event.Test != "" {
			p.testStart[event.Test] = event.Time
			p.testOutputs[event.Test] = []string{}
		}
		
	case "output":
		if event.Test != "" {
			p.testOutputs[event.Test] = append(p.testOutputs[event.Test], event.Output)
			// Try to extract file information from output
			if strings.Contains(event.Output, ".go:") {
				p.extractFileFromOutput(event.Test, event.Output)
			}
		}
		
	case "pass", "fail", "skip":
		if event.Test != "" {
			p.addTestResult(event)
		}
	}
	
	return nil
}

// extractFileFromOutput tries to extract file information from test output
func (p *Parser) extractFileFromOutput(testName, output string) {
	// Look for file:line: pattern
	output = strings.TrimSpace(output)
	if idx := strings.Index(output, ".go:"); idx > 0 {
		// Find the start of the filename
		start := 0
		for i := idx - 1; i >= 0; i-- {
			if output[i] == ' ' || output[i] == '\t' {
				start = i + 1
				break
			}
		}
		
		// Extract filename
		fileName := output[start:idx+3] // include .go
		if fileName != "" && !strings.Contains(fileName, "/") {
			// Store the file mapping
			p.testFiles[testName] = fileName
			
			// If this is a subtest, also store for the parent test
			if idx := strings.LastIndex(testName, "/"); idx != -1 {
				parentTest := testName[:idx]
				// Only set parent file if not already set
				if _, exists := p.testFiles[parentTest]; !exists {
					p.testFiles[parentTest] = fileName
				}
			}
		}
	}
}

func (p *Parser) addTestResult(event *TestEvent) {
	// Parse test name to get suite and test
	packageName := event.Package
	testName := event.Test
	fullName := testName
	
	// Handle subtests (TestName/SubtestName)
	if idx := strings.LastIndex(testName, "/"); idx != -1 {
		parentTest := testName[:idx]
		testName = testName[idx+1:]
		fullName = parentTest + " > " + testName
	}
	
	// Determine status
	var status TestStatus
	switch event.Action {
	case "pass":
		status = StatusPassed
	case "fail":
		status = StatusFailed
	case "skip":
		status = StatusSkipped
	}
	
	// Calculate duration
	duration := time.Duration(0)
	if startTime, ok := p.testStart[event.Test]; ok {
		duration = event.Time.Sub(startTime)
	}
	if event.Elapsed > 0 {
		duration = time.Duration(event.Elapsed * float64(time.Second))
	}
	
	// Create test result
	result := TestResult{
		Name:     testName,
		FullName: fullName,
		Status:   status,
		Duration: duration,
	}
	
	// Extract error information and determine file
	var fileName string
	
	if status == StatusFailed {
		errorInfo, fn, ln := p.extractErrorInfo(event.Test)
		result.Error = errorInfo
		if ln > 0 {
			result.LineNumber = ln
		}
		if fn != "" {
			fileName = fn
		}
	}
	
	// Check if we have file information from output parsing
	if fileName == "" {
		if fn, ok := p.testFiles[event.Test]; ok {
			fileName = fn
		}
	}
	
	// Determine suite based on file
	var suiteName string
	var suitePath string
	
	if fileName != "" {
		// Construct full path
		fullPath := filepath.Join(p.workingDir, fileName)
		result.FilePath = fullPath
		// Use file path as suite
		suitePath = fullPath
		suiteName = suitePath
	} else {
		// Fall back to directory-based suite
		suitePath = filepath.Join(p.workingDir, "tests")
		suiteName = suitePath
		result.FilePath = packageName
	}
	
	// Get or create suite
	suite, exists := p.suites[suiteName]
	if !exists {
		suite = &TestSuite{
			Name:     suiteName,
			FilePath: suitePath,
			Tests:    []TestResult{},
		}
		p.suites[suiteName] = suite
	}
	
	suite.Tests = append(suite.Tests, result)
}

func (p *Parser) extractErrorInfo(testName string) (*ErrorInfo, string, int) {
	outputs := p.testOutputs[testName]
	if len(outputs) == 0 {
		return nil, "", 0
	}
	
	// Find error message, file name, and line number
	var errorMsg string
	var fileName string
	var lineNum int
	
	for _, output := range outputs {
		// Skip RUN and FAIL lines
		if strings.HasPrefix(output, "=== RUN") || strings.HasPrefix(output, "--- FAIL") {
			continue
		}
		
		// Look for file:line: pattern (e.g., "    all_failing_test.go:13: Expected 10 but got 5")
		output = strings.TrimSpace(output)
		if idx := strings.Index(output, ".go:"); idx > 0 {
			// Find the start of the filename (after any whitespace)
			start := 0
			for i := idx - 1; i >= 0; i-- {
				if output[i] == ' ' || output[i] == '\t' {
					start = i + 1
					break
				}
			}
			
			// Extract filename
			fileName = output[start:idx+3] // include .go
			
			// Extract line number and message
			remaining := output[idx+4:] // skip ".go:"
			if colonIdx := strings.Index(remaining, ":"); colonIdx > 0 {
				// Parse line number
				fmt.Sscanf(remaining[:colonIdx], "%d", &lineNum)
				// Extract message
				errorMsg = strings.TrimSpace(remaining[colonIdx+1:])
			}
		} else if strings.TrimSpace(output) != "" && errorMsg == "" {
			// Use first non-empty line as error message
			errorMsg = strings.TrimSpace(output)
		}
	}
	
	if errorMsg == "" {
		errorMsg = "Test failed"
	}
	
	// Classify error
	errorType := p.classifier.ClassifyError(errorMsg)
	
	// Create error info
	errorInfo := &ErrorInfo{
		Type:    errorType,
		Message: errorMsg,
	}
	
	// Extract expected/actual values
	expected, actual := p.classifier.ExtractValues(errorMsg)
	if expected != "" {
		errorInfo.Expected = expected
		errorInfo.Actual = actual
	}
	
	// Generate fix hint
	errorInfo.FixHint = p.classifier.GenerateFixHint(errorInfo)
	
	// Store line number if available
	if lineNum > 0 && p.config.Mode == "detailed" {
		// In a real implementation, we'd read the file and extract context
		// Line number will be stored with the test result
	}
	
	return errorInfo, fileName, lineNum
}