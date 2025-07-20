# pytest with LLM Test Reporter

This example shows how to configure pytest to use the LLM-optimized test reporter.

## Installation

```bash
pip install llm-pytest-reporter
```

## Configuration

### Using pytest.ini

Create a `pytest.ini` file in your project root:

```ini
[pytest]
# Enable LLM reporter by default
addopts = --llm-reporter

# Optional: Set default mode
# addopts = --llm-reporter --llm-reporter-mode=detailed
```

### Using pyproject.toml

```toml
[tool.pytest.ini_options]
addopts = "--llm-reporter"
# Optional: "--llm-reporter-mode=detailed"
```

### Using Command Line

```bash
# Summary mode (default)
pytest --llm-reporter

# Detailed mode
pytest --llm-reporter --llm-reporter-mode=detailed

# Output to file
pytest --llm-reporter --llm-reporter-output=results.txt
```

## Example Test File

```python
# test_calculator.py
import pytest
from calculator import Calculator


class TestCalculator:
    """Test the Calculator class."""
    
    @pytest.fixture
    def calc(self):
        """Provide a Calculator instance."""
        return Calculator()
    
    def test_addition(self, calc):
        """Test addition operation."""
        assert calc.add(2, 3) == 5
        assert calc.add(-1, 1) == 0
        assert calc.add(0, 0) == 0
    
    def test_subtraction(self, calc):
        """Test subtraction operation."""
        assert calc.subtract(10, 5) == 5
        assert calc.subtract(0, 1) == -1
        assert calc.subtract(-5, -3) == -2
    
    def test_multiplication(self, calc):
        """Test multiplication operation."""
        assert calc.multiply(3, 4) == 12
        assert calc.multiply(0, 100) == 0
        assert calc.multiply(-2, 3) == -6
    
    def test_division(self, calc):
        """Test division operation."""
        assert calc.divide(10, 2) == 5
        assert calc.divide(7, 2) == 3.5
        
        # This will fail if divide doesn't handle zero properly
        with pytest.raises(ZeroDivisionError):
            calc.divide(10, 0)
    
    @pytest.mark.parametrize("a,b,expected", [
        (2, 3, 5),
        (0, 0, 0),
        (-1, 1, 0),
        (100, 200, 300),
        (0.1, 0.2, 0.3),  # This might fail due to float precision
    ])
    def test_addition_parametrized(self, calc, a, b, expected):
        """Test addition with multiple inputs."""
        assert calc.add(a, b) == expected
    
    @pytest.mark.skip(reason="Feature not implemented")
    def test_square_root(self, calc):
        """Test square root operation."""
        assert calc.sqrt(4) == 2
        assert calc.sqrt(9) == 3
    
    @pytest.mark.xfail(reason="Known precision issue")
    def test_float_precision(self, calc):
        """Test floating point precision."""
        result = calc.add(0.1, 0.2)
        assert result == 0.3  # This will fail due to float precision


def test_module_level_function():
    """Test at module level (not in a class)."""
    assert sum([1, 2, 3, 4, 5]) == 15
    assert max([1, 5, 3, 9, 2]) == 9


@pytest.mark.asyncio
async def test_async_operation():
    """Test async functionality."""
    import asyncio
    
    async def fetch_data():
        await asyncio.sleep(0.1)
        return {"status": "success", "data": [1, 2, 3]}
    
    result = await fetch_data()
    assert result["status"] == "success"
    assert len(result["data"]) == 3
```

## Output Examples

### Summary Mode

When all tests pass:
```
# LLM TEST REPORTER - SUMMARY MODE

---
## SUMMARY
- PASSED SUITES: 1
- FAILED SUITES: 0
- TOTAL TESTS: 10 (10 passed)
- DURATION: 0.23s
- EXIT CODE: 0
```

When some tests fail:
```
# LLM TEST REPORTER - SUMMARY MODE

SUITE: test_calculator.py
FAILED TESTS:
- TestCalculator > test_division: ZeroDivisionError: division by zero
- TestCalculator > test_addition_parametrized[0.1-0.2-0.3]: assert 0.30000000000000004 == 0.3

---
## SUMMARY
- PASSED SUITES: 0
- FAILED SUITES: 1
- TOTAL TESTS: 10 (8 passed, 2 failed)
- DURATION: 0.34s
- EXIT CODE: 1
```

### Detailed Mode

