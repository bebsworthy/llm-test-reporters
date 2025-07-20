# LLM Test Reporter for pytest

LLM-optimized test reporter for pytest that reduces output noise and improves failure visibility for AI analysis.

## Installation

```bash
pip install llm-pytest-reporter
```

## Quick Start

### Via pytest.ini

```ini
[pytest]
# Use LLM reporter by default
addopts = --llm-reporter --llm-reporter-mode=summary
```

### Via Command Line

```bash
# Summary mode (default)
pytest --llm-reporter

# Detailed mode
pytest --llm-reporter --llm-reporter-mode=detailed

# Output to file
pytest --llm-reporter --llm-reporter-output=results.txt
```

### Via Environment Variables

```bash
# Set mode
LLM_OUTPUT_MODE=detailed pytest

# Set output file
LLM_OUTPUT_FILE=results.txt pytest

# Include passed suites in summary
LLM_INCLUDE_PASSED_SUITES=true pytest
```

## Configuration Options

### Command Line Options

- `--llm-reporter` - Enable LLM reporter
- `--llm-reporter-mode` - Set output mode: `summary` or `detailed`
- `--llm-reporter-output` - Set output file path

### Environment Variables

- `LLM_OUTPUT_MODE` or `LLM_REPORTER_MODE` - Output mode
- `LLM_OUTPUT_FILE` - Output file path
- `LLM_INCLUDE_PASSED_SUITES` - Include passed suites
- `LLM_MAX_VALUE_LENGTH` - Maximum assertion value length
- `LLM_STACK_TRACE_LINES` - Stack trace lines in detailed mode
- `LLM_DETECT_PATTERNS` - Enable pattern detection

### Configuration File

Create `.llm-reporter.json` in your project root:

```json
{
  "mode": "summary",
  "includePassedSuites": false,
  "maxValueLength": 100,
  "stackTraceLines": 5,
  "detectPatterns": true,
  "outputFile": null
}
```

## Output Examples

### Summary Mode

```
# LLM TEST REPORTER - SUMMARY MODE

SUITE: tests/test_auth.py
FAILED TESTS:
- TestAuth > test_invalid_credentials: AssertionError: Expected 200 but got 401
- TestAuth > test_expired_token: AssertionError: Token validation should fail

---
## SUMMARY
- PASSED SUITES: 3
- FAILED SUITES: 1
- TOTAL TESTS: 25 (23 passed, 2 failed)
- DURATION: 1.45s
- EXIT CODE: 1
```

### Detailed Mode

```
# LLM TEST REPORTER - DETAILED MODE

## TEST FAILURE #1
SUITE: TestAuth
TEST: TestAuth > test_invalid_credentials
FILE: tests/test_auth.py:42
TYPE: AssertionError

EXPECTED: 200
RECEIVED: 401

CODE CONTEXT:
  40 |     def test_invalid_credentials(self):
  41 |         response = login("user", "wrong_pass")
> 42 |         assert response.status_code == 200
     |         ^
  43 |         assert response.json()["success"] is True

FAILURE REASON: Expected 200 but got 401
FIX HINT: Review assertion logic and expected values

---
## SUMMARY
- TOTAL TESTS: 25 (23 passed, 2 failed)
- FAILURE RATE: 8.00%
- DURATION: 1.45s
- EXIT CODE: 1
```

## Integration with CI/CD

### GitHub Actions

```yaml
- name: Run tests with LLM reporter
  run: |
    pytest --llm-reporter --llm-reporter-mode=detailed --llm-reporter-output=test-results.txt
  
- name: Upload test results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results.txt
```

### GitLab CI

```yaml
test:
  script:
    - pytest --llm-reporter --llm-reporter-output=results.txt
  artifacts:
    when: on_failure
    paths:
      - results.txt
```

## Advanced Usage

### Programmatic Configuration

```python
# conftest.py
import pytest

def pytest_configure(config):
    """Configure LLM reporter programmatically."""
    config.option.llm_reporter = True
    config.option.llm_reporter_mode = "detailed"
    config.option.llm_reporter_output = "test-results.txt"
```

### Custom Markers with LLM Reporter

```python
# Mark slow tests
@pytest.mark.slow
def test_long_operation():
    time.sleep(5)
    assert True

# Run excluding slow tests
# pytest -m "not slow" --llm-reporter
```

### Fixture Compatibility

The LLM reporter works seamlessly with pytest fixtures:

```python
@pytest.fixture
def api_client():
    return APIClient(base_url="http://localhost:8000")

def test_api_endpoint(api_client):
    response = api_client.get("/users")
    assert response.status_code == 200
```

## Features

- **Minimal Output**: Shows only what matters - failures and summary
- **Clean Format**: No ANSI codes or decorative elements
- **Smart Truncation**: Long assertion values are truncated intelligently
- **Error Classification**: Errors are categorized for easier analysis
- **Fix Hints**: Provides suggestions for common error types
- **Pattern Detection**: Identifies patterns across multiple failures
- **Streaming Output**: Results appear as tests complete
- **File Output**: Save results for later analysis

## Comparison with Default Reporter

### Default pytest output:
```
============================= test session starts ==============================
platform darwin -- Python 3.9.0, pytest-7.0.0, pluggy-1.0.0
rootdir: /Users/dev/project
collected 25 items

tests/test_auth.py::TestAuth::test_valid_login PASSED                   [ 4%]
tests/test_auth.py::TestAuth::test_invalid_credentials FAILED           [ 8%]
...
[Full stack trace and verbose output]
========================= 2 failed, 23 passed in 1.45s =========================
```

### LLM Reporter output:
```
# LLM TEST REPORTER - SUMMARY MODE

SUITE: tests/test_auth.py
FAILED TESTS:
- TestAuth > test_invalid_credentials: Expected 200 but got 401

---
## SUMMARY
- TOTAL TESTS: 25 (23 passed, 2 failed)
- DURATION: 1.45s
- EXIT CODE: 1
```

## Troubleshooting

### Reporter not activating

1. Ensure the package is installed: `pip show llm-pytest-reporter`
2. Check pytest can find the plugin: `pytest --trace-config | grep llm`
3. Try explicit activation: `pytest -p llm_pytest_reporter`

### No output appearing

1. Check output file permissions if using `--llm-reporter-output`
2. Ensure tests are actually running: `pytest --collect-only`
3. Verify environment variables are set correctly

### Compatibility issues

- Requires pytest >= 6.0.0
- Python 3.7+ supported
- Works with pytest-xdist for parallel execution
- Compatible with pytest-asyncio for async tests

## Contributing

See the main project repository for contribution guidelines.

## License

MIT License - see LICENSE file for details.