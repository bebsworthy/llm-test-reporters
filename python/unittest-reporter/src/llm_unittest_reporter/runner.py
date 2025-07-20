"""Command line runner for unittest with LLM reporter."""

import sys
import os
from pathlib import Path

# Add parent directories to path to import reporter
sys.path.insert(0, str(Path(__file__).parent))

from reporter import main

if __name__ == '__main__':
    main()