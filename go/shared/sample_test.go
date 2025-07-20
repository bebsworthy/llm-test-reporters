package shared

import (
	"testing"
	"time"
)

func TestBasicAssertion(t *testing.T) {
	expected := 10
	actual := 5
	if actual != expected {
		t.Errorf("Expected %d but got %d", expected, actual)
	}
}

func TestTableDriven(t *testing.T) {
	tests := []struct {
		name     string
		input    int
		expected int
	}{
		{"positive", 5, 10},
		{"negative", -5, -10},
		{"zero", 0, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.input * 2
			if result != tt.expected {
				t.Errorf("For %s: expected %d, got %d", tt.name, tt.expected, result)
			}
		})
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
		t.Fatal("Test timed out")
	}
}

func TestSkipped(t *testing.T) {
	t.Skip("Skipping this test")
}

func TestPanic(t *testing.T) {
	defer func() {
		if r := recover(); r == nil {
			t.Errorf("The code did not panic")
		}
	}()
	panic("Something went wrong")
}