"""Configuration management for LLM test reporters."""

import os
import json
from typing import Optional, Literal, Dict, Any
from dataclasses import dataclass, field

OutputMode = Literal["summary", "detailed"]


@dataclass
class ReporterConfig:
    """Configuration for LLM test reporters."""
    
    mode: OutputMode = "summary"
    include_passed_suites: bool = False
    max_value_length: int = 100
    stack_trace_lines: int = 5
    detect_patterns: bool = True
    output_file: Optional[str] = None
    
    @classmethod
    def from_env(cls) -> "ReporterConfig":
        """Load configuration from environment variables."""
        config = cls()
        
        # Check both LLM_REPORTER_MODE and LLM_OUTPUT_MODE for compatibility
        mode = os.environ.get("LLM_REPORTER_MODE") or os.environ.get("LLM_OUTPUT_MODE")
        if mode and mode.lower() in ["summary", "detailed"]:
            config.mode = mode.lower()
        
        # Output file
        output_file = os.environ.get("LLM_OUTPUT_FILE")
        if output_file:
            config.output_file = output_file
        
        # Include passed suites
        include_passed = os.environ.get("LLM_INCLUDE_PASSED_SUITES", "").lower()
        if include_passed in ["true", "1", "yes"]:
            config.include_passed_suites = True
        
        # Max value length
        max_length = os.environ.get("LLM_MAX_VALUE_LENGTH")
        if max_length and max_length.isdigit():
            config.max_value_length = int(max_length)
        
        # Stack trace lines
        stack_lines = os.environ.get("LLM_STACK_TRACE_LINES")
        if stack_lines and stack_lines.isdigit():
            config.stack_trace_lines = int(stack_lines)
        
        # Pattern detection
        detect = os.environ.get("LLM_DETECT_PATTERNS", "").lower()
        if detect in ["false", "0", "no"]:
            config.detect_patterns = False
        
        return config
    
    @classmethod
    def from_file(cls, file_path: str = ".llm-reporter.json") -> "ReporterConfig":
        """Load configuration from JSON file."""
        config = cls()
        
        if os.path.exists(file_path):
            try:
                with open(file_path, "r") as f:
                    data = json.load(f)
                
                if "mode" in data and data["mode"] in ["summary", "detailed"]:
                    config.mode = data["mode"]
                if "includePassedSuites" in data:
                    config.include_passed_suites = bool(data["includePassedSuites"])
                if "maxValueLength" in data:
                    config.max_value_length = int(data["maxValueLength"])
                if "stackTraceLines" in data:
                    config.stack_trace_lines = int(data["stackTraceLines"])
                if "detectPatterns" in data:
                    config.detect_patterns = bool(data["detectPatterns"])
                if "outputFile" in data:
                    config.output_file = data["outputFile"]
            except (json.JSONDecodeError, ValueError):
                pass  # Use defaults on error
        
        return config
    
    @classmethod
    def load(cls, options: Optional[Dict[str, Any]] = None) -> "ReporterConfig":
        """Load configuration from multiple sources with precedence."""
        # Start with file config
        config = cls.from_file()
        
        # Override with environment variables
        env_config = cls.from_env()
        if env_config.mode != cls().mode:
            config.mode = env_config.mode
        if env_config.output_file is not None:
            config.output_file = env_config.output_file
        if env_config.include_passed_suites != cls().include_passed_suites:
            config.include_passed_suites = env_config.include_passed_suites
        if env_config.max_value_length != cls().max_value_length:
            config.max_value_length = env_config.max_value_length
        if env_config.stack_trace_lines != cls().stack_trace_lines:
            config.stack_trace_lines = env_config.stack_trace_lines
        if env_config.detect_patterns != cls().detect_patterns:
            config.detect_patterns = env_config.detect_patterns
        
        # Override with explicit options
        if options:
            if "mode" in options and options["mode"] in ["summary", "detailed"]:
                config.mode = options["mode"]
            if "include_passed_suites" in options:
                config.include_passed_suites = bool(options["include_passed_suites"])
            if "max_value_length" in options:
                config.max_value_length = int(options["max_value_length"])
            if "stack_trace_lines" in options:
                config.stack_trace_lines = int(options["stack_trace_lines"])
            if "detect_patterns" in options:
                config.detect_patterns = bool(options["detect_patterns"])
            if "output_file" in options:
                config.output_file = options["output_file"]
        
        return config