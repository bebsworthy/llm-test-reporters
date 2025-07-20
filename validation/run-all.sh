#!/bin/bash

# Cross-language validation runner for LLM test reporters
# Outputs results in LLM reporter format

set -e

# Ensure all child processes are terminated on exit
trap 'kill $(jobs -p) 2>/dev/null' EXIT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VALIDATION_SUITE="$PROJECT_ROOT/shared/validation-suite"
RESULTS_DIR="$SCRIPT_DIR/results"
PYTHON_VENV="$PROJECT_ROOT/python/.venv"

# Setup Python environment if needed
setup_python_env() {
    if [ ! -d "$PYTHON_VENV" ]; then
        echo "Python virtual environment not found. Setting up..."
        (cd "$PROJECT_ROOT/python" && ./setup_venv.sh) > /dev/null 2>&1
    fi
}

# Parse command line arguments
MODE="summary"
LANGUAGES=()

# Process all arguments
for arg in "$@"; do
    case "$arg" in
        --detailed|-d)
            MODE="detailed"
            ;;
        typescript|python|go|java)
            LANGUAGES+=("$arg")
            ;;
        *)
            echo "Unknown argument: $arg"
            echo "Usage: $0 [--detailed|-d] [typescript] [python] [go] [java]"
            echo "  Run with no language arguments to test all languages"
            exit 1
            ;;
    esac
done

