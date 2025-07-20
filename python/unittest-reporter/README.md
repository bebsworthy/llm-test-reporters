# LLM Test Reporter for unittest

LLM-optimized test reporter for Python's built-in unittest framework that reduces output noise and improves failure visibility for AI analysis.

## Installation

```bash
pip install llm-unittest-reporter
```

## Quick Start

### Using the Test Runner

```python
import unittest
from llm_unittest_reporter import LLMTestRunner

# Create test suite
suite = unittest.TestLoader().discover('tests')

# Run with LLM reporter
runner = LLMTestRunner()
runner.run(suite)
```

### Command Line Usage

```bash
# Run with LLM reporter
python -m llm_unittest_reporter

# Run specific test module
python -m llm_unittest_reporter tests.test_module

# Set output mode
python -m llm_unittest_reporter --mode detailed

# Output to file
python -m llm_unittest_reporter --output results.txt

# Custom test discovery
python -m llm_unittest_reporter --pattern "test_*.py" --start-directory tests/
```

### Programmatic Usage

```python
import unittest
from llm_unittest_reporter import LLMTestRunner, LLMTestResult

class MyTestCase(unittest.TestCase):
    def test_example(self):
        self.assertEqual(1 + 1, 2)

if __name__ == '__main__':
    # Option 1: Use the runner directly
    runner = LLMTestRunner()
    unittest.main(testRunner=runner)
    
    # Option 2: Create custom configuration
    from llm_unittest_reporter.config import ReporterConfig
    
    config = ReporterConfig(
        mode='detailed',
        output_file='test-results.txt',
        max_value_length=200
    )
    
    runner = LLMTestRunner(config=config)
    unittest.main(testRunner=runner)
```

## Configuration Options

### Environment Variables

```bash
# Set output mode
LLM_OUTPUT_MODE=detailed python -m unittest

# Set output file
LLM_OUTPUT_FILE=results.txt python -m unittest

# Include passed suites
LLM_INCLUDE_PASSED_SUITES=true python -m unittest

# Adjust value truncation
LLM_MAX_VALUE_LENGTH=200 python -m unittest
```

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

### Python Configuration

```python
from llm_unittest_reporter import LLMTestRunner
from llm_unittest_reporter.config import ReporterConfig

# Create custom config
config = ReporterConfig(
    mode='detailed',
    include_passed_suites=False,
    max_value_length=150,
    stack_trace_lines=3,
    output_file='results.txt'
)

# Use with runner
runner = LLMTestRunner(config=config)
```

## Output Examples

### Summary Mode

```
# LLM TEST REPORTER - SUMMARY MODE

SUITE: tests.test_auth.TestAuthentication
FAILED TESTS:
- TestAuthentication > test_invalid_credentials: AssertionError: 401 != 200
- TestAuthentication > test_expired_token: AssertionError: False is not true

---
## SUMMARY
- PASSED SUITES: 2
- FAILED SUITES: 1
- TOTAL TESTS: 15 (13 passed, 2 failed)
- DURATION: 0.84s
- EXIT CODE: 1
```

### Detailed Mode

```
# LLM TEST REPORTER - DETAILED MODE

## TEST FAILURE #1
SUITE: TestAuthentication
TEST: TestAuthentication > test_invalid_credentials
FILE: tests/test_auth.py:25
TYPE: AssertionError

EXPECTED: 200
RECEIVED: 401

CODE CONTEXT:
  23 |     def test_invalid_credentials(self):
  24 |         response = self.client.login("user", "wrong")
> 25 |         self.assertEqual(response.status_code, 200)
     |         ^
  26 |     

FAILURE REASON: 401 != 200
FIX HINT: Review assertion logic and expected values

---
## SUMMARY
- TOTAL TESTS: 15 (13 passed, 2 failed)
- FAILURE RATE: 13.33%
- DURATION: 0.84s
- EXIT CODE: 1
```

## Integration Examples

### With Django

