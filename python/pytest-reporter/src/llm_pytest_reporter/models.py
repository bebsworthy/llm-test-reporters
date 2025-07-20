"""Data models for test results."""

from enum import Enum
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field


class TestStatus(Enum):
    """Test execution status."""
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    PENDING = "pending"


@dataclass
class ErrorInfo:
    """Information about a test failure."""
    type: str
    message: str
    expected: Optional[str] = None
    actual: Optional[str] = None
    stack_trace: Optional[str] = None
    code_context: Optional[str] = None
    fix_hint: Optional[str] = None


@dataclass
class TestResult:
    """Individual test result."""
    name: str
    full_name: str
    status: TestStatus
    duration: float = 0.0
    line_number: Optional[int] = None
    error: Optional[ErrorInfo] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TestSuite:
    """Test suite containing multiple test results."""
    name: str
    file_path: str
    tests: List[TestResult] = field(default_factory=list)
    setup_error: Optional[ErrorInfo] = None
    teardown_error: Optional[ErrorInfo] = None
    duration: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    @property
    def passed(self) -> bool:
        """Check if all tests in suite passed."""
        return all(t.status == TestStatus.PASSED for t in self.tests) and not self.setup_error and not self.teardown_error
    
    @property
    def failed_count(self) -> int:
        """Count of failed tests."""
        return len([t for t in self.tests if t.status == TestStatus.FAILED])
    
    @property
    def passed_count(self) -> int:
        """Count of passed tests."""
        return len([t for t in self.tests if t.status == TestStatus.PASSED])
    
    @property
    def skipped_count(self) -> int:
        """Count of skipped tests."""
        return len([t for t in self.tests if t.status == TestStatus.SKIPPED])