# If no languages specified, run all
if [ ${#LANGUAGES[@]} -eq 0 ]; then
    LANGUAGES=("typescript" "python" "go" "java")
fi

# Test tracking arrays
declare -a TEST_RESULTS
declare -a TEST_SUITES
declare -i TOTAL_TESTS=0
declare -i PASSED_TESTS=0
declare -i FAILED_TESTS=0
declare -i PASSED_SUITES=0
declare -i FAILED_SUITES=0
START_TIME=$(date +%s)

# Clean and create results directory silently
rm -rf "$RESULTS_DIR" 2>/dev/null || true
mkdir -p "$RESULTS_DIR"

# Function to add test result
add_test_result() {
    local suite=$1
    local test_name=$2
    local status=$3
    local error_msg=$4
    local duration=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [[ "$status" == "passed" ]]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        # Store failed test info
        TEST_RESULTS+=("${suite}|${test_name}|${error_msg}")
    fi
}

# Global variable for duration to avoid command substitution issues
LAST_DURATION=0

# Function to run a reporter and capture output
run_reporter() {
    local lang=$1
    local framework=$2
    local reporter_path=$3
    local mode=$4
    local output_file="$RESULTS_DIR/${lang}_${framework}_${mode}.txt"
    local test_start=$(date +%s)
    
    # Framework-specific test commands
    case "$framework" in
        "jest")
            if cd "$reporter_path" 2>/dev/null && npm run build > /dev/null 2>&1; then
                # Run test and capture full output (ignore exit code since tests may fail)
                LLM_REPORTER_MODE=$mode npm run test:example > "$output_file" 2>&1 || true
                
                # Check if output was generated
                if [ -s "$output_file" ] && grep -q "# LLM TEST REPORTER" "$output_file"; then
                    echo -n ""  # Success - output generated
                else
                    return 1
                fi
            else
                return 1
            fi
            ;;
        "vitest")
            if cd "$reporter_path" 2>/dev/null && npm run build > /dev/null 2>&1; then
                # Run test and capture full output (ignore exit code since tests may fail)
                LLM_REPORTER_MODE=$mode npm run test:example > "$output_file" 2>&1 || true
                
                # Check if output was generated
                if [ -s "$output_file" ] && grep -q "# LLM TEST REPORTER" "$output_file"; then
                    echo -n ""  # Success - output generated
                else
                    return 1
                fi
            else
                return 1
            fi
            ;;
        "mocha")
            if cd "$reporter_path" 2>/dev/null && npm run build > /dev/null 2>&1; then
                # Run test and capture full output (ignore exit code since tests may fail)
                LLM_REPORTER_MODE=$mode npm test > "$output_file" 2>&1 || true
                
                # Check if output was generated
                if [ -s "$output_file" ] && grep -q "# LLM TEST REPORTER" "$output_file"; then
                    echo -n ""  # Success - output generated
                else
                    return 1
                fi
            else
                return 1
            fi
            ;;
        "playwright")
            if cd "$reporter_path" 2>/dev/null && npm run build > /dev/null 2>&1; then
                # Ensure Playwright browsers are installed
                npx playwright install chromium > /dev/null 2>&1 || true
                
                # Run test and capture full output (ignore exit code since tests may fail)
                LLM_REPORTER_MODE=$mode npm run test:example > "$output_file" 2>&1 || true
                
                # Check if output was generated
                if [ -s "$output_file" ] && grep -q "# LLM TEST REPORTER" "$output_file"; then
                    echo -n ""  # Success - output generated
                else
                    return 1
                fi
            else
                return 1
            fi
            ;;
        "cypress")
            if cd "$reporter_path" 2>/dev/null && npm run build > /dev/null 2>&1; then
                # Ensure Cypress is installed
                npx cypress install > /dev/null 2>&1 || true
                
                # Run test and capture full output (ignore exit code since tests may fail)
                LLM_REPORTER_MODE=$mode npm run test:example > "$output_file" 2>&1 || true
                
                # Check if output was generated
                if [ -s "$output_file" ] && grep -q "# LLM TEST REPORTER" "$output_file"; then
                    echo -n ""  # Success - output generated
                else
                    return 1
                fi
            else
                return 1
            fi
            ;;
        "pytest")
            if cd "$reporter_path" 2>/dev/null; then
                # Ensure Python environment is set up
                setup_python_env
                
                # Activate virtual environment and run tests
                (
                    source "$PYTHON_VENV/bin/activate"
                    export PYTHONPATH="$PROJECT_ROOT/python:$PYTHONPATH"
                    
                    # Run pytest with the LLM reporter (-p no:terminal to disable default output)
                    LLM_OUTPUT_MODE=$mode pytest -p no:terminal --llm-reporter tests/ > "$output_file" 2>&1 || true
                )
                
                # Check if output was generated
                if [ -s "$output_file" ] && grep -q "# LLM TEST REPORTER" "$output_file"; then
                    echo -n ""  # Success - output generated
                else
                    return 1
                fi
            else
                return 1
            fi
            ;;
        "unittest")
            if cd "$reporter_path" 2>/dev/null; then
                # Ensure Python environment is set up
                setup_python_env
                
                # Activate virtual environment and run tests
                (
                    source "$PYTHON_VENV/bin/activate"
                    export PYTHONPATH="$PROJECT_ROOT/python:$PYTHONPATH"
                    
                    # Run unittest with the LLM reporter
                    LLM_OUTPUT_MODE=$mode python -u -m llm_unittest_reporter --start-directory tests > "$output_file" 2>&1 || true
                )
                
                # Check if output was generated
                if [ -s "$output_file" ] && grep -q "# LLM TEST REPORTER" "$output_file"; then
                    echo -n ""  # Success - output generated
                else
                    return 1
                fi
            else
                return 1
            fi
            ;;
        "testing")
            if cd "$reporter_path" 2>/dev/null; then
                # Build the reporter
                if go build -o llm-go-test . > /dev/null 2>&1; then
                    # Run tests and write output directly, close all unnecessary file descriptors
                    # This prevents hanging when the script output is piped
                    ./llm-go-test -mode $mode -output "$output_file" ./tests </dev/null >/dev/null 2>&1 &
                    local test_pid=$!
                    
                    # Wait for the test to complete (with timeout)
                    local waited=0
                    while kill -0 $test_pid 2>/dev/null && [ $waited -lt 30 ]; do
                        sleep 1
                        waited=$((waited + 1))
                    done
                    
                    # Kill if still running
                    if kill -0 $test_pid 2>/dev/null; then
                        kill -9 $test_pid 2>/dev/null
                        wait $test_pid 2>/dev/null
                        local exit_code=1
                    else
                        wait $test_pid
                        local exit_code=$?
                    fi
                    
                    # Check if output was generated
                    if [ -s "$output_file" ] && grep -q "# LLM TEST REPORTER" "$output_file"; then
                        echo -n ""  # Success
                    else
                        return 1
                    fi
                else
                    return 1
                fi
            else
                return 1
            fi
            ;;
        "junit"|"testng")
            # Not implemented yet
            return 1
            ;;
        *)
            return 1
            ;;
    esac
    
    local test_end=$(date +%s)
    LAST_DURATION=$((test_end - test_start))
    return 0
}