```
# LLM TEST REPORTER - DETAILED MODE

## TEST FAILURE #1
SUITE: TestCalculator
TEST: TestCalculator > test_division
FILE: test_calculator.py:28
TYPE: ZeroDivisionError

CODE CONTEXT:
  26 |     def test_division(self, calc):
  27 |         assert calc.divide(10, 2) == 5
> 28 |         assert calc.divide(10, 0) == float('inf')
     |                ^
  29 |     

FAILURE REASON: division by zero
FIX HINT: Check for zero before division operation

---
## TEST FAILURE #2
SUITE: TestCalculator
TEST: TestCalculator > test_addition_parametrized[0.1-0.2-0.3]
FILE: test_calculator.py:39
TYPE: AssertionError

EXPECTED: 0.3
RECEIVED: 0.30000000000000004

CODE CONTEXT:
  37 |     def test_addition_parametrized(self, calc, a, b, expected):
  38 |         """Test addition with multiple inputs."""
> 39 |         assert calc.add(a, b) == expected
     |         ^
  40 |     

FAILURE REASON: assert 0.30000000000000004 == 0.3
FIX HINT: Consider using approximate equality for floating point comparisons

---
## SUMMARY
- TOTAL TESTS: 10 (8 passed, 2 failed)
- FAILURE RATE: 20.00%
- DURATION: 0.34s
- EXIT CODE: 1
```

## Environment Variables

```bash
# Set output mode
export LLM_OUTPUT_MODE=detailed
pytest

# Set output file
export LLM_OUTPUT_FILE=test-results.txt
pytest

# Include passed suites in summary
export LLM_INCLUDE_PASSED_SUITES=true
pytest

# Adjust value truncation
export LLM_MAX_VALUE_LENGTH=200
pytest
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install llm-pytest-reporter
    
    - name: Run tests with LLM reporter
      run: |
        pytest --llm-reporter --llm-reporter-mode=detailed --llm-reporter-output=test-results.txt
      continue-on-error: true
    
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: test-results
        path: test-results.txt
    
    - name: Analyze with AI (example)
      if: failure()
      run: |
        # Example: Send to AI for analysis
        cat test-results.txt | your-ai-tool analyze
```

### Pre-commit Hook

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: pytest-llm
        name: Run tests with LLM reporter
        entry: pytest --llm-reporter --llm-reporter-mode=summary
        language: system
        pass_filenames: false
        always_run: true
```

## Advanced Configuration

### Different Configs for Different Environments

```python
# conftest.py
import os
import pytest

def pytest_configure(config):
    """Configure pytest based on environment."""
    env = os.environ.get('TEST_ENV', 'dev')
    
    if env == 'ci':
        # CI configuration
        config.option.llm_reporter = True
        config.option.llm_reporter_mode = 'summary'
        config.option.llm_reporter_output = 'test-results.txt'
    elif env == 'dev':
        # Development configuration
        config.option.llm_reporter = True
        config.option.llm_reporter_mode = 'detailed'
    else:
        # Default configuration
        pass
```

### Custom Failure Handling

```python
# conftest.py
def pytest_runtest_makereport(item, call):
    """Custom handling of test reports."""
    if call.when == "call" and call.excinfo is not None:
        # Log additional information for failures
        print(f"Test {item.nodeid} failed")
        
        # You could send to monitoring service here
        # send_to_monitoring(item.nodeid, call.excinfo)
```

## Tips and Best Practices

1. **Use Summary Mode in CI** - Reduces log size while preserving failure information
2. **Use Detailed Mode Locally** - Helps with debugging during development
3. **Output to File for Analysis** - Makes it easier to process results with other tools
4. **Combine with Markers** - Use pytest markers to organize tests
5. **Set Reasonable Timeouts** - Prevent hanging tests from blocking CI

## Troubleshooting

### Plugin Not Found

```bash
# Verify installation
pip show llm-pytest-reporter

# List pytest plugins
pytest --trace-config | grep llm

# Force plugin loading
pytest -p llm_pytest_reporter.plugin
```

### No Output Generated

1. Check file permissions for output file
2. Verify tests are collected: `pytest --collect-only`
3. Check for pytest configuration conflicts

### Environment Variables Not Working

```bash
# Debug environment variables
python -c "import os; print(os.environ.get('LLM_OUTPUT_MODE'))"

# Set and run in one command
LLM_OUTPUT_MODE=detailed pytest
```