"""Mixed test results for pytest reporter validation."""

import pytest
import time
from typing import Dict, Any


class TestMixedResults:
    """Tests with mixed pass/fail results."""
    
    def test_passing_assertion(self):
        """This test should pass."""
        assert True
        assert 1 + 1 == 2
        assert "hello".upper() == "HELLO"
    
    def test_failing_equality(self):
        """This test should fail with assertion error."""
        result = 2 + 2
        assert result == 5  # This will fail
    
    def test_passing_comparison(self):
        """This test should pass."""
        assert 10 > 5
        assert 3 < 7
        assert 5 >= 5
    
    def test_failing_type_error(self):
        """This test should fail with type error."""
        # This will raise TypeError
        result = "string" + 5
        assert result == "string5"
    
    @pytest.mark.skip(reason="Feature not implemented yet")
    def test_skipped_feature(self):
        """This test should be skipped."""
        assert False  # This won't run
    
    def test_passing_string_operations(self):
        """This test should pass."""
        text = "Python Testing"
        assert text.startswith("Python")
        assert text.endswith("Testing")
        assert "Test" in text
    
    def test_failing_key_error(self):
        """This test should fail with key error."""
        data = {"name": "John", "age": 30}
        # This will raise KeyError
        value = data["city"]
        assert value == "New York"
    
    @pytest.mark.xfail(reason="Known issue with division")
    def test_expected_failure(self):
        """This test is expected to fail."""
        assert 1 / 0 == float('inf')
    
    def test_passing_list_operations(self):
        """This test should pass."""
        numbers = [1, 2, 3, 4, 5]
        assert sum(numbers) == 15
        assert max(numbers) == 5
        assert min(numbers) == 1


class TestAsyncOperations:
    """Test async operations with mixed results."""
    
    @pytest.mark.asyncio
    async def test_async_passing(self):
        """Async test that should pass."""
        async def fetch_data():
            return {"status": "ok"}
        
        result = await fetch_data()
        assert result["status"] == "ok"
    
    @pytest.mark.asyncio
    async def test_async_timeout(self):
        """Async test that should fail with timeout."""
        async def slow_operation():
            await asyncio.sleep(10)  # This will timeout
            return "done"
        
        import asyncio
        result = await asyncio.wait_for(slow_operation(), timeout=0.1)
        assert result == "done"


class TestParametrizedMixed:
    """Parametrized tests with mixed results."""
    
    @pytest.mark.parametrize("value,expected", [
        (2, 4),      # Pass
        (3, 9),      # Pass
        (4, 15),     # Fail - should be 16
        (5, 25),     # Pass
        (6, 35),     # Fail - should be 36
    ])
    def test_square_numbers(self, value, expected):
        """Test squaring numbers with some failures."""
        assert value ** 2 == expected
    
    @pytest.mark.parametrize("text,length", [
        ("hello", 5),      # Pass
        ("world", 5),      # Pass
        ("python", 7),     # Fail - should be 6
        ("", 0),           # Pass
        ("test", 5),       # Fail - should be 4
    ])
    def test_string_length(self, text, length):
        """Test string length with some failures."""
        assert len(text) == length


def test_fixture_setup_error():
    """Test that uses a fixture with setup error."""
    @pytest.fixture
    def broken_fixture():
        # This will raise an error during setup
        raise RuntimeError("Fixture setup failed")
    
    def inner_test(broken_fixture):
        assert True
    
    # This will cause a setup error when pytest tries to use it
    # but we can't directly trigger it in the test itself
    assert True  # Just pass for now


def test_value_error_handling():
    """Test that should fail with ValueError."""
    def parse_number(text: str) -> int:
        return int(text)
    
    # This will raise ValueError
    result = parse_number("not a number")
    assert result == 42