# Function to check if a language should be run
should_run_language() {
    local lang=$1
    for selected in "${LANGUAGES[@]}"; do
        if [[ "$selected" == "$lang" ]]; then
            return 0
        fi
    done
    return 1
}

# Run all TypeScript reporters
if should_run_language "typescript"; then
    CURRENT_SUITE="validation/typescript-reporters"
    declare -i suite_has_failures=0

    for framework in jest vitest mocha playwright cypress; do
        reporter_path="$PROJECT_ROOT/typescript/${framework}-reporter"
        if [ -d "$reporter_path" ]; then
            # Test both summary and detailed modes
            for test_mode in summary detailed; do
                test_name="typescript > $framework > $test_mode mode"
                
                # Run reporter and measure time
                if run_reporter "typescript" "$framework" "$reporter_path" "$test_mode"; then
                    # Mark as passed for now - actual validation will happen with Python script
                    add_test_result "$CURRENT_SUITE" "$test_name" "passed" "" "$LAST_DURATION"
                else
                    add_test_result "$CURRENT_SUITE" "$test_name" "failed" "Reporter execution failed" "0"
                    suite_has_failures=1
                fi
            done
        else
            test_name="typescript > $framework > summary mode"
            add_test_result "$CURRENT_SUITE" "$test_name" "failed" "Not implemented yet" "0"
            test_name="typescript > $framework > detailed mode"
            add_test_result "$CURRENT_SUITE" "$test_name" "failed" "Not implemented yet" "0"
            suite_has_failures=1
        fi
    done

    # Track suite result
    if [ $suite_has_failures -eq 0 ]; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        FAILED_SUITES=$((FAILED_SUITES + 1))
        TEST_SUITES+=("$CURRENT_SUITE")
    fi
fi # end of TypeScript section

# Run all Python reporters
if should_run_language "python"; then
    CURRENT_SUITE="validation/python-reporters"
    suite_has_failures=0

    for framework in pytest unittest; do
        reporter_path="$PROJECT_ROOT/python/${framework}-reporter"
        if [ -d "$reporter_path" ]; then
            # Test both summary and detailed modes
            for test_mode in summary detailed; do
                test_name="python > $framework > $test_mode mode"
                
                if run_reporter "python" "$framework" "$reporter_path" "$test_mode"; then
                    add_test_result "$CURRENT_SUITE" "$test_name" "passed" "" "$LAST_DURATION"
                else
                    add_test_result "$CURRENT_SUITE" "$test_name" "failed" "Reporter execution failed" "0"
                    suite_has_failures=1
                fi
            done
        else
            test_name="python > $framework > summary mode"
            add_test_result "$CURRENT_SUITE" "$test_name" "failed" "Not implemented yet" "0"
            test_name="python > $framework > detailed mode"
            add_test_result "$CURRENT_SUITE" "$test_name" "failed" "Not implemented yet" "0"
            suite_has_failures=1
        fi
    done

    if [ $suite_has_failures -eq 0 ]; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        FAILED_SUITES=$((FAILED_SUITES + 1))
        TEST_SUITES+=("$CURRENT_SUITE")
    fi
fi # end of Python section

# Run all Go reporters
if should_run_language "go"; then
    CURRENT_SUITE="validation/go-reporters"
    suite_has_failures=0

    for framework in testing; do
        reporter_path="$PROJECT_ROOT/go/${framework}-reporter"
        if [ -d "$reporter_path" ]; then
            # Test both summary and detailed modes
            for test_mode in summary detailed; do
                test_name="go > $framework > $test_mode mode"
                
                if run_reporter "go" "$framework" "$reporter_path" "$test_mode"; then
                    add_test_result "$CURRENT_SUITE" "$test_name" "passed" "" "$LAST_DURATION"
                else
                    add_test_result "$CURRENT_SUITE" "$test_name" "failed" "Reporter execution failed" "0"
                    suite_has_failures=1
                fi
            done
        else
            test_name="go > $framework > summary mode"
            add_test_result "$CURRENT_SUITE" "$test_name" "failed" "Not implemented yet" "0"
            test_name="go > $framework > detailed mode"
            add_test_result "$CURRENT_SUITE" "$test_name" "failed" "Not implemented yet" "0"
            suite_has_failures=1
        fi
    done

    if [ $suite_has_failures -eq 0 ]; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        FAILED_SUITES=$((FAILED_SUITES + 1))
        TEST_SUITES+=("$CURRENT_SUITE")
    fi
