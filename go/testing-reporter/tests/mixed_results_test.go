package tests

import (
	"testing"
)

func TestPassingSimple(t *testing.T) {
	if 2+2 == 4 {
		t.Log("Math works!")
	}
}

func TestFailingEquality(t *testing.T) {
	expected := 5
	actual := 4
	if actual != expected {
		t.Errorf("values not equal: %d != %d", actual, expected)
	}
}

func TestPassingComparison(t *testing.T) {
	a, b := 5, 10
	if a < b {
		t.Logf("%d is less than %d", a, b)
	}
}

func TestFailingSliceComparison(t *testing.T) {
	slice1 := []int{1, 2, 3}
	slice2 := []int{1, 2, 4}
	
	if len(slice1) != len(slice2) {
		t.Errorf("slices have different lengths")
		return
	}
	
	for i := range slice1 {
		if slice1[i] != slice2[i] {
			t.Errorf("slices differ at index %d: %d != %d", i, slice1[i], slice2[i])
			return
		}
	}
}

func TestTableDrivenMixed(t *testing.T) {
	tests := []struct {
		name     string
		a, b     int
		expected int
	}{
		{"add positives", 3, 5, 8},       // pass
		{"add negatives", -3, -5, -8},    // pass
		{"add mixed", -3, 5, 2},          // pass
		{"add zero", 0, 5, 10},           // fail
		{"add overflow", 2147483647, 1, 0}, // fail
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.a + tt.b
			if result != tt.expected {
				t.Errorf("%s: %d + %d = %d, want %d", 
					tt.name, tt.a, tt.b, result, tt.expected)
			}
		})
	}
}

func TestSkippedCondition(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping test in short mode")
	}
	// This would run in normal mode
	t.Log("Running full test")
}

func TestErrorMessage(t *testing.T) {
	err := validateInput("")
	if err == nil {
		t.Error("expected error for empty input")
	}
}

func TestPassingValidation(t *testing.T) {
	err := validateInput("valid")
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
}

// Helper function
func validateInput(s string) error {
	if s == "" {
		return nil // Bug: should return error
	}
	return nil
}