"""Pytest plugin for LLM-optimized test reporting."""

import sys
import os
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime

import pytest
from _pytest.config import Config
from _pytest.terminal import TerminalReporter
from _pytest.reports import TestReport
from _pytest._code import ExceptionInfo

# Import from shared package
from llm_reporter_shared import (
    ReporterConfig,
    StreamingFormatter,
    ErrorClassifier,
    TestSuite,
    TestResult,
    TestStatus,
    ErrorInfo
)


class LLMReporter:
    """LLM-optimized pytest reporter."""
    
    def __init__(self, config: Config, terminal_reporter: TerminalReporter):
        self.config = config
        self.terminal_reporter = terminal_reporter
        
        # Load reporter configuration
        pytest_options = {}
        if hasattr(config, "option") and hasattr(config.option, "llm_reporter_options"):
            pytest_options = config.option.llm_reporter_options or {}
        
        self.reporter_config = ReporterConfig.load(pytest_options)
        self.formatter = StreamingFormatter(self.reporter_config)
        self.classifier = ErrorClassifier()
        
        # Test tracking
        self.suites: Dict[str, TestSuite] = {}
        self.current_suite: Optional[TestSuite] = None
        self.start_time = datetime.now()
        self._started = False
    
    def pytest_runtest_protocol(self, item, nextitem):
        """Called for each test item."""
        # Only process if reporter is active
        if not hasattr(self.config.option, 'llm_reporter_active') or not self.config.option.llm_reporter_active:
            return
            
        # Get file path
        file_path = str(item.fspath)
        
        # Create or get suite
        if file_path not in self.suites:
            suite_name = item.module.__name__ if hasattr(item, "module") else Path(file_path).stem
            self.suites[file_path] = TestSuite(
                name=suite_name,
                file_path=file_path
            )
        
        self.current_suite = self.suites[file_path]
    
    def pytest_runtest_logreport(self, report: TestReport):
        """Process test report."""
        # Only process if reporter is active
        if not hasattr(self.config.option, 'llm_reporter_active') or not self.config.option.llm_reporter_active:
            return
            
        if not self._started:
            self.formatter.start()
            self._started = True
        
        # Only process call reports (not setup/teardown)
        if report.when == "call":
            self._process_test_report(report)
        elif report.when == "setup" and report.failed:
            self._process_setup_failure(report)
        elif report.when == "teardown" and report.failed:
            self._process_teardown_failure(report)
    
    def _process_test_report(self, report: TestReport):
        """Process a test call report."""
        if not self.current_suite:
            return
        
        # Determine test status
        if report.passed:
            status = TestStatus.PASSED
        elif report.failed:
            status = TestStatus.FAILED
        elif report.skipped:
            status = TestStatus.SKIPPED
        else:
            status = TestStatus.PENDING
        
        # Create test result
        test_name = report.nodeid.split("::")[-1]
        full_name = report.nodeid.replace("::", " > ")
        
        test_result = TestResult(
            name=test_name,
            full_name=full_name,
            status=status,
            duration=report.duration,
            line_number=report.location[1] if report.location else None
        )
        
        # Add error info if failed
        if report.failed and report.longrepr:
            test_result.error = self._extract_error_info(report)
        
        self.current_suite.tests.append(test_result)
    
    def _clean_error_message(self, message: str) -> str:
        """Clean up pytest's assertion messages."""
        # Remove assert prefix
        if message.startswith("assert "):
            message = message[7:]
        
        # Handle pytest's detailed assertion output
        lines = message.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Skip pytest-specific formatting
            if any(skip in line for skip in [
                "+ where", 
                "Use -v to get more diff",
                "At index",
                "Differing items:",
                "Full diff:",
                "Left contains",
                "Right contains",
                "...Full output truncated"
            ]):
                continue
            
            # Clean up line
            line = line.strip()
            if line and not line.startswith(('+', '-', '?', '~')):
                cleaned_lines.append(line)
        
        # Join and return
        result = '\n'.join(cleaned_lines).strip()
        
        # If we have a simple comparison, extract just that
        import re
        simple_compare = re.match(r'^(\S+)\s*(==|!=|<|>|<=|>=|is|is not|in|not in)\s*(.+)$', result)
        if simple_compare:
            return result
        
        # Otherwise return the cleaned message
        return result or message
    
    def _process_setup_failure(self, report: TestReport):
        """Process setup failure."""
        if self.current_suite and report.longrepr:
            self.current_suite.setup_error = self._extract_error_info(report)
    
    def _process_teardown_failure(self, report: TestReport):
        """Process teardown failure."""
        if self.current_suite and report.longrepr:
            self.current_suite.teardown_error = self._extract_error_info(report)
    
    def _extract_error_info(self, report: TestReport) -> ErrorInfo:
        """Extract error information from test report."""
        error_info = ErrorInfo(
            type="Unknown Error",
            message="Test failed"
        )
        
        if hasattr(report.longrepr, "reprcrash"):
            # Extract from reprcrash
            reprcrash = report.longrepr.reprcrash
            error_info.type = reprcrash.message.split(":")[0] if ":" in reprcrash.message else "Error"
            error_info.message = self._clean_error_message(reprcrash.message)
        
        # Extract traceback and values
        if hasattr(report.longrepr, "reprtraceback"):
            # Get the last traceback entry for code context
            if report.longrepr.reprtraceback.reprentries:
                last_entry = report.longrepr.reprtraceback.reprentries[-1]
                if hasattr(last_entry, "lines"):
                    # Extract code context
                    lines = []
                    for line in last_entry.lines:
                        if isinstance(line, tuple) and len(line) >= 2:
                            lines.append(line[0] + line[1])
                        else:
                            lines.append(str(line))
                    
                    # Format code context with line numbers
                    if lines and hasattr(last_entry, "reprfileloc") and last_entry.reprfileloc:
                        line_num = last_entry.reprfileloc.lineno
                        formatted_lines = []
                        
                        # Add context lines
                        for i, line in enumerate(lines):
                            offset = i - len(lines) // 2
                            current_line = line_num + offset
                            prefix = ">" if offset == 0 else " "
                            formatted_lines.append(f"{prefix} {current_line:3d} | {line}")
                        
                        error_info.code_context = "\n".join(formatted_lines)
        
        # If we didn't get a good message from reprcrash, try str(longrepr)
        if error_info.message == "Test failed" and hasattr(report, 'longrepr'):
            full_message = str(report.longrepr)
            # Extract just the assertion line if present
            lines = full_message.split('\n')
            for line in lines:
                if 'assert' in line or '==' in line or '!=' in line:
                    error_info.message = self._clean_error_message(line)
                    break
        
        # Extract expected/actual values
        expected, actual = self.classifier.extract_values(error_info.message)
        if expected:
            error_info.expected = expected
        if actual:
            error_info.actual = actual
        
        # Generate fix hint
        error_info.fix_hint = self.classifier.generate_fix_hint(error_info)
        
        return error_info
    
    def pytest_sessionfinish(self, session, exitstatus):
        """Called after whole test run finishes."""
        # Only process if reporter is active
        if not hasattr(self.config.option, 'llm_reporter_active') or not self.config.option.llm_reporter_active:
            return
            
        # Format each completed suite
        for suite in self.suites.values():
            self.formatter.add_suite(suite)
        
        # Finish formatting
        self.formatter.finish(exitstatus)
    
    def pytest_terminal_summary(self, terminalreporter, exitstatus, config):
        """Suppress default terminal summary when using LLM reporter."""
        # Only process if reporter is active
        if not hasattr(self.config.option, 'llm_reporter_active') or not self.config.option.llm_reporter_active:
            return
            
        # Clear terminal reporter stats to suppress default output
        # Don't set _session to None as pytest still needs it
        terminalreporter.stats.clear()
        if hasattr(terminalreporter, '_durations'):
            terminalreporter._durations.clear()
        
        # Don't show the summary
        terminalreporter.summary_errors = lambda: None
        terminalreporter.summary_failures = lambda: None
        terminalreporter.summary_warnings = lambda: None
        terminalreporter.short_test_summary = lambda: None
    
    def pytest_report_teststatus(self, report, config):
        """Override test status to suppress progress output."""
        # Only process if reporter is active
        if not hasattr(self.config.option, 'llm_reporter_active') or not self.config.option.llm_reporter_active:
            return
        
        # Return empty status to suppress progress indicators
        return "", "", ""
    
    def pytest_report_header(self, config, start_path):
        """Suppress pytest header."""
        # Only process if reporter is active
        if not hasattr(self.config.option, 'llm_reporter_active') or not self.config.option.llm_reporter_active:
            return
        
        # Return empty list to suppress header
        return []


