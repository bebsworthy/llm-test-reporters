"""All failing tests for pytest reporter validation."""

import pytest
import time
from typing import Optional


class TestAllFailures:
    """Tests that all fail in different ways."""
    
    def test_assertion_failure(self):
        """Basic assertion failure."""
        expected = 10
        actual = 5
        assert actual == expected, f"Expected {expected} but got {actual}"
    
    def test_type_mismatch(self):
        """Type error in operation."""
        # Trying to add incompatible types
        result = "string" + 123
        assert result == "string123"
    
    def test_zero_division(self):
        """Division by zero error."""
        numerator = 10
        denominator = 0
        result = numerator / denominator
        assert result == float('inf')
    
    def test_index_out_of_bounds(self):
        """Index error accessing list."""
        items = [1, 2, 3]
        # Accessing index that doesn't exist
        value = items[10]
        assert value == 4
    
    def test_key_not_found(self):
        """Key error accessing dictionary."""
        data = {"name": "Alice", "age": 25}
        # Accessing non-existent key
        city = data["city"]
        assert city == "New York"
    
    def test_attribute_missing(self):
        """Attribute error on object."""
        class Person:
            def __init__(self, name):
                self.name = name
        
        person = Person("Bob")
        # Accessing non-existent attribute
        age = person.age
        assert age == 30
    
    def test_import_failure(self):
        """Import error for non-existent module."""
        import non_existent_module
        assert non_existent_module.function() == "result"
    
    def test_value_conversion_error(self):
        """ValueError in conversion."""
        text = "not a number"
        number = int(text)
        assert number == 42
    
    def test_timeout_exceeded(self):
        """Test that exceeds timeout."""
        # This would need pytest-timeout plugin
        time.sleep(10)  # Simulate long operation
        assert True
    
    def test_name_undefined(self):
        """NameError for undefined variable."""
        # Using undefined variable
        result = undefined_variable * 2
        assert result == 10


class TestComplexFailures:
    """More complex failure scenarios."""
    
    def test_nested_assertion_failure(self):
        """Nested data structure assertion."""
        expected = {
            "user": {
                "name": "John",
                "settings": {
                    "theme": "dark",
                    "notifications": True
                }
            }
        }
        
        actual = {
            "user": {
                "name": "John",
                "settings": {
                    "theme": "light",  # Different
                    "notifications": False  # Different
                }
            }
        }
        
        assert actual == expected
    
    def test_list_comparison_failure(self):
        """List comparison with multiple differences."""
        expected = [1, 2, 3, 4, 5]
        actual = [1, 2, 30, 40, 5]
        assert actual == expected
    
    def test_custom_exception(self):
        """Custom exception raised."""
        class CustomError(Exception):
            pass
        
        def risky_operation():
            raise CustomError("Operation failed due to custom reason")
        
        result = risky_operation()
        assert result == "success"
    
    def test_multiple_assertions_fail(self):
        """Multiple assertions where first fails."""
        value = 5
        assert value > 10  # This fails
        assert value < 3   # This won't be reached
        assert value == 0  # This won't be reached either


@pytest.mark.parametrize("input,expected", [
    (1, 2),    # 1 != 2
    (2, 3),    # 2 != 3
    (3, 5),    # 3 != 5
    (4, 7),    # 4 != 7
])
def test_parametrized_all_fail(input, expected):
    """Parametrized test where all cases fail."""
    assert input == expected


class TestAsyncFailures:
    """Async test failures."""
    
    @pytest.mark.asyncio
    async def test_async_assertion_failure(self):
        """Async test with assertion failure."""
        async def get_value():
            return 42
        
        result = await get_value()
        assert result == 100
    
    @pytest.mark.asyncio
    async def test_async_exception(self):
        """Async test that raises exception."""
        async def failing_operation():
            raise RuntimeError("Async operation failed")
        
        result = await failing_operation()
        assert result is not None


def test_fixture_usage_failure():
    """Test using fixture that leads to failure."""
    @pytest.fixture
    def sample_data():
        return {"count": 0}
    
    def test_with_fixture(sample_data):
        sample_data["count"] += 1
        assert sample_data["count"] == 2  # Will be 1, not 2
    
    # Manually simulate the failure
    data = {"count": 0}
    data["count"] += 1
    assert data["count"] == 2


def test_permission_denied():
    """Test file operation with permission error."""
    # Try to write to a protected location
    with open("/root/test.txt", "w") as f:
        f.write("test")
    assert True