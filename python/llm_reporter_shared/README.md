# LLM Reporter Shared Utilities

Shared utilities for LLM-optimized test reporters in Python.

## Installation

This package is typically installed as a dependency of specific test reporters:
- `llm-pytest-reporter`
- `llm-unittest-reporter`

For development:
```bash
pip install -e .
```

## Components

- **ReporterConfig**: Configuration management for reporter behavior
- **Models**: Data models for test results (TestSuite, TestResult, ErrorInfo)
- **StreamingFormatter**: Formats test output in LLM-optimized format
- **ErrorClassifier**: Classifies and enhances error information

## Usage

```python
from llm_reporter_shared import ReporterConfig, StreamingFormatter, ErrorClassifier
from llm_reporter_shared.models import TestSuite, TestResult, TestStatus

# Load configuration
config = ReporterConfig.load()

# Create formatter
formatter = StreamingFormatter(config)

# Use error classifier
classifier = ErrorClassifier()
```