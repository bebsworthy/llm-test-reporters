#!/bin/bash

# Script to update all dependencies to latest versions across all packages

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "Dependency Update Script"
echo "======================================"

# Find script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Function to update dependencies in a directory
update_dependencies() {
    local dir=$1
    local name=$(basename "$dir")
    
    if [ ! -f "$dir/package.json" ]; then
        return
    fi
    
    echo -e "\n${BLUE}Updating dependencies in: ${name}${NC}"
    echo "Path: $dir"
    
    cd "$dir"
    
    # Check if npm-check-updates is installed globally
    if ! command -v ncu &> /dev/null; then
        echo -e "${YELLOW}Installing npm-check-updates globally...${NC}"
        npm install -g npm-check-updates
    fi
    
    # Show current vs latest versions
    echo -e "\n${YELLOW}Checking for updates...${NC}"
    ncu
    
    # Update package.json with latest versions
    echo -e "\n${YELLOW}Updating package.json...${NC}"
    ncu -u
    
    # Remove node_modules and package-lock.json for clean install
    echo -e "\n${YELLOW}Cleaning old dependencies...${NC}"
    rm -rf node_modules package-lock.json
    
    # Install updated dependencies
    echo -e "\n${YELLOW}Installing updated dependencies...${NC}"
    npm install
    
    echo -e "${GREEN}✓ Updated ${name}${NC}"
}

# Function to find all directories with package.json
find_and_update_packages() {
    local search_dir=$1
    local depth=$2
    
    find "$search_dir" -maxdepth "$depth" -name "package.json" -type f | while read -r package_file; do
        local dir=$(dirname "$package_file")
        update_dependencies "$dir"
    done
}

echo -e "\n${YELLOW}Starting dependency updates...${NC}"

# Update root package.json if it exists
if [ -f "$PROJECT_ROOT/package.json" ]; then
    update_dependencies "$PROJECT_ROOT"
fi

# Update TypeScript packages
echo -e "\n${BLUE}=== Updating TypeScript packages ===${NC}"
find_and_update_packages "$PROJECT_ROOT/typescript" 2

# Function to update Python dependencies
update_python_dependencies() {
    local dir=$1
    local name=$(basename "$dir")
    
    echo -e "\n${BLUE}Updating Python dependencies in: ${name}${NC}"
    echo "Path: $dir"
    
    cd "$dir"
    
    # Activate virtual environment if available
    if [ -z "$VIRTUAL_ENV" ] && [ -d "$PROJECT_ROOT/python/.venv" ]; then
        source "$PROJECT_ROOT/python/.venv/bin/activate"
    fi
    
    # Update based on project type
    if [ -f "requirements.txt" ]; then
        echo -e "\n${YELLOW}Updating requirements.txt dependencies...${NC}"
        
        # Create a backup
        cp requirements.txt requirements.txt.bak
        
        # Update all packages
        pip list --format=freeze | grep -v "^-e" | cut -d'=' -f1 | xargs -n1 pip install -U
        
        # Regenerate requirements.txt
        pip freeze > requirements.txt
        
        echo -e "${GREEN}✓ Updated requirements.txt${NC}"
    fi
    
    if [ -f "setup.py" ] || [ -f "pyproject.toml" ]; then
        echo -e "\n${YELLOW}Updating package dependencies...${NC}"
        pip install -e . --upgrade
        echo -e "${GREEN}✓ Updated package${NC}"
    fi
}

