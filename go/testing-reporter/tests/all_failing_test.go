package tests

import (
	"errors"
	"testing"
	"time"
)

func TestAssertionFailure(t *testing.T) {
	expected := 10
	actual := 5
	if actual != expected {
		t.Errorf("Expected %d but got %d", expected, actual)
	}
}

func TestNilPointerError(t *testing.T) {
	var ptr *string
	// This would panic in real code, but we'll just fail
	if ptr == nil {
		t.Error("nil pointer dereference")
	}
}

func TestIndexOutOfBounds(t *testing.T) {
	arr := []int{1, 2, 3}
	index := 10
	if index >= len(arr) {
		t.Errorf("index out of range: %d >= %d", index, len(arr))
	}
}

func TestTypeError(t *testing.T) {
	var val interface{} = "string"
	if _, ok := val.(int); !ok {
		t.Error("type mismatch: cannot convert string to int")
	}
}

func TestTimeout(t *testing.T) {
	done := make(chan bool)
	go func() {
		time.Sleep(2 * time.Second)
		done <- true
	}()

	select {
	case <-done:
		t.Log("Completed")
	case <-time.After(100 * time.Millisecond):
		t.Fatal("test timed out after 100ms")
	}
}

func TestSubtests(t *testing.T) {
	tests := []struct {
		name     string
		input    int
		expected int
	}{
		{"double positive", 5, 10},
		{"double negative", -5, -10},
		{"double zero", 0, 1}, // This will fail
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.input * 2
			if result != tt.expected {
				t.Errorf("For %s: want %d, got %d", tt.name, tt.expected, result)
			}
		})
	}
}

func TestPanic(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Errorf("panic: %v", r)
		}
	}()
	
	// Simulate a panic
	var x []int
	_ = x[0] // This would panic
}

func TestErrorWrapping(t *testing.T) {
	baseErr := errors.New("base error")
	wrappedErr := errors.New("wrapped: " + baseErr.Error())
	
	if wrappedErr == nil {
		t.Error("expected error but got nil")
	} else {
		t.Errorf("operation failed: %v", wrappedErr)
	}
}

func TestMultilineError(t *testing.T) {
	t.Errorf(`Complex error:
  - First issue: value mismatch
  - Second issue: type incompatible
  - Third issue: constraint violated`)
}

func TestComparisonOperators(t *testing.T) {
	a, b := 5, 10
	if a >= b {
		t.Errorf("%d should be less than %d", a, b)
	}
}