fi # end of Go section

# Run all Java reporters
if should_run_language "java"; then
    CURRENT_SUITE="validation/java-reporters"
    suite_has_failures=0

        for framework in junit testng; do
        reporter_path="$PROJECT_ROOT/java/${framework}-reporter"
        test_name="java > $framework > summary mode"
        
        if [ -d "$reporter_path" ]; then
            if run_reporter "java" "$framework" "$reporter_path" "summary"; then
                add_test_result "$CURRENT_SUITE" "$test_name" "passed" "" "$LAST_DURATION"
            else
                add_test_result "$CURRENT_SUITE" "$test_name" "failed" "Reporter execution failed" "0"
                suite_has_failures=1
            fi
        else
            add_test_result "$CURRENT_SUITE" "$test_name" "failed" "Not implemented yet" "0"
            suite_has_failures=1
        fi
    done

    if [ $suite_has_failures -eq 0 ]; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        FAILED_SUITES=$((FAILED_SUITES + 1))
        TEST_SUITES+=("$CURRENT_SUITE")
    fi
fi # end of Java section

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Run Python validation on all output files (only if running all languages)
if [ ${#LANGUAGES[@]} -eq 4 ]; then
    echo ""
    echo "Running format validation..."
    
    # Ensure Python environment is set up for validation
    setup_python_env
    
    # Run validation with virtual environment Python
    if "$PYTHON_VENV/bin/python" -u "$SCRIPT_DIR/compare-outputs.py" "$RESULTS_DIR"; then
        echo "Format validation passed"
    else
        echo "Format validation found issues - see report above"
    fi
    echo ""
fi

# Output in LLM reporter format
if [[ "$MODE" == "summary" ]]; then
    echo "# LLM TEST REPORTER - SUMMARY MODE"
    echo ""
    
    # Group failures by suite
    current_suite=""
    first_suite=true
    
    for result in "${TEST_RESULTS[@]}"; do
        IFS='|' read -r suite test_name error_msg <<< "$result"
        
        if [[ "$suite" != "$current_suite" ]]; then
            if [[ "$first_suite" == false ]]; then
                echo ""
                echo "---"
            fi
            echo "SUITE: $suite"
            echo "FAILED TESTS:"
            current_suite="$suite"
            first_suite=false
        fi
        
        # Truncate error message at 80 chars if needed
        if [[ ${#error_msg} -gt 80 ]]; then
            error_msg="${error_msg:0:77}..."
        fi
        
        echo "- $test_name: $error_msg"
    done
    
    if [[ ${#TEST_RESULTS[@]} -gt 0 ]]; then
        echo ""
        echo "---"
    fi
    
    echo "## SUMMARY"
    echo "- PASSED SUITES: $PASSED_SUITES"
    echo "- FAILED SUITES: $FAILED_SUITES"
    echo "- TOTAL TESTS: $TOTAL_TESTS ($PASSED_TESTS passed, $FAILED_TESTS failed)"
    echo "- DURATION: ${DURATION}s"
    
    # Exit code
    if [[ $FAILED_TESTS -gt 0 ]]; then
        echo "- EXIT CODE: 1"
        exit 1
    else
        echo "- EXIT CODE: 0"
        exit 0
    fi
else
    # Detailed mode - not implemented yet
    echo "# LLM TEST REPORTER - DETAILED MODE"
    echo ""
    echo "Detailed mode not yet implemented"
    echo ""
    echo "---"
    echo "## SUMMARY"
    echo "- TOTAL TESTS: $TOTAL_TESTS ($PASSED_TESTS passed, $FAILED_TESTS failed)"
    echo "- FAILURE RATE: $(( FAILED_TESTS * 100 / TOTAL_TESTS ))%"
    echo "- DURATION: ${DURATION}s"
    
    if [[ $FAILED_TESTS -gt 0 ]]; then
        echo "- EXIT CODE: 1"
        exit 1
    else
        echo "- EXIT CODE: 0"
        exit 0
    fi
fi