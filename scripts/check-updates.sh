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

# Check if npm-check-updates is installed
if ! command -v ncu &> /dev/null; then
    echo -e "${YELLOW}Please install npm-check-updates first:${NC}"
    echo "npm install -g npm-check-updates"
    exit 1
fi

# Function to check updates in a directory
check_updates() {
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

# Check all TypeScript packages
echo -e "\n${YELLOW}Checking TypeScript packages...${NC}"
for dir in "$PROJECT_ROOT/typescript"/*; do
    if [ -d "$dir" ]; then
        check_updates "$dir"
    fi
done

# Summary
echo -e "\n${GREEN}======================================"
echo "Check complete!"
echo "======================================${NC}"
echo ""
echo "To update all dependencies, run:"
echo "  ./scripts/update-dependencies.sh"
echo ""
echo "To update a specific package, cd to its directory and run:"
echo "  ncu -u && npm install"