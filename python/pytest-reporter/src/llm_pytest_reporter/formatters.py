"""Output formatters for LLM test reporters."""

import sys
from typing import List, Optional, TextIO
from datetime import datetime
from .models import TestSuite, TestResult, TestStatus, ErrorInfo
from .config import ReporterConfig


class BaseFormatter:
    """Base formatter for test output."""
    
    def __init__(self, config: ReporterConfig, output: Optional[TextIO] = None):
        self.config = config
        self.output = output or sys.stdout
        self._file_handle = None
        
        # If output file is specified, open it
        if config.output_file:
            try:
                self._file_handle = open(config.output_file, "w")
                self.output = self._file_handle
            except IOError:
                # Fall back to stdout on error
                pass
    
    def write(self, text: str):
        """Write text to output."""
        self.output.write(text)
        self.output.flush()
    
    def close(self):
        """Close file handle if opened."""
        if self._file_handle:
            self._file_handle.close()
    
    def format_header(self) -> str:
        """Format the report header."""
        mode = self.config.mode.upper()
        return f"# LLM TEST REPORTER - {mode} MODE\n\n"
    
    def format_suite(self, suite: TestSuite) -> str:
        """Format a test suite."""
        if self.config.mode == "summary":
            return self._format_suite_summary(suite)
        else:
            return self._format_suite_detailed(suite)
    
    def _format_suite_summary(self, suite: TestSuite) -> str:
        """Format suite in summary mode."""
        failed_tests = [t for t in suite.tests if t.status == TestStatus.FAILED]
        
        if not failed_tests and not self.config.include_passed_suites:
            return ""
        
        output = f"SUITE: {suite.file_path}\n"
        
        if failed_tests:
            output += "FAILED TESTS:\n"
            for test in failed_tests:
                error_msg = self._truncate_value(test.error.message) if test.error else "No error message"
                output += f"- {test.full_name}: {error_msg}\n"
        else:
            output += "ALL TESTS PASSED\n"
        
        return output + "\n"
    
    def _format_suite_detailed(self, suite: TestSuite) -> str:
        """Format suite in detailed mode."""
        output = ""
        failed_tests = [t for t in suite.tests if t.status == TestStatus.FAILED]
        
        for i, test in enumerate(failed_tests, 1):
            output += f"## TEST FAILURE #{i}\n"
            output += f"SUITE: {suite.name}\n"
            output += f"TEST: {test.full_name}\n"
            output += f"FILE: {suite.file_path}:{test.line_number or '?'}\n"
            
            if test.error:
                output += f"TYPE: {test.error.type}\n\n"
                
                if test.error.expected is not None:
                    output += f"EXPECTED: {self._truncate_value(test.error.expected)}\n"
                if test.error.actual is not None:
                    output += f"RECEIVED: {self._truncate_value(test.error.actual)}\n"
                
                if test.error.code_context:
                    output += "\nCODE CONTEXT:\n"
                    output += test.error.code_context + "\n"
                
                output += f"\nFAILURE REASON: {test.error.message}\n"
                
                if test.error.fix_hint:
                    output += f"FIX HINT: {test.error.fix_hint}\n"
            
            output += "\n---\n"
        
        return output
    
    def format_summary(self, suites: List[TestSuite], duration: float, exit_code: int) -> str:
        """Format the final summary."""
        total_tests = sum(len(s.tests) for s in suites)
        passed_tests = sum(len([t for t in s.tests if t.status == TestStatus.PASSED]) for s in suites)
        failed_tests = sum(len([t for t in s.tests if t.status == TestStatus.FAILED]) for s in suites)
        skipped_tests = sum(len([t for t in s.tests if t.status == TestStatus.SKIPPED]) for s in suites)
        
        passed_suites = len([s for s in suites if all(t.status != TestStatus.FAILED for t in s.tests)])
        failed_suites = len(suites) - passed_suites
        
        output = "---\n## SUMMARY\n"
        
        if self.config.mode == "summary":
            output += f"- PASSED SUITES: {passed_suites}\n"
            output += f"- FAILED SUITES: {failed_suites}\n"
        
        # Test counts
        test_summary = f"- TOTAL TESTS: {total_tests}"
        if total_tests > 0:
            parts = []
            if passed_tests > 0:
                parts.append(f"{passed_tests} passed")
            if failed_tests > 0:
                parts.append(f"{failed_tests} failed")
            if skipped_tests > 0:
                parts.append(f"{skipped_tests} skipped")
            test_summary += f" ({', '.join(parts)})"
        output += test_summary + "\n"
        
        # Additional detailed mode info
        if self.config.mode == "detailed" and total_tests > 0:
            failure_rate = (failed_tests / total_tests) * 100
            output += f"- FAILURE RATE: {failure_rate:.2f}%\n"
        
        output += f"- DURATION: {duration:.2f}s\n"
        output += f"- EXIT CODE: {exit_code}\n"
        
        return output
    
    def _truncate_value(self, value: str) -> str:
        """Truncate value to configured max length."""
        if len(value) <= self.config.max_value_length:
            return value
        return value[:self.config.max_value_length] + "..."


class StreamingFormatter(BaseFormatter):
    """Formatter that supports streaming output during test execution."""
    
    def __init__(self, config: ReporterConfig, output: Optional[TextIO] = None):
        super().__init__(config, output)
        self._header_written = False
        self._suites: List[TestSuite] = []
        self._start_time = datetime.now()
    
    def start(self):
        """Start the test run."""
        self.write(self.format_header())
        self._header_written = True
        self._start_time = datetime.now()
    
    def add_suite(self, suite: TestSuite):
        """Add a completed test suite."""
        self._suites.append(suite)
        suite_output = self.format_suite(suite)
        if suite_output:
            self.write(suite_output)
    
    def finish(self, exit_code: int = 0):
        """Finish the test run."""
        duration = (datetime.now() - self._start_time).total_seconds()
        self.write(self.format_summary(self._suites, duration, exit_code))
        self.close()