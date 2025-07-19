#!/bin/bash

# Cross-language validation runner for LLM test reporters
# Runs all reporters with test suite and validates format compliance

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VALIDATION_SUITE="$PROJECT_ROOT/shared/validation-suite"
RESULTS_DIR="$SCRIPT_DIR/results"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "LLM Test Reporter Validation Suite"
echo "======================================"

# Clean and create results directory
echo -e "\n${YELLOW}Cleaning previous results...${NC}"
rm -rf "$RESULTS_DIR"
mkdir -p "$RESULTS_DIR"
echo -e "${GREEN}✓ Results directory cleaned${NC}"

# Function to run a reporter and capture output
run_reporter() {
    local lang=$1
    local framework=$2
    local reporter_path=$3
    local mode=$4
    local output_file="$RESULTS_DIR/${lang}_${framework}_${mode}.txt"
    
    echo -e "\n${YELLOW}Testing ${lang}/${framework} reporter in ${mode} mode...${NC}"
    
    # Framework-specific test commands
    case "$framework" in
        "jest")
            cd "$reporter_path" && npm run build && LLM_REPORTER_MODE=$mode npm run test:example 2>&1 | tail -n +3 > "$output_file" || true
            ;;
        "vitest")
            cd "$reporter_path" && npm run build && LLM_REPORTER_MODE=$mode npm run test:example 2>&1 | tail -n +3 > "$output_file" || true
            ;;
        "mocha")
            cd "$reporter_path" && npm test -- --reporter=./src/index.js > "$output_file" 2>&1 || true
            ;;
        "playwright")
            cd "$reporter_path" && npm test -- --reporter=./src/index.js > "$output_file" 2>&1 || true
            ;;
        "cypress")
            cd "$reporter_path" && npm test > "$output_file" 2>&1 || true
            ;;
        "pytest")
            cd "$reporter_path" && python -m pytest --tb=short -v > "$output_file" 2>&1 || true
            ;;
        "unittest")
            cd "$reporter_path" && python -m unittest discover > "$output_file" 2>&1 || true
            ;;
        "behave")
            cd "$reporter_path" && behave > "$output_file" 2>&1 || true
            ;;
        "testing")
            cd "$reporter_path" && go test -v ./... > "$output_file" 2>&1 || true
            ;;
        "testify")
            cd "$reporter_path" && go test -v ./... > "$output_file" 2>&1 || true
            ;;
        "junit")
            cd "$reporter_path" && mvn test > "$output_file" 2>&1 || true
            ;;
        "testng")
            cd "$reporter_path" && mvn test > "$output_file" 2>&1 || true
            ;;
        *)
            echo -e "${RED}Unknown framework: $framework${NC}"
            return 1
            ;;
    esac
    
    echo -e "${GREEN}✓ Output saved to $output_file${NC}"
}

# Function to validate reporter output
validate_output() {
    local output_file=$1
    local framework=$2
    
    # Check if file exists and has content
    if [ ! -s "$output_file" ]; then
        echo -e "${RED}✗ No output generated${NC}"
        return 1
    fi
    
    # Basic format validations
    if ! grep -q "# LLM TEST REPORTER" "$output_file"; then
        echo -e "${RED}✗ Missing reporter header${NC}"
        return 1
    fi
    
    if ! grep -q "## SUMMARY" "$output_file"; then
        echo -e "${RED}✗ Missing SUMMARY section${NC}"
        return 1
    fi
    
    # Check for ANSI codes (using grep -E for compatibility)
    if grep -E $'\x1b\\[[0-9;]*m' "$output_file" > /dev/null; then
        echo -e "${RED}✗ Output contains ANSI color codes${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ Basic format validation passed${NC}"
    return 0
}

# Run all TypeScript reporters
echo -e "\n${YELLOW}Running TypeScript reporters...${NC}"
for framework in jest vitest mocha playwright cypress; do
    reporter_path="$PROJECT_ROOT/typescript/${framework}-reporter"
    if [ -d "$reporter_path" ]; then
        # Test both summary and detailed modes
        for mode in summary detailed; do
            run_reporter "typescript" "$framework" "$reporter_path" "$mode"
            validate_output "$RESULTS_DIR/typescript_${framework}_${mode}.txt" "$framework"
        done
    else
        echo -e "${YELLOW}Skipping $framework (not implemented yet)${NC}"
    fi
done

# Run all Python reporters
echo -e "\n${YELLOW}Running Python reporters...${NC}"
for framework in pytest unittest behave; do
    reporter_path="$PROJECT_ROOT/python/${framework}-reporter"
    if [ -d "$reporter_path" ]; then
        run_reporter "python" "$framework" "$reporter_path"
        validate_output "$RESULTS_DIR/python_${framework}.txt" "$framework"
    else
        echo -e "${YELLOW}Skipping $framework (not implemented yet)${NC}"
    fi
done

# Run all Go reporters
echo -e "\n${YELLOW}Running Go reporters...${NC}"
for framework in testing testify; do
    reporter_path="$PROJECT_ROOT/go/${framework}-reporter"
    if [ -d "$reporter_path" ]; then
        run_reporter "go" "$framework" "$reporter_path"
        validate_output "$RESULTS_DIR/go_${framework}.txt" "$framework"
    else
        echo -e "${YELLOW}Skipping $framework (not implemented yet)${NC}"
    fi
done

# Run all Java reporters
echo -e "\n${YELLOW}Running Java reporters...${NC}"
for framework in junit testng; do
    reporter_path="$PROJECT_ROOT/java/${framework}-reporter"
    if [ -d "$reporter_path" ]; then
        run_reporter "java" "$framework" "$reporter_path"
        validate_output "$RESULTS_DIR/java_${framework}.txt" "$framework"
    else
        echo -e "${YELLOW}Skipping $framework (not implemented yet)${NC}"
    fi
done

# Compare outputs
echo -e "\n${YELLOW}Running cross-framework comparison...${NC}"
if [ -f "$VALIDATION_SUITE/validate-reporter.js" ]; then
    node "$VALIDATION_SUITE/validate-reporter.js" compare "$RESULTS_DIR"/*.txt
else
    echo -e "${YELLOW}Skipping comparison (validate-reporter.js not found)${NC}"
fi

echo -e "\n======================================"
echo "Validation Complete"
echo "Results saved in: $RESULTS_DIR"
echo "======================================\n"