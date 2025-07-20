# unittest with LLM Test Reporter

This example shows how to configure Python's built-in unittest framework to use the LLM-optimized test reporter.

## Installation

```bash
pip install llm-unittest-reporter
```

## Configuration

### Using Test Runner in Code

```python
import unittest
from llm_unittest_reporter import LLMTestRunner

if __name__ == '__main__':
    # Create test suite
    loader = unittest.TestLoader()
    suite = loader.discover('tests')
    
    # Run with LLM reporter
    runner = LLMTestRunner()
    runner.run(suite)
```

### Using Command Line

```bash
# Run all tests with LLM reporter
python -m llm_unittest_reporter

# Run specific test module
python -m llm_unittest_reporter tests.test_calculator

# Run with detailed mode
python -m llm_unittest_reporter --mode detailed

# Output to file
python -m llm_unittest_reporter --output results.txt
```

### Using unittest.main()

```python
import unittest
from llm_unittest_reporter import LLMTestRunner

class TestCalculator(unittest.TestCase):
    # ... your tests ...
    pass

if __name__ == '__main__':
    unittest.main(testRunner=LLMTestRunner())
```

## Example Test File

```python
# test_calculator.py
import unittest
from calculator import Calculator


class TestCalculator(unittest.TestCase):
    """Test the Calculator class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.calc = Calculator()
    
    def tearDown(self):
        """Clean up after tests."""
        # Clean up if needed
        self.calc = None
    
    def test_addition(self):
        """Test addition operation."""
        self.assertEqual(self.calc.add(2, 3), 5)
        self.assertEqual(self.calc.add(-1, 1), 0)
        self.assertEqual(self.calc.add(0, 0), 0)
    
    def test_subtraction(self):
        """Test subtraction operation."""
        self.assertEqual(self.calc.subtract(10, 5), 5)
        self.assertEqual(self.calc.subtract(0, 1), -1)
        self.assertEqual(self.calc.subtract(-5, -3), -2)
    
    def test_multiplication(self):
        """Test multiplication operation."""
        self.assertEqual(self.calc.multiply(3, 4), 12)
        self.assertEqual(self.calc.multiply(0, 100), 0)
        self.assertEqual(self.calc.multiply(-2, 3), -6)
    
    def test_division(self):
        """Test division operation."""
        self.assertEqual(self.calc.divide(10, 2), 5)
        self.assertEqual(self.calc.divide(7, 2), 3.5)
        
        # Test divide by zero
        with self.assertRaises(ZeroDivisionError):
            self.calc.divide(10, 0)
    
    def test_division_by_zero_message(self):
        """Test divide by zero error message."""
        with self.assertRaisesRegex(ZeroDivisionError, "Cannot divide by zero"):
            self.calc.divide(10, 0)
    
    @unittest.skip("Square root not implemented yet")
    def test_square_root(self):
        """Test square root operation."""
        self.assertEqual(self.calc.sqrt(4), 2)
        self.assertEqual(self.calc.sqrt(9), 3)
    
    @unittest.skipIf(not hasattr(Calculator, 'power'), "Power method not available")
    def test_power(self):
        """Test power operation."""
        self.assertEqual(self.calc.power(2, 3), 8)
        self.assertEqual(self.calc.power(5, 0), 1)
    
    @unittest.expectedFailure
    def test_float_precision(self):
        """Test floating point precision (expected to fail)."""
        result = self.calc.add(0.1, 0.2)
        self.assertEqual(result, 0.3)  # This will fail due to float precision


class TestAdvancedCalculator(unittest.TestCase):
    """Test advanced calculator features."""
    
    @classmethod
    def setUpClass(cls):
        """Set up class-level fixtures."""
        cls.shared_calc = Calculator()
        cls.test_data = [
            (2, 3, 5),
            (0, 0, 0),
            (-1, 1, 0),
            (100, 200, 300),
        ]
    
    @classmethod
    def tearDownClass(cls):
        """Clean up class-level fixtures."""
        cls.shared_calc = None
        cls.test_data = None
    
    def test_addition_with_data(self):
        """Test addition with predefined data."""
        for a, b, expected in self.test_data:
            with self.subTest(a=a, b=b):
                self.assertEqual(self.shared_calc.add(a, b), expected)
    
    def test_type_errors(self):
        """Test type error handling."""
        with self.assertRaises(TypeError):
            self.shared_calc.add("5", 3)
        
        with self.assertRaises(TypeError):
            self.shared_calc.add(5, "3")
    
    def test_large_numbers(self):
        """Test with large numbers."""
        large1 = 10**100
        large2 = 10**100
        result = self.shared_calc.add(large1, large2)
        self.assertEqual(result, 2 * 10**100)
    
    def test_negative_numbers(self):
        """Test with negative numbers."""
        test_cases = [
            (-5, -3, -8),
            (-5, 3, -2),
            (5, -3, 2),
        ]
        
        for a, b, expected in test_cases:
            with self.subTest(f"{a} + {b}"):
                self.assertEqual(self.shared_calc.add(a, b), expected)


class TestCalculatorIntegration(unittest.TestCase):
    """Integration tests for calculator."""
    
    def test_complex_calculation(self):
        """Test complex multi-operation calculation."""
        calc = Calculator()
        
        # (10 + 5) * 2 - 8 / 4
        result1 = calc.add(10, 5)
        result2 = calc.multiply(result1, 2)
        result3 = calc.divide(8, 4)
        final = calc.subtract(result2, result3)
        
        self.assertEqual(final, 28)  # 15 * 2 - 2 = 28
    
    def test_calculation_state(self):
        """Test calculator maintains no state between operations."""
        calc = Calculator()
        
        # First calculation
        calc.add(5, 3)
        
        # Second calculation should not be affected
        result = calc.add(2, 2)
        self.assertEqual(result, 4)


def suite():
    """Create a test suite."""
    suite = unittest.TestSuite()
    
    # Add specific tests
    suite.addTest(TestCalculator('test_addition'))
    suite.addTest(TestCalculator('test_division'))
    
    # Add all tests from a test case
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestAdvancedCalculator))
    
    return suite


if __name__ == '__main__':
    # Option 1: Run with LLM reporter
    from llm_unittest_reporter import LLMTestRunner
    runner = LLMTestRunner()
    unittest.main(testRunner=runner)
    
    # Option 2: Run specific suite
    # runner.run(suite())
```

