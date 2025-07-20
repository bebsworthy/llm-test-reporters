"""All passing tests for pytest reporter validation."""

import pytest
from typing import List


class TestMathOperations:
    """Test basic math operations."""
    
    def test_addition(self):
        """Test addition operation."""
        assert 2 + 2 == 4
        assert 10 + 5 == 15
        assert -1 + 1 == 0
    
    def test_subtraction(self):
        """Test subtraction operation."""
        assert 10 - 5 == 5
        assert 0 - 1 == -1
        assert 100 - 50 == 50
    
    def test_multiplication(self):
        """Test multiplication operation."""
        assert 3 * 4 == 12
        assert 0 * 100 == 0
        assert -2 * 3 == -6
    
    def test_division(self):
        """Test division operation."""
        assert 10 / 2 == 5
        assert 100 / 10 == 10
        assert 7 / 2 == 3.5


class TestStringOperations:
    """Test string operations."""
    
    def test_concatenation(self):
        """Test string concatenation."""
        assert "Hello" + " " + "World" == "Hello World"
        assert "Python" + "3" == "Python3"
    
    def test_string_methods(self):
        """Test string methods."""
        assert "hello".upper() == "HELLO"
        assert "WORLD".lower() == "world"
        assert "  space  ".strip() == "space"
    
    def test_string_formatting(self):
        """Test string formatting."""
        assert f"Value: {42}" == "Value: 42"
        assert "{} {}".format("Hello", "World") == "Hello World"


class TestListOperations:
    """Test list operations."""
    
    @pytest.fixture
    def sample_list(self) -> List[int]:
        """Provide a sample list for testing."""
        return [1, 2, 3, 4, 5]
    
    def test_list_append(self, sample_list):
        """Test list append operation."""
        sample_list.append(6)
        assert len(sample_list) == 6
        assert sample_list[-1] == 6
    
    def test_list_remove(self, sample_list):
        """Test list remove operation."""
        sample_list.remove(3)
        assert 3 not in sample_list
        assert len(sample_list) == 4
    
    def test_list_comprehension(self):
        """Test list comprehension."""
        squares = [x**2 for x in range(5)]
        assert squares == [0, 1, 4, 9, 16]


@pytest.mark.parametrize("input,expected", [
    (0, 0),
    (1, 1),
    (2, 1),
    (3, 2),
    (4, 3),
    (5, 5),
    (6, 8),
])
def test_fibonacci_parametrized(input, expected):
    """Test Fibonacci sequence with parametrize."""
    def fibonacci(n):
        if n <= 1:
            return n
        return fibonacci(n - 1) + fibonacci(n - 2)
    
    assert fibonacci(input) == expected


def test_dictionary_operations():
    """Test dictionary operations."""
    data = {"name": "John", "age": 30}
    assert data["name"] == "John"
    assert data.get("age") == 30
    assert data.get("city", "Unknown") == "Unknown"
    
    data["city"] = "New York"
    assert "city" in data
    assert len(data) == 3