def pytest_addoption(parser):
    """Add command line options."""
    group = parser.getgroup("llm-reporter")
    group.addoption(
        "--llm-reporter",
        action="store_true",
        help="Enable LLM-optimized test reporter"
    )
    group.addoption(
        "--llm-reporter-mode",
        choices=["summary", "detailed"],
        help="Reporter output mode"
    )
    group.addoption(
        "--llm-reporter-output",
        help="Output file path"
    )


def pytest_configure(config):
    """Configure plugin."""
    # Check if we should activate the reporter
    should_activate = (
        config.getoption("--llm-reporter", False) or 
        os.environ.get("LLM_REPORTER_MODE") or 
        os.environ.get("LLM_OUTPUT_MODE")
    )
    
    if should_activate:
        # Build options from command line
        options = {}
        if hasattr(config.option, "llm_reporter_mode") and config.option.llm_reporter_mode:
            options["mode"] = config.option.llm_reporter_mode
        if hasattr(config.option, "llm_reporter_output") and config.option.llm_reporter_output:
            options["output_file"] = config.option.llm_reporter_output
        
        config.option.llm_reporter_options = options
        config.option.llm_reporter_active = True
        
        # Register our reporter
        terminal_reporter = config.pluginmanager.get_plugin("terminalreporter")
        reporter = LLMReporter(config, terminal_reporter)
        
        # Register hooks
        config.pluginmanager.register(reporter, "llm_reporter_instance")
        
        # Suppress default terminal reporter output 
        config.option.verbose = -1
        config.option.quiet = True
        if terminal_reporter:
            terminal_reporter.showheader = False
            terminal_reporter.showfspath = False
            terminal_reporter.showprogress = False