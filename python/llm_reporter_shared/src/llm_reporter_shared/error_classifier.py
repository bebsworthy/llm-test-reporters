"""Error classification and analysis utilities."""

import re
from typing import List, Dict, Optional, Tuple
from .models import ErrorInfo, TestResult, TestSuite


class ErrorClassifier:
    """Classifies and analyzes test errors."""
    
    # Common error patterns
    ASSERTION_PATTERNS = [
        (r"AssertionError", "Assertion Error"),
        (r"assert.*==", "Equality Assertion"),
        (r"assert.*!=", "Inequality Assertion"),
        (r"assert.*is", "Identity Assertion"),
        (r"assert.*in", "Membership Assertion"),
        (r"assertTrue|assertFalse", "Boolean Assertion"),
    ]
    
    EXCEPTION_PATTERNS = [
        (r"TypeError", "Type Error"),
        (r"ValueError", "Value Error"),
        (r"KeyError", "Key Error"),
        (r"IndexError", "Index Error"),
        (r"AttributeError", "Attribute Error"),
        (r"NameError", "Name Error"),
        (r"ImportError|ModuleNotFoundError", "Import Error"),
        (r"ZeroDivisionError", "Division by Zero"),
        (r"FileNotFoundError", "File Not Found"),
        (r"PermissionError", "Permission Error"),
        (r"TimeoutError", "Timeout Error"),
    ]
    
    ASYNC_PATTERNS = [
        (r"asyncio.*TimeoutError", "Async Timeout"),
        (r"RuntimeError.*await", "Async Runtime Error"),
        (r"not awaited", "Missing Await"),
    ]
    
    def classify_error(self, error: ErrorInfo) -> str:
        """Classify an error into a category."""
        error_text = f"{error.type} {error.message}"
        
        # Check assertion patterns
        for pattern, category in self.ASSERTION_PATTERNS:
            if re.search(pattern, error_text, re.IGNORECASE):
                return category
        
        # Check exception patterns
        for pattern, category in self.EXCEPTION_PATTERNS:
            if re.search(pattern, error_text, re.IGNORECASE):
                return category
        
        # Check async patterns
        for pattern, category in self.ASYNC_PATTERNS:
            if re.search(pattern, error_text, re.IGNORECASE):
                return category
        
        # Default classification based on error type
        if "Error" in error.type:
            return error.type
        
        return "Unknown Error"
    
    def generate_fix_hint(self, error: ErrorInfo) -> str:
        """Generate a fix hint based on error type and content."""
        error_type = error.type.lower()
        message = error.message.lower()
        
        # Type errors
        if "typeerror" in error_type:
            if "got" in message and "expected" in message:
                return "Check the types of arguments being passed"
            elif "not callable" in message:
                return "Ensure you're calling a function, not a value"
            elif "missing" in message and "argument" in message:
                return "Check function signature for required arguments"
            return "Verify data types match expected values"
        
        # Value errors
        elif "valueerror" in error_type:
            if "invalid literal" in message:
                return "Check input format and conversion logic"
            return "Ensure values are within expected range or format"
        
        # Key/Index errors
        elif "keyerror" in error_type:
            return "Verify dictionary key exists before access"
        elif "indexerror" in error_type:
            return "Check array bounds before accessing elements"
        
        # Attribute errors
        elif "attributeerror" in error_type:
            if "has no attribute" in message:
                return "Verify object has the attribute or method"
            return "Check object type and available attributes"
        
        # Import errors
        elif "importerror" in error_type or "modulenotfounderror" in error_type:
            return "Ensure module is installed and import path is correct"
        
        # Assertion errors
        elif "assertionerror" in error_type:
            if error.expected and error.actual:
                return f"Update test or implementation to match expected value"
            return "Review assertion logic and expected values"
        
        # Timeout errors
        elif "timeout" in error_type or "timeout" in message:
            return "Increase timeout duration or optimize async operations"
        
        # File errors
        elif "filenotfound" in error_type:
            return "Verify file path and ensure file exists"
        
        # Permission errors
        elif "permission" in error_type:
            return "Check file/directory permissions"
        
        # Default hint
        return "Review error message and stack trace for details"
    
    def extract_values(self, message: str) -> Tuple[Optional[str], Optional[str]]:
        """Extract expected and actual values from error message."""
        # Common assertion patterns
        patterns = [
            # pytest style: assert x == y
            r"assert\s+(.+?)\s*==\s*(.+)",
            # unittest style: Expected: x, but was: y
            r"Expected:\s*(.+?),\s*but\s*was:\s*(.+)",
            # Jest style: Expected x to equal y
            r"Expected\s+(.+?)\s+to\s+(?:equal|be)\s+(.+)",
            # Custom: expected x, got y
            r"expected\s+(.+?),\s*got\s+(.+)",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                actual = match.group(1).strip()
                expected = match.group(2).strip()
                return expected, actual
        
        return None, None
    
    def detect_patterns(self, suites: List[TestSuite]) -> Dict[str, List[TestResult]]:
        """Detect patterns across multiple test failures."""
        patterns: Dict[str, List[TestResult]] = {}
        
        for suite in suites:
            for test in suite.tests:
                if test.error:
                    category = self.classify_error(test.error)
                    if category not in patterns:
                        patterns[category] = []
                    patterns[category].append(test)
        
        # Filter out single occurrences
        return {k: v for k, v in patterns.items() if len(v) > 1}
    
    def generate_pattern_summary(self, patterns: Dict[str, List[TestResult]]) -> str:
        """Generate a summary of detected patterns."""
        if not patterns:
            return ""
        
        output = "\n## DETECTED PATTERNS\n"
        for category, tests in sorted(patterns.items(), key=lambda x: len(x[1]), reverse=True):
            output += f"- {category}: {len(tests)} occurrences\n"
            # Show first few test names
            for test in tests[:3]:
                output += f"  - {test.full_name}\n"
            if len(tests) > 3:
                output += f"  ... and {len(tests) - 3} more\n"
        
        return output