"""LLM-optimized unittest TestResult and TestRunner."""

import os
import sys
import time
import unittest
import traceback
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any, TextIO
from datetime import datetime

# Import from local copies of shared modules
from .config import ReporterConfig
from .models import TestSuite, TestResult, TestStatus, ErrorInfo
from .formatters import StreamingFormatter
from .error_classifier import ErrorClassifier


class LLMTestResult(unittest.TestResult):
    """LLM-optimized test result collector."""
    
    def __init__(self, stream=None, descriptions=None, verbosity=None, config=None):
        super().__init__(stream, descriptions, verbosity)
        self.config = config or ReporterConfig.load()
        self.formatter = StreamingFormatter(self.config)
        self.classifier = ErrorClassifier()
        
        # Test tracking
        self.suites: Dict[str, TestSuite] = {}
        self.current_suite: Optional[TestSuite] = None
        self.start_time = time.time()
        self._started = False
        
    def startTest(self, test):
        """Called when a test starts."""
        super().startTest(test)
        
        if not self._started:
            self.formatter.start()
            self._started = True
        
        # Get test module/class as suite
        module_name = test.__class__.__module__
        class_name = test.__class__.__name__
        suite_name = f"{module_name}.{class_name}"
        
        # Get file path
        try:
            file_path = sys.modules[module_name].__file__
        except:
            file_path = "unknown"
        
        # Create or get suite
        if suite_name not in self.suites:
            self.suites[suite_name] = TestSuite(
                name=class_name,
                file_path=file_path
            )
        
        self.current_suite = self.suites[suite_name]
        
    def addSuccess(self, test):
        """Called when a test passes."""
        super().addSuccess(test)
        self._add_test_result(test, TestStatus.PASSED)
        
    def addError(self, test, err):
        """Called when a test raises an unexpected exception."""
        super().addError(test, err)
        error_info = self._extract_error_info(err)
        self._add_test_result(test, TestStatus.FAILED, error_info)
        
    def addFailure(self, test, err):
        """Called when a test fails."""
        super().addFailure(test, err)
        error_info = self._extract_error_info(err)
        self._add_test_result(test, TestStatus.FAILED, error_info)
        
    def addSkip(self, test, reason):
        """Called when a test is skipped."""
        super().addSkip(test, reason)
        self._add_test_result(test, TestStatus.SKIPPED)
        
    def addExpectedFailure(self, test, err):
        """Called when an expected failure occurs."""
        super().addExpectedFailure(test, err)
        self._add_test_result(test, TestStatus.SKIPPED)  # Treat as skipped
        
    def addUnexpectedSuccess(self, test):
        """Called when a test expected to fail succeeds."""
        super().addUnexpectedSuccess(test)
        self._add_test_result(test, TestStatus.FAILED)  # Treat as failure
        
    def _add_test_result(self, test, status: TestStatus, error: Optional[ErrorInfo] = None):
        """Add a test result to the current suite."""
        if not self.current_suite:
            return
            
        # Get test name and full name
        test_name = test._testMethodName
        class_name = test.__class__.__name__
        full_name = f"{class_name} > {test_name}"
        
        # Get line number
        try:
            import inspect
            line_number = inspect.getsourcelines(getattr(test, test_name))[1]
        except:
            line_number = None
        
        # Create test result
        test_result = TestResult(
            name=test_name,
            full_name=full_name,
            status=status,
            duration=time.time() - self._test_start_time if hasattr(self, '_test_start_time') else 0,
            line_number=line_number,
            error=error
        )
        
        self.current_suite.tests.append(test_result)
        
    def _extract_error_info(self, err: Tuple[type, BaseException, Any]) -> ErrorInfo:
        """Extract error information from exception info."""
        exc_type, exc_value, exc_tb = err
        
        error_info = ErrorInfo(
            type=exc_type.__name__,
            message=str(exc_value)
        )
        
        # Extract traceback
        if exc_tb:
            tb_lines = traceback.format_tb(exc_tb)
            if tb_lines:
                # Get the last frame for code context
                last_frame = tb_lines[-1]
                
                # Extract file and line info
                import re
                match = re.search(r'File "(.+?)", line (\d+), in', last_frame)
                if match:
                    file_path = match.group(1)
                    line_num = int(match.group(2))
                    
                    # Try to get code context
                    try:
                        with open(file_path, 'r') as f:
                            lines = f.readlines()
                            
                        # Get surrounding lines
                        start = max(0, line_num - 3)
                        end = min(len(lines), line_num + 2)
                        
                        context_lines = []
                        for i in range(start, end):
                            prefix = ">" if i == line_num - 1 else " "
                            line_content = lines[i].rstrip()
                            context_lines.append(f"{prefix} {i+1:3d} | {line_content}")
                            
                            # Add error pointer for the specific line
                            if i == line_num - 1 and '^' in last_frame:
                                # Extract column position
                                pointer_match = re.search(r'\n\s*\^\s*\n', last_frame)
                                if pointer_match:
                                    # Add pointer line
                                    spaces = ' ' * 7  # Account for line number prefix
                                    context_lines.append(f"      | {spaces}^")
                        
                        error_info.code_context = "\n".join(context_lines)
                    except:
                        pass
            
            # Store limited stack trace
            if self.config.stack_trace_lines > 0:
                error_info.stack_trace = "".join(tb_lines[-self.config.stack_trace_lines:])
        
        # Extract expected/actual values
        expected, actual = self.classifier.extract_values(error_info.message)
        if expected:
            error_info.expected = expected
        if actual:
            error_info.actual = actual
        
        # Generate fix hint
        error_info.fix_hint = self.classifier.generate_fix_hint(error_info)
        
        return error_info
        
    def startTestRun(self):
        """Called once before any tests are run."""
        super().startTestRun()
        self._test_start_time = time.time()
        
    def stopTestRun(self):
        """Called once after all tests are run."""
        super().stopTestRun()
        
        # Format each completed suite
        for suite in self.suites.values():
            self.formatter.add_suite(suite)
        
        # Calculate exit code
        exit_code = 0 if self.wasSuccessful() else 1
        
        # Finish formatting
        self.formatter.finish(exit_code)