```python
# In your Django settings or test runner
import os
os.environ['LLM_OUTPUT_MODE'] = 'summary'

from django.test.runner import DiscoverRunner
from llm_unittest_reporter import LLMTestResult

class LLMDjangoTestRunner(DiscoverRunner):
    def setup_test_environment(self, **kwargs):
        super().setup_test_environment(**kwargs)
        self.testresult_class = LLMTestResult
```

### With pytest-unittest

If you're using pytest to run unittest tests:

```bash
# Install both
pip install llm-unittest-reporter pytest

# Run unittest tests with pytest
pytest --tb=no -q

# Or use unittest directly
python -m llm_unittest_reporter
```

### CI/CD Integration

#### GitHub Actions

```yaml
- name: Run tests with LLM reporter
  run: |
    pip install llm-unittest-reporter
    python -m llm_unittest_reporter --mode detailed --output test-results.txt
  
- name: Upload results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results.txt
```

#### GitLab CI

```yaml
test:
  script:
    - pip install llm-unittest-reporter
    - python -m llm_unittest_reporter --output results.txt
  artifacts:
    when: on_failure
    reports:
      junit: results.txt
```

## Advanced Usage

### Custom Test Result Class

```python
from llm_unittest_reporter import LLMTestResult

class CustomTestResult(LLMTestResult):
    def addFailure(self, test, err):
        # Custom failure handling
        super().addFailure(test, err)
        # Send to monitoring service
        self.send_to_monitoring(test, err)
```

### Integration with Test Discovery

```python
import unittest
from llm_unittest_reporter import LLMTestRunner

def run_all_tests():
    # Discover tests
    loader = unittest.TestLoader()
    start_dir = 'tests'
    suite = loader.discover(start_dir, pattern='test*.py')
    
    # Run with LLM reporter
    runner = LLMTestRunner(
        config={'mode': 'detailed', 'output_file': 'results.txt'}
    )
    result = runner.run(suite)
    
    return result.wasSuccessful()
```

### Subprocess Integration

```python
import subprocess
import sys

# Run tests in subprocess with LLM reporter
result = subprocess.run([
    sys.executable, '-m', 'llm_unittest_reporter',
    '--mode', 'detailed',
    '--output', 'test-results.txt'
], capture_output=True, text=True)

if result.returncode != 0:
    # Read and process results
    with open('test-results.txt', 'r') as f:
        test_output = f.read()
    # Send to analysis tool
```

## Features

- **Minimal Output**: Shows only failures in summary mode
- **Clean Format**: No ANSI codes or decorative elements  
- **Error Classification**: Categorizes errors by type
- **Fix Hints**: Provides suggestions for common errors
- **Code Context**: Shows relevant code snippets in detailed mode
- **Streaming Output**: Results appear as tests run
- **unittest Compatible**: Works with existing unittest tests

## Comparison with Default Output

### Default unittest output:
```
......F.F..
======================================================================
FAIL: test_invalid_credentials (tests.test_auth.TestAuthentication)
----------------------------------------------------------------------
Traceback (most recent call last):
  File "/path/to/tests/test_auth.py", line 25, in test_invalid_credentials
    self.assertEqual(response.status_code, 200)
AssertionError: 401 != 200
[... more verbose output ...]
```

### LLM Reporter output:
```
# LLM TEST REPORTER - SUMMARY MODE

SUITE: tests.test_auth.TestAuthentication
FAILED TESTS:
- TestAuthentication > test_invalid_credentials: 401 != 200

---
## SUMMARY
- TOTAL TESTS: 10 (8 passed, 2 failed)
- DURATION: 0.84s
- EXIT CODE: 1
```

## Troubleshooting

### Import Issues

```python
# If reporter not found, check installation
import sys
print(sys.path)

# Try direct import
from llm_unittest_reporter import LLMTestRunner
```

### No Output Generated

1. Verify environment variables are set
2. Check file permissions for output file
3. Ensure tests are being discovered: `python -m unittest discover -v`

### Configuration Not Applied

```python
# Debug configuration loading
from llm_unittest_reporter.config import ReporterConfig
config = ReporterConfig.load()
print(config.__dict__)
```

## Contributing

See the main project repository for contribution guidelines.

## License

MIT License - see LICENSE file for details.