## Output Examples

### Summary Mode

When all tests pass:
```
# LLM TEST REPORTER - SUMMARY MODE

---
## SUMMARY
- PASSED SUITES: 3
- FAILED SUITES: 0
- TOTAL TESTS: 18 (18 passed)
- DURATION: 0.05s
- EXIT CODE: 0
```

When some tests fail:
```
# LLM TEST REPORTER - SUMMARY MODE

SUITE: test_calculator.TestCalculator
FAILED TESTS:
- TestCalculator > test_division: ZeroDivisionError: division by zero
- TestCalculator > test_float_precision: 0.30000000000000004 != 0.3

---
## SUMMARY
- PASSED SUITES: 2
- FAILED SUITES: 1
- TOTAL TESTS: 18 (16 passed, 2 failed)
- DURATION: 0.08s
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
  26 |     def test_division(self):
  27 |         self.assertEqual(self.calc.divide(10, 2), 5)
> 28 |         self.assertEqual(self.calc.divide(10, 0), float('inf'))
     |                          ^
  29 |     

FAILURE REASON: division by zero
FIX HINT: Check for zero before division operation

---
## TEST FAILURE #2
SUITE: TestCalculator
TEST: TestCalculator > test_float_precision
FILE: test_calculator.py:45
TYPE: AssertionError

EXPECTED: 0.3
RECEIVED: 0.30000000000000004

CODE CONTEXT:
  43 |     def test_float_precision(self):
  44 |         result = self.calc.add(0.1, 0.2)
> 45 |         self.assertEqual(result, 0.3)
     |         ^
  46 |     

FAILURE REASON: 0.30000000000000004 != 0.3
FIX HINT: Consider using approximate equality for floating point comparisons

---
## SUMMARY
- TOTAL TESTS: 18 (16 passed, 2 failed)
- FAILURE RATE: 11.11%
- DURATION: 0.08s
- EXIT CODE: 1
```

