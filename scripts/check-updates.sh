#!/bin/bash

# Script to check for available dependency updates without installing them

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "Dependency Update Check"
echo "======================================"

# Find script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Track if any tools are missing
MISSING_TOOLS=""

# Check for required tools
check_tool() {
    local tool=$1
    local install_cmd=$2
    if ! command -v "$tool" &> /dev/null; then
        MISSING_TOOLS="${MISSING_TOOLS}\n  $tool: $install_cmd"
        return 1
    fi
    return 0
}

# Check all required tools
check_tool "ncu" "npm install -g npm-check-updates"

# Function to check Node.js updates
check_node_updates() {
    local dir=$1
    local name=$(basename "$dir")
    
    if [ ! -f "$dir/package.json" ]; then
        return
    fi
    
    echo -e "\n${BLUE}=== ${name} ===${NC}"
    echo "Path: $dir"
    
    cd "$dir"
    
    # Check for updates without modifying anything
    if ncu | grep -E "^\s*\S+\s+\S+\s+→\s+\S+"; then
        echo -e "${YELLOW}Updates available${NC}"
    else
        echo -e "${GREEN}All dependencies are up to date${NC}"
    fi
}

# Function to check Python updates
check_python_updates() {
    local dir=$1
    local name=$(basename "$dir")
    
    echo -e "\n${BLUE}=== ${name} ===${NC}"
    echo "Path: $dir"
    
    cd "$dir"
    
    # Check if pip is available
    if ! command -v pip &> /dev/null; then
        echo -e "${YELLOW}pip not found, skipping Python updates check${NC}"
        return
    fi
    
    # Check for outdated packages
    echo "Checking for outdated Python packages..."
    local outdated=$(pip list --outdated 2>/dev/null | grep -v "^Package" | grep -v "^---" | grep -v "^\[notice\]")
    
    if [ -n "$outdated" ]; then
        echo -e "${YELLOW}Updates available:${NC}"
        echo "$outdated"
    else
        echo -e "${GREEN}All dependencies are up to date${NC}"
    fi
}

# Function to check Go updates
check_go_updates() {
    local dir=$1
    local name=$(basename "$dir")
    
    echo -e "\n${BLUE}=== ${name} ===${NC}"
    echo "Path: $dir"
    
    cd "$dir"
    
    # Check for outdated modules
    echo "Checking for outdated Go modules..."
    if go list -u -m all 2>/dev/null | grep "\["; then
        echo -e "${YELLOW}Updates available${NC}"
    else
        echo -e "${GREEN}All dependencies are up to date${NC}"
    fi
}

# Check all TypeScript packages
echo -e "\n${YELLOW}Checking TypeScript packages...${NC}"
for dir in "$PROJECT_ROOT/typescript"/*; do
    if [ -d "$dir" ]; then
        check_node_updates "$dir"
    fi
done

# Check Python packages
if [ -d "$PROJECT_ROOT/python" ]; then
    echo -e "\n${YELLOW}Checking Python packages...${NC}"
    
    # Check if we're in a virtual environment
    if [ -z "$VIRTUAL_ENV" ] && [ -d "$PROJECT_ROOT/python/.venv" ]; then
        echo -e "${YELLOW}Activating Python virtual environment...${NC}"
        source "$PROJECT_ROOT/python/.venv/bin/activate"
    fi
    
    for dir in "$PROJECT_ROOT/python"/*; do
        if [ -d "$dir" ] && [ -f "$dir/requirements.txt" -o -f "$dir/setup.py" -o -f "$dir/pyproject.toml" ]; then
            check_python_updates "$dir"
        fi
    done
fi

# Check Go packages
if [ -d "$PROJECT_ROOT/go" ]; then
    echo -e "\n${YELLOW}Checking Go packages...${NC}"
    
    # Check if go is installed
    if ! command -v go &> /dev/null; then
        echo -e "${YELLOW}Go not found, skipping Go packages${NC}"
    else
        for dir in "$PROJECT_ROOT/go"/*; do
            if [ -d "$dir" ] && [ -f "$dir/go.mod" ]; then
                check_go_updates "$dir"
            fi
        done
    fi
fi

# Display missing tools if any
if [ -n "$MISSING_TOOLS" ]; then
    echo -e "\n${YELLOW}Missing tools detected:${NC}"
    echo -e "$MISSING_TOOLS"
fi

# Summary
echo -e "\n${GREEN}======================================"
echo "Check complete!"
echo "======================================${NC}"
echo ""
echo "To update all dependencies, run:"
echo "  ./scripts/update-dependencies.sh"
echo ""
echo "Language-specific update commands:"
echo "  Node.js: ncu -u && npm install"
echo "  Python: pip install --upgrade <package>"
echo "  Go: go get -u ./... && go mod tidy"