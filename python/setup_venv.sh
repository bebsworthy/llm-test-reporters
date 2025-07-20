#!/bin/bash

# Setup Python virtual environment for LLM reporters

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"

echo "Setting up Python virtual environment..."

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment at $VENV_DIR"
    python3 -m venv "$VENV_DIR"
else
    echo "Virtual environment already exists at $VENV_DIR"
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing requirements..."
pip install -r "$SCRIPT_DIR/requirements.txt"

# Install shared package first
echo "Installing shared utilities..."
cd "$SCRIPT_DIR/llm_reporter_shared" && pip install -e .

# Install reporters in development mode
echo "Installing pytest reporter..."
cd "$SCRIPT_DIR/pytest-reporter" && pip install -e .

echo "Installing unittest reporter..."
cd "$SCRIPT_DIR/unittest-reporter" && pip install -e .

echo ""
echo "Setup complete! Virtual environment is ready at: $VENV_DIR"
echo "To activate it manually, run: source $VENV_DIR/bin/activate"