# Update Python packages if they exist
if [ -d "$PROJECT_ROOT/python" ]; then
    echo -e "\n${BLUE}=== Updating Python packages ===${NC}"
    
    # Check if we're in a virtual environment
    if [ -z "$VIRTUAL_ENV" ] && [ -d "$PROJECT_ROOT/python/.venv" ]; then
        echo -e "${YELLOW}Activating Python virtual environment...${NC}"
        source "$PROJECT_ROOT/python/.venv/bin/activate"
    fi
    
    for dir in "$PROJECT_ROOT/python"/*; do
        if [ -d "$dir" ] && [ -f "$dir/requirements.txt" -o -f "$dir/setup.py" -o -f "$dir/pyproject.toml" ]; then
            update_python_dependencies "$dir"
        fi
    done
fi

# Function to update Go dependencies
update_go_dependencies() {
    local dir=$1
    local name=$(basename "$dir")
    
    echo -e "\n${BLUE}Updating Go modules in: ${name}${NC}"
    echo "Path: $dir"
    
    cd "$dir"
    
    # Update all dependencies
    echo -e "\n${YELLOW}Updating Go modules...${NC}"
    go get -u ./...
    
    # Clean up
    echo -e "\n${YELLOW}Tidying Go modules...${NC}"
    go mod tidy
    
    # Download dependencies
    echo -e "\n${YELLOW}Downloading dependencies...${NC}"
    go mod download
    
    echo -e "${GREEN}✓ Updated ${name}${NC}"
}

# Update Go packages if they exist
if [ -d "$PROJECT_ROOT/go" ]; then
    echo -e "\n${BLUE}=== Updating Go packages ===${NC}"
    
    # Check if go is installed
    if ! command -v go &> /dev/null; then
        echo -e "${RED}Go not found, skipping Go packages${NC}"
    else
        for dir in "$PROJECT_ROOT/go"/*; do
            if [ -d "$dir" ] && [ -f "$dir/go.mod" ]; then
                update_go_dependencies "$dir"
            fi
        done
    fi
fi

# Update Java packages if they exist
if [ -d "$PROJECT_ROOT/java" ]; then
    echo -e "\n${BLUE}=== Updating Java packages ===${NC}"
    find "$PROJECT_ROOT/java" -name "pom.xml" | while read -r file; do
        dir=$(dirname "$file")
        echo -e "\n${YELLOW}Found Maven project in: $dir${NC}"
        # Add Maven update logic here if needed
    done
fi

# Run build to ensure everything still works
echo -e "\n${BLUE}=== Running builds to verify updates ===${NC}"

# Build TypeScript packages
echo -e "\n${YELLOW}Building TypeScript packages...${NC}"
for dir in "$PROJECT_ROOT/typescript"/*; do
    if [ -d "$dir" ] && [ -f "$dir/package.json" ] && [ -f "$dir/tsconfig.json" ]; then
        name=$(basename "$dir")
        echo -e "\n${YELLOW}Building ${name}...${NC}"
        cd "$dir"
        if npm run build 2>/dev/null; then
            echo -e "${GREEN}✓ Build successful${NC}"
        else
            echo -e "${RED}✗ Build failed - you may need to fix compatibility issues${NC}"
        fi
    fi
done

# Test Python packages
if [ -d "$PROJECT_ROOT/python" ]; then
    echo -e "\n${YELLOW}Testing Python packages...${NC}"
    for dir in "$PROJECT_ROOT/python"/*; do
        if [ -d "$dir" ] && [ -f "$dir/setup.py" -o -f "$dir/pyproject.toml" ]; then
            name=$(basename "$dir")
            echo -e "\n${YELLOW}Testing ${name}...${NC}"
            cd "$dir"
            
            # Try to run tests
            if [ -f "setup.py" ] && grep -q "test" setup.py; then
                if python setup.py test 2>/dev/null; then
                    echo -e "${GREEN}✓ Tests passed${NC}"
                else
                    echo -e "${YELLOW}⚠ Some tests may have failed${NC}"
                fi
            elif [ -d "tests" ]; then
                if python -m pytest tests 2>/dev/null || python -m unittest discover tests 2>/dev/null; then
                    echo -e "${GREEN}✓ Tests passed${NC}"
                else
                    echo -e "${YELLOW}⚠ Some tests may have failed${NC}"
                fi
            fi
        fi
    done
fi

# Build Go packages
if [ -d "$PROJECT_ROOT/go" ] && command -v go &> /dev/null; then
    echo -e "\n${YELLOW}Building Go packages...${NC}"
    for dir in "$PROJECT_ROOT/go"/*; do
        if [ -d "$dir" ] && [ -f "$dir/go.mod" ]; then
            name=$(basename "$dir")
            echo -e "\n${YELLOW}Building ${name}...${NC}"
            cd "$dir"
            if go build ./... 2>/dev/null; then
                echo -e "${GREEN}✓ Build successful${NC}"
            else
                echo -e "${RED}✗ Build failed - you may need to fix compatibility issues${NC}"
            fi
        fi
    done
fi

# Run validation
echo -e "\n${BLUE}=== Running validation ===${NC}"
if [ -f "$PROJECT_ROOT/validation/run-all.sh" ]; then
    cd "$PROJECT_ROOT"
    if ./validation/run-all.sh > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Validation passed${NC}"
    else
        echo -e "${YELLOW}⚠ Validation had some issues - check the output${NC}"
    fi
fi

echo -e "\n${GREEN}======================================"
echo "Dependency update complete!"
echo "======================================${NC}"
echo ""
echo "Next steps:"
echo "1. Review the changes with: git diff"
echo "2. Test thoroughly"
echo "3. Commit the updates"
echo ""
echo "To see what was updated, check the git diff for package.json files"