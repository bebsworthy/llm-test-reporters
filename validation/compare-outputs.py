#!/usr/bin/env python3

"""
Compare outputs from different test reporters to ensure format compliance
"""

import sys
import os
import re
import json
import difflib
from pathlib import Path
from typing import Dict, List, Tuple

class OutputComparator:
    def __init__(self):
        self.normalization_rules = [
            # Normalize file paths
            (r'/[^\s]+\.(ts|js|tsx|jsx|py|go|java)', '/path/to/file.ext'),
            # Normalize line numbers
            (r':\d+', ':XX'),
            # Normalize durations
            (r'\d+\.\d+s', 'X.XXs'),
            # Normalize test counts
            (r'\d+ (passed|failed|total)', 'N \\1'),
            # Normalize timestamps
            (r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}', 'YYYY-MM-DDTHH:MM:SS'),
        ]

    def normalize_output(self, content: str) -> str:
        """Normalize output for comparison"""
        normalized = content
        
        for pattern, replacement in self.normalization_rules:
            normalized = re.sub(pattern, replacement, normalized)
        
        # Remove empty lines and extra whitespace
        lines = [line.strip() for line in normalized.split('\n') if line.strip()]
        return '\n'.join(lines)

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

    def compare_files(self, file1: Path, file2: Path) -> Tuple[bool, List[str]]:
        """Compare two output files"""
        with open(file1, 'r') as f:
            content1 = f.read()
        with open(file2, 'r') as f:
            content2 = f.read()
        
        # Normalize both outputs
        norm1 = self.normalize_output(content1)
        norm2 = self.normalize_output(content2)
        
        if norm1 == norm2:
            return True, []
        
        # Generate diff
        diff = list(difflib.unified_diff(
            norm1.splitlines(keepends=True),
            norm2.splitlines(keepends=True),
            fromfile=str(file1.name),
            tofile=str(file2.name),
            lineterm=''
        ))
        
        return False, diff

    def validate_format(self, content: str) -> Tuple[bool, List[str]]:
        """Validate output against format specification"""
        errors = []
        
        # Check header
        if not content.startswith('# LLM TEST REPORTER'):
            errors.append("Missing or invalid header")
        
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
        
        return len(errors) == 0, errors

    def generate_report(self, results: Dict) -> None:
        """Generate comparison report"""
        print("\n" + "="*60)
        print("LLM Test Reporter Output Comparison Report")
        print("="*60)
        
        # Summary
        total_files = len(results['files'])
        valid_files = sum(1 for f in results['files'].values() if f['valid'])
        
        print(f"\nFiles analyzed: {total_files}")
        print(f"Valid formats: {valid_files}")
        print(f"Invalid formats: {total_files - valid_files}")
        
        # Format validation details
        if any(not f['valid'] for f in results['files'].values()):
            print("\n## Format Validation Errors:")
            for filename, file_data in results['files'].items():
                if not file_data['valid']:
                    print(f"\n{filename}:")
                    for error in file_data['errors']:
                        print(f"  - {error}")
        
        # Cross-framework comparison
        if results['comparisons']:
            print("\n## Cross-Framework Comparison:")
            matching = sum(1 for c in results['comparisons'] if c['match'])
            total_comparisons = len(results['comparisons'])
            print(f"Matching outputs: {matching}/{total_comparisons}")
            
            if matching < total_comparisons:
                print("\nDifferences found:")
                for comp in results['comparisons']:
                    if not comp['match']:
                        print(f"\n{comp['file1']} vs {comp['file2']}:")
                        # Show first few lines of diff
                        for line in comp['diff'][:10]:
                            print(f"  {line}")
                        if len(comp['diff']) > 10:
                            print(f"  ... and {len(comp['diff']) - 10} more differences")

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
        'files': {},
        'comparisons': []
    }
    
    # Find all output files
    output_files = list(output_dir.glob('*.txt'))
    
    # Validate each file
    for file_path in output_files:
        with open(file_path, 'r') as f:
            content = f.read()
        
        valid, errors = comparator.validate_format(content)
        results['files'][file_path.name] = {
            'valid': valid,
            'errors': errors,
            'sections': comparator.extract_sections(content)
        }
    
    # Compare files pairwise
    for i, file1 in enumerate(output_files):
        for file2 in output_files[i+1:]:
            match, diff = comparator.compare_files(file1, file2)
            results['comparisons'].append({
                'file1': file1.name,
                'file2': file2.name,
                'match': match,
                'diff': diff
            })
    
    # Generate report
    comparator.generate_report(results)
    
    # Save detailed results
    results_file = output_dir / 'comparison_results.json'
    with open(results_file, 'w') as f:
        # Convert Path objects to strings for JSON serialization
        json_results = {
            'files': results['files'],
            'comparisons': [{
                'file1': c['file1'],
                'file2': c['file2'],
                'match': c['match'],
                'diff_lines': len(c['diff'])
            } for c in results['comparisons']]
        }
        json.dump(json_results, f, indent=2)
    
    print(f"\nDetailed results saved to: {results_file}")
    
    # Exit with error if validation failed
    if not all(f['valid'] for f in results['files'].values()):
        sys.exit(1)
    if not all(c['match'] for c in results['comparisons']):
        sys.exit(1)

if __name__ == '__main__':
    main()