class LLMTestRunner(unittest.TextTestRunner):
    """Test runner that uses LLM-optimized result collector."""
    
    def __init__(self, stream=None, descriptions=True, verbosity=1,
                 failfast=False, buffer=False, resultclass=None,
                 warnings=None, *, tb_locals=False, config=None):
        # Load configuration
        self.config = config or ReporterConfig.load()
        
        # Use our custom result class
        if resultclass is None:
            resultclass = LLMTestResult
            
        # If outputting to file, suppress stream
        if self.config.output_file:
            stream = open(os.devnull, 'w')
            
        super().__init__(
            stream=stream,
            descriptions=descriptions,
            verbosity=0,  # Suppress default output
            failfast=failfast,
            buffer=buffer,
            resultclass=resultclass,
            warnings=warnings,
            tb_locals=tb_locals
        )
        
    def _makeResult(self):
        """Create test result instance."""
        result = self.resultclass(
            self.stream, self.descriptions, self.verbosity
        )
        if hasattr(result, 'config'):
            result.config = self.config
        return result


def main():
    """Command line interface for LLM unittest runner."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Run unittest with LLM-optimized reporter')
    parser.add_argument('--mode', choices=['summary', 'detailed'], 
                        help='Output mode')
    parser.add_argument('--output', help='Output file path')
    parser.add_argument('--pattern', default='test*.py',
                        help='Test file pattern (default: test*.py)')
    parser.add_argument('--start-directory', default='.',
                        help='Directory to start discovery (default: current)')
    parser.add_argument('--top-level-directory', 
                        help='Top level directory of project')
    parser.add_argument('tests', nargs='*', 
                        help='Specific test modules or TestCase classes')
    
    args = parser.parse_args()
    
    # Build config from arguments
    config_options = {}
    if args.mode:
        config_options['mode'] = args.mode
    if args.output:
        config_options['output_file'] = args.output
        
    config = ReporterConfig.load(config_options)
    
    # Create test runner
    runner = LLMTestRunner(config=config)
    
    # Discover and run tests
    if args.tests:
        # Run specific tests
        suite = unittest.TestLoader().loadTestsFromNames(args.tests)
    else:
        # Discover tests
        suite = unittest.TestLoader().discover(
            start_dir=args.start_directory,
            pattern=args.pattern,
            top_level_dir=args.top_level_directory
        )
    
    # Run tests
    result = runner.run(suite)
    
    # Exit with appropriate code
    sys.exit(0 if result.wasSuccessful() else 1)


if __name__ == '__main__':
    main()