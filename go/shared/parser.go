package shared

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
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
		}
		
	case "pass", "fail", "skip":
		if event.Test != "" {
			p.addTestResult(event)
		}
	}
	
	return nil
}

func (p *Parser) addTestResult(event *TestEvent) {
	// Parse test name to get suite and test
	suiteName := event.Package
	testName := event.Test
	fullName := testName
	
	// Handle subtests (TestName/SubtestName)
	if idx := strings.LastIndex(testName, "/"); idx != -1 {
		parentTest := testName[:idx]
		testName = testName[idx+1:]
		fullName = parentTest + " > " + testName
	}
	
	// Get or create suite
	suite, exists := p.suites[suiteName]
	if !exists {
		suite = &TestSuite{
			Name:     suiteName,
			FilePath: suiteName, // Go doesn't provide file path in JSON
			Tests:    []TestResult{},
		}
		p.suites[suiteName] = suite
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
	
	// Extract error information for failed tests
	if status == StatusFailed {
		result.Error = p.extractErrorInfo(event.Test)
	}
	
	suite.Tests = append(suite.Tests, result)
}

func (p *Parser) extractErrorInfo(testName string) *ErrorInfo {
	outputs := p.testOutputs[testName]
	if len(outputs) == 0 {
		return nil
	}
	
	// Find error message and location
	var errorMsg string
	var lineNum int
	
	for _, output := range outputs {
		// Skip RUN and FAIL lines
		if strings.HasPrefix(output, "=== RUN") || strings.HasPrefix(output, "--- FAIL") {
			continue
		}
		
		// Look for file:line: pattern
		if strings.Contains(output, ".go:") {
			parts := strings.SplitN(output, ":", 3)
			if len(parts) >= 3 {
				// Extract message after file:line:
				errorMsg = strings.TrimSpace(parts[2])
				// Parse line number
				if n := strings.LastIndex(parts[1], ":"); n > 0 {
					// Handle case where line might be "file.go:123"
					lineStr := parts[1]
					if idx := strings.LastIndex(lineStr, ".go"); idx > 0 {
						lineStr = lineStr[idx+3:]
						if lineStr != "" && lineStr[0] == ':' {
							lineStr = lineStr[1:]
						}
					}
					// Try to parse line number
					var line int
					fmt.Sscanf(lineStr, "%d", &line)
					if line > 0 {
						lineNum = line
					}
				}
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
	
	return errorInfo
}