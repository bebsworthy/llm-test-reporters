#!/bin/bash

# Script to view validation results in a clean format

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="$SCRIPT_DIR/results"

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ $# -eq 0 ]; then
    echo "Usage: $0 <framework> [mode]"
    echo "Examples:"
    echo "  $0 jest                  # Show jest summary"
    echo "  $0 jest detailed         # Show jest detailed"
    echo "  $0 mocha summary         # Show mocha summary"
    echo "Available results:"
    ls -1 "$RESULTS_DIR" | sed 's/typescript_//g' | sed 's/.txt//g' | sort | uniq
    exit 1
fi

FRAMEWORK=$1
MODE=${2:-summary}
FILE="$RESULTS_DIR/typescript_${FRAMEWORK}_${MODE}.txt"

if [ ! -f "$FILE" ]; then
    echo -e "${YELLOW}File not found: $FILE${NC}"
    exit 1
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  $(echo $FRAMEWORK | tr '[:lower:]' '[:upper:]') REPORTER - $(echo $MODE | tr '[:lower:]' '[:upper:]') MODE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

cat "$FILE"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"