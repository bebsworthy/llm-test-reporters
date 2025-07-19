# LLM Test Reporter Format Examples

This directory contains example outputs demonstrating the expected format for LLM-optimized test reporters.

## Summary Mode Examples

- `summary-mode-simple.txt` - Basic example with one failing test suite
- `summary-mode-multiple-suites.txt` - Multiple test suites with failures
- `summary-mode-all-passing.txt` - All tests passing

## Detailed Mode Examples

- `detailed-mode-simple.txt` - Basic example with detailed failure information
- `detailed-mode-error-types.txt` - Examples of each error type classification
- `detailed-mode-patterns.txt` - Pattern detection across multiple failures

## Key Format Requirements

1. **Header**: Must start with `# LLM TEST REPORTER - {MODE}`
2. **No ANSI codes**: Plain text only, no color codes
3. **File references**: Always include line numbers (e.g., `/path/file.ts:42`)
4. **Consistent separators**: Use `---` between sections
5. **Summary section**: Required in all outputs

## Usage

These examples serve as:
- Reference implementation for reporter developers
- Test fixtures for validation suite
- Documentation of expected output format

When implementing a new reporter, ensure your output matches these examples exactly (except for actual test data).