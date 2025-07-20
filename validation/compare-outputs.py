#!/usr/bin/env python3

"""
Validate test reporter outputs against the LLM-optimized format specification
"""

import sys
import os
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple

# Force unbuffered output
sys.stdout = os.fdopen(sys.stdout.fileno(), 'w', buffering=1)
sys.stderr = os.fdopen(sys.stderr.fileno(), 'w', buffering=1)

# Configuration constants
MAX_LINES_BEFORE_HEADER = 5  # Maximum allowed lines before the LLM TEST REPORTER header
MAX_LINES_AFTER_EXIT = 4     # Maximum allowed lines after the EXIT CODE line

class OutputComparator:
    def __init__(self):
        pass

    def extract_sections(self, content: str) -> Dict[str, str]:
        """Extract major sections from reporter output"""
        sections = {}
        current_section = 'header'
        section_content = []
        
        for line in content.split('\n'):
            if line.startswith('# LLM TEST REPORTER'):
                sections[current_section] = '\n'.join(section_content)
                current_section = 'header'
                section_content = [line]
            elif line.startswith('## '):
                sections[current_section] = '\n'.join(section_content)
                current_section = line[3:].lower().replace(' ', '_')
                section_content = [line]
            elif line.startswith('SUITE:'):
                if current_section != 'suites':
                    sections[current_section] = '\n'.join(section_content)
                    current_section = 'suites'
                    section_content = []
                section_content.append(line)
            else:
                section_content.append(line)
        
        sections[current_section] = '\n'.join(section_content)
        return sections

    def validate_format(self, content: str) -> Tuple[bool, List[str], List[str]]:
        """Validate output against format specification"""
        errors = []
        warnings = []
        
        lines = content.split('\n')
        
        # Count lines before reporter output
        header_index = -1
        for i, line in enumerate(lines):
            if line.startswith('# LLM TEST REPORTER'):
                header_index = i
                break
        
        if header_index == -1:
            errors.append("Missing or invalid header")
        else:
            lines_before = header_index
            if lines_before > MAX_LINES_BEFORE_HEADER:
                warnings.append(f"Excessive output before reporter: {lines_before} lines (threshold: {MAX_LINES_BEFORE_HEADER})")
        
        # Count lines after EXIT CODE
        exit_index = -1
        for i, line in enumerate(lines):
            if 'EXIT CODE:' in line:
                exit_index = i
                break
        
        if exit_index != -1:
            lines_after = len(lines) - exit_index - 1
            # Filter out empty lines at the end
            while lines_after > 0 and not lines[exit_index + lines_after].strip():
                lines_after -= 1
            
            if lines_after > MAX_LINES_AFTER_EXIT:
                warnings.append(f"Excessive output after reporter: {lines_after} lines (threshold: {MAX_LINES_AFTER_EXIT})")
        
        # Original validations
        # Check for required sections
        if '## SUMMARY' not in content:
            errors.append("Missing SUMMARY section")
        
        # Check for ANSI codes
        ansi_pattern = re.compile(r'\x1b\[[0-9;]*m')
        if ansi_pattern.search(content):
            errors.append("Output contains ANSI color codes")
        
        # Check exit code
        if not re.search(r'EXIT CODE: [01]', content):
            errors.append("Missing or invalid EXIT CODE")
        
        # Validate file paths include line numbers
        file_refs = re.findall(r'FILE: ([^\n]+)', content)
        for ref in file_refs:
            if not re.search(r':\d+$', ref.strip()):
                errors.append(f"File reference missing line number: {ref}")
        
        return len(errors) == 0, errors, warnings

    def generate_report(self, results: Dict) -> None:
        """Generate format validation report"""
        print("\n" + "="*60)
        print("LLM Test Reporter Format Validation Report")
        print("="*60)
        sys.stdout.flush()
        
        # Summary
        total_files = len(results['files'])
        valid_files = sum(1 for f in results['files'].values() if f['valid'])
        
        print(f"\nFiles analyzed: {total_files}")
        print(f"Valid formats: {valid_files}")
        print(f"Invalid formats: {total_files - valid_files}")
        sys.stdout.flush()
        
        # Format validation details
        if any(not f['valid'] for f in results['files'].values()):
            print("\n## Format Validation Errors:")
            for filename, file_data in results['files'].items():
                if not file_data['valid']:
                    print(f"\n{filename}:")
                    for error in file_data['errors']:
                        print(f"  - {error}")
        
        # Format validation warnings
        if any(f['warnings'] for f in results['files'].values()):
            print("\n## Format Validation Warnings:")
            for filename, file_data in results['files'].items():
                if file_data['warnings']:
                    print(f"\n{filename}:")
                    for warning in file_data['warnings']:
                        print(f"  - {warning}")
        
        # Success message
        if valid_files == total_files:
            print("\n✓ All files pass format validation!")
        else:
            print(f"\n✗ {total_files - valid_files} file(s) failed format validation")
        
        sys.stdout.flush()

def main():
    if len(sys.argv) < 2:
        print("Usage: compare-outputs.py <output_dir>")
        sys.exit(1)
    
    output_dir = Path(sys.argv[1])
    if not output_dir.exists():
        print(f"Error: Directory {output_dir} does not exist")
        sys.exit(1)
    
    comparator = OutputComparator()
    results = {
        'files': {}
    }
    
    # Find all output files
    output_files = list(output_dir.glob('*.txt'))
    
    # Validate each file
    for file_path in output_files:
        with open(file_path, 'r') as f:
            content = f.read()
        
        valid, errors, warnings = comparator.validate_format(content)
        results['files'][file_path.name] = {
            'valid': valid,
            'errors': errors,
            'warnings': warnings,
            'sections': comparator.extract_sections(content)
        }
    
    # Removed pairwise comparison - we only validate against the format specification
    
    # Generate report
    comparator.generate_report(results)
    
    # Save detailed results
    results_file = output_dir / 'validation_results.json'
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nDetailed results saved to: {results_file}")
    sys.stdout.flush()
    
    # Exit with error if validation failed
    if not all(f['valid'] for f in results['files'].values()):
        sys.exit(1)

if __name__ == '__main__':
    main()