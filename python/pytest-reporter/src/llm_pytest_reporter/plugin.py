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

# Add parent directories to path to import shared utilities
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent.parent / "shared"))

from config import ReporterConfig
from models import TestSuite, TestResult, TestStatus, ErrorInfo
from formatters import StreamingFormatter
from error_classifier import ErrorClassifier


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
            error_info.message = reprcrash.message
        
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
                    if lines and hasattr(last_entry, "reprfileloc"):
                        line_num = last_entry.reprfileloc.lineno
                        formatted_lines = []
                        
                        # Add context lines
                        for i, line in enumerate(lines):
                            offset = i - len(lines) // 2
                            current_line = line_num + offset
                            prefix = ">" if offset == 0 else " "
                            formatted_lines.append(f"{prefix} {current_line:3d} | {line}")
                        
                        error_info.code_context = "\n".join(formatted_lines)
        
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
        # Format each completed suite
        for suite in self.suites.values():
            self.formatter.add_suite(suite)
        
        # Finish formatting
        self.formatter.finish(exitstatus)
    
    def pytest_terminal_summary(self, terminalreporter, exitstatus, config):
        """Suppress default terminal summary when using LLM reporter."""
        # Clear terminal reporter stats to suppress default output
        if self.reporter_config.output_file:
            # When writing to file, we can suppress terminal output
            terminalreporter.stats.clear()


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
    if config.getoption("--llm-reporter") or os.environ.get("LLM_REPORTER_MODE") or os.environ.get("LLM_OUTPUT_MODE"):
        # Build options from command line
        options = {}
        if config.getoption("--llm-reporter-mode"):
            options["mode"] = config.getoption("--llm-reporter-mode")
        if config.getoption("--llm-reporter-output"):
            options["output_file"] = config.getoption("--llm-reporter-output")
        
        config.option.llm_reporter_options = options
        
        # Register our reporter
        reporter = LLMReporter(config, config.pluginmanager.get_plugin("terminalreporter"))
        config.pluginmanager.register(reporter, "llm_reporter")
        
        # Disable default terminal reporter output when using file output
        if reporter.reporter_config.output_file:
            config.option.verbose = -1
            config.option.quiet = True