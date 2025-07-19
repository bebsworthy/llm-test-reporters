# LLM Test Reporter Examples

This directory contains comprehensive examples for each supported testing framework.

## Available Examples

### TypeScript/JavaScript

- **[jest-example.md](./jest-example.md)** - Complete Jest reporter example with configuration, test files, and output samples
- **[vitest-example.md](./vitest-example.md)** - Complete Vitest reporter example with TypeScript support and Vitest-specific features

### Coming Soon

- **mocha-example.md** - Mocha reporter with async testing patterns
- **playwright-example.md** - E2E testing with browser contexts and screenshots
- **cypress-example.md** - Component and E2E testing with command logs

## Example Structure

Each example file contains:

1. **Setup Instructions** - How to install and configure the reporter
2. **Test Files** - Complete working test examples that demonstrate various failure types
3. **Configuration Options** - All available configuration methods
4. **Output Examples** - Actual output in both summary and detailed modes
5. **Environment Variables** - How to configure via environment
6. **CI/CD Integration** - GitHub Actions and other CI examples
7. **Advanced Configuration** - Different configs for dev, CI, and LLM analysis
8. **Framework-Specific Features** - Unique features of each testing framework

## Quick Start

1. Choose your testing framework
2. Open the corresponding example file
3. Copy the configuration and test files
4. Run the examples to see the LLM-optimized output

## Key Features Demonstrated

- ✅ Summary vs Detailed output modes
- ✅ Pattern detection across failures
- ✅ Clean output without ANSI codes
- ✅ File output for CI/CD artifacts
- ✅ Environment variable configuration
- ✅ Framework-specific error handling

## Best Practices

### For Local Development
- Use **detailed mode** for rich debugging information
- Enable **pattern detection** to spot systemic issues
- Keep **stack traces** for debugging (2-3 lines)

### For CI/CD
- Use **summary mode** to minimize log output
- Write to **file** for artifact storage
- Disable **stack traces** to save space
- Reduce **value lengths** (100-150 chars)

### For LLM Analysis
- Use **detailed mode** for context
- Enable **pattern detection** for insights
- Disable **stack traces** (LLMs don't need them)
- Moderate **value lengths** (150-200 chars)

## Contributing Examples

When adding new examples:

1. Use the existing format structure
2. Include realistic test scenarios
3. Show both passing and failing tests
4. Demonstrate framework-specific features
5. Provide complete, runnable code
6. Include actual output samples

## Support

For questions or issues:
- Check the [main documentation](../documentation/)
- Review the [configuration guide](../documentation/configuration.md)
- Submit issues to the project repository