## Environment Variables

```bash
# Set output mode
export LLM_OUTPUT_MODE=detailed
python -m unittest

# With LLM reporter
LLM_OUTPUT_MODE=detailed python -m llm_unittest_reporter

# Set output file
LLM_OUTPUT_FILE=test-results.txt python -m llm_unittest_reporter

# Include passed suites
LLM_INCLUDE_PASSED_SUITES=true python -m llm_unittest_reporter
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.8', '3.9', '3.10', '3.11']
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v4
      with:
        python-version: ${{ matrix.python-version }}
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install llm-unittest-reporter
    
    - name: Run tests with LLM reporter
      run: |
        python -m llm_unittest_reporter --mode detailed --output test-results.txt
      continue-on-error: true
    
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: test-results-${{ matrix.python-version }}
        path: test-results.txt
```

### Running Specific Test Methods

```bash
# Run single test method
python -m llm_unittest_reporter test_calculator.TestCalculator.test_addition

# Run single test class
python -m llm_unittest_reporter test_calculator.TestCalculator

# Run tests matching pattern
python -m llm_unittest_reporter --pattern "test_*calc*.py"
```

## Advanced Configuration

### Custom Test Discovery

```python
# run_tests.py
import unittest
from llm_unittest_reporter import LLMTestRunner
from llm_unittest_reporter.config import ReporterConfig

def run_tests():
    # Custom configuration
    config = ReporterConfig(
        mode='detailed',
        max_value_length=200,
        stack_trace_lines=3,
        output_file='test-results.txt'
    )
    
    # Custom test discovery
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add tests from specific modules
    from tests import test_calculator, test_utils
    suite.addTests(loader.loadTestsFromModule(test_calculator))
    suite.addTests(loader.loadTestsFromModule(test_utils))
    
    # Run with LLM reporter
    runner = LLMTestRunner(config=config)
    result = runner.run(suite)
    
    return 0 if result.wasSuccessful() else 1

if __name__ == '__main__':
    exit(run_tests())
```

### Integration with Django

```python
# In Django settings or custom test runner
from django.test.runner import DiscoverRunner
from llm_unittest_reporter import LLMTestResult

class LLMDjangoTestRunner(DiscoverRunner):
    def get_resultclass(self):
        return LLMTestResult
    
    def setup_test_environment(self, **kwargs):
        super().setup_test_environment(**kwargs)
        # Set LLM reporter environment
        import os
        os.environ['LLM_OUTPUT_MODE'] = 'summary'
```

## Tips and Best Practices

1. **Use subTest for Data-Driven Tests** - Helps identify which specific data case failed
2. **Leverage setUp/tearDown** - Ensures consistent test environment
3. **Use Descriptive Test Names** - Makes failures easier to understand
4. **Group Related Tests** - Organize tests into logical TestCase classes
5. **Handle Expected Failures** - Use @unittest.expectedFailure for known issues

## Troubleshooting

### Module Import Issues

```python
# Debug import paths
import sys
print("Python path:", sys.path)

# Try different import methods
try:
    from llm_unittest_reporter import LLMTestRunner
except ImportError:
    import llm_unittest_reporter
```

### Test Discovery Issues

```bash
# Verbose test discovery
python -m unittest discover -v

# Specify top level directory
python -m llm_unittest_reporter --top-level-directory . --start-directory tests/
```

### Configuration Not Applied

```python
# Check configuration loading
from llm_unittest_reporter.config import ReporterConfig

# See current config
config = ReporterConfig.load()
print(f"Mode: {config.mode}")
print(f"Output file: {config.output_file}")
```