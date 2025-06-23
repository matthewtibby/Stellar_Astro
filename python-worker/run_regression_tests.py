import sys
import os
from datetime import datetime
import re
import subprocess

LOG_PATH = os.path.join(os.path.dirname(__file__), '../docs/calibration-qa-regression-log.md')
BUG_LOG_PATH = os.path.join(os.path.dirname(__file__), '../docs/calibration-bug-issues.md')
TESTS_DIR = os.path.join(os.path.dirname(__file__), 'tests')

class MarkdownLogger:
    def __init__(self, log_path):
        self.log_path = log_path

    def append_row(self, date, tester, test_area, description, automated, result, bug_ref, notes):
        row = f"| {date} | {tester} | {test_area} | {description} | {automated} | {result} | {bug_ref} | {notes} |\n"
        with open(self.log_path, 'a') as f:
            f.write(row)

class BugLogger:
    def __init__(self, bug_log_path):
        self.bug_log_path = bug_log_path

    def append_bug(self, bug_id, date, area, description, severity, status, fix_ref, notes):
        row = f"| {bug_id} | {date} | {area} | {description} | {severity} | {status} | {fix_ref} | {notes} |\n"
        with open(self.bug_log_path, 'a') as f:
            f.write(row)

    def close_bug(self, bug_id, date):
        # Read all lines, update status for matching bug_id
        with open(self.bug_log_path, 'r') as f:
            lines = f.readlines()
        with open(self.bug_log_path, 'w') as f:
            for line in lines:
                if line.startswith(f"| {bug_id} ") and '| Open |' in line:
                    line = line.replace('| Open |', f'| Closed |').rstrip() + f' (Closed {date})|\n'
                f.write(line)

def main():
    # Run all tests in the tests/ directory and capture output
    proc = subprocess.run([
        sys.executable, '-m', 'pytest', TESTS_DIR, '-q', '--tb=short', '-s'
    ], capture_output=True, text=True)
    output = proc.stdout
    exit_code = proc.returncode

    # Parse pytest output for per-test results
    test_results = re.findall(r'([\w_]+\.fits)\s*\n\s*([\w_]+): (PASS|FAIL|SKIP)', output)
    # (Parsing logic can be expanded as needed)

    # Optionally, log results to markdown files (already implemented)
    # ...

    sys.exit(exit_code)

if __name__ == "__main__":
    main() 