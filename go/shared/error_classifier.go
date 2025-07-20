package shared

import (
	"regexp"
	"strings"
)

// ErrorClassifier classifies and enhances error information
type ErrorClassifier struct {
	patterns map[string]*regexp.Regexp
}

// NewErrorClassifier creates a new error classifier
func NewErrorClassifier() *ErrorClassifier {
	return &ErrorClassifier{
		patterns: map[string]*regexp.Regexp{
			"expected_got":     regexp.MustCompile(`[Ee]xpected\s+(.+?)\s+but\s+got\s+(.+)`),
			"expected_actual":  regexp.MustCompile(`expected:\s*(.+?)\s*actual:\s*(.+)`),
			"want_got":        regexp.MustCompile(`want\s+(.+?),\s*got\s+(.+)`),
			"should_be":       regexp.MustCompile(`(.+?)\s+should\s+be\s+(.+)`),
			"not_equal":       regexp.MustCompile(`(.+?)\s*!=\s*(.+)`),
			"assertion":       regexp.MustCompile(`assertion failed`),
			"nil_pointer":     regexp.MustCompile(`nil pointer|null pointer|nil reference`),
			"index_bounds":    regexp.MustCompile(`index out of (range|bounds)|array index`),
			"type_mismatch":   regexp.MustCompile(`type mismatch|cannot convert|incompatible type`),
			"timeout":         regexp.MustCompile(`timeout|timed out|deadline exceeded`),
			"panic":          regexp.MustCompile(`panic:|runtime error:`),
		},
	}
}

// ClassifyError determines the type of error
func (ec *ErrorClassifier) ClassifyError(message string) string {
	lowerMsg := strings.ToLower(message)
	
	// Check specific patterns
	if ec.patterns["nil_pointer"].MatchString(lowerMsg) {
		return "Nil Pointer"
	}
	if ec.patterns["index_bounds"].MatchString(lowerMsg) {
		return "Index Error"
	}
	if ec.patterns["type_mismatch"].MatchString(lowerMsg) {
		return "Type Error"
	}
	if ec.patterns["timeout"].MatchString(lowerMsg) {
		return "Timeout"
	}
	if ec.patterns["panic"].MatchString(message) {
		return "Panic"
	}
	if ec.patterns["assertion"].MatchString(lowerMsg) || 
	   ec.patterns["expected_got"].MatchString(message) ||
	   ec.patterns["not_equal"].MatchString(message) {
		return "Assertion Error"
	}
	
	return "Error"
}

// ExtractValues extracts expected and actual values from error message
func (ec *ErrorClassifier) ExtractValues(message string) (expected, actual string) {
	// Try different patterns
	if matches := ec.patterns["expected_got"].FindStringSubmatch(message); len(matches) > 2 {
		return strings.TrimSpace(matches[1]), strings.TrimSpace(matches[2])
	}
	if matches := ec.patterns["expected_actual"].FindStringSubmatch(message); len(matches) > 2 {
		return strings.TrimSpace(matches[1]), strings.TrimSpace(matches[2])
	}
	if matches := ec.patterns["want_got"].FindStringSubmatch(message); len(matches) > 2 {
		return strings.TrimSpace(matches[1]), strings.TrimSpace(matches[2])
	}
	if matches := ec.patterns["should_be"].FindStringSubmatch(message); len(matches) > 2 {
		return strings.TrimSpace(matches[2]), strings.TrimSpace(matches[1])
	}
	
	return "", ""
}

// GenerateFixHint generates a hint for fixing the error
func (ec *ErrorClassifier) GenerateFixHint(errorInfo *ErrorInfo) string {
	errorType := errorInfo.Type
	message := strings.ToLower(errorInfo.Message)
	
	switch errorType {
	case "Nil Pointer":
		return "Check for nil values before dereferencing"
	case "Index Error":
		return "Verify array/slice bounds before accessing"
	case "Type Error":
		return "Ensure type compatibility in operations"
	case "Timeout":
		return "Increase timeout duration or optimize the operation"
	case "Panic":
		return "Add error handling or recover from panic"
	case "Assertion Error":
		if errorInfo.Expected != "" && errorInfo.Actual != "" {
			return "Review assertion logic and expected values"
		}
		return "Check test assertions and expectations"
	}
	
	// Generic hints based on message content
	if strings.Contains(message, "not found") || strings.Contains(message, "does not exist") {
		return "Verify resource exists and path is correct"
	}
	if strings.Contains(message, "permission") || strings.Contains(message, "access denied") {
		return "Check file permissions and access rights"
	}
	if strings.Contains(message, "connection") || strings.Contains(message, "network") {
		return "Verify network connectivity and endpoints"
	}
	
	return "Review error message and stack trace for details"
}