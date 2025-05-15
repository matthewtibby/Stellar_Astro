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
    def __init__(self, log_path):
        self.log_path = log_path

    def append_bug(self, bug_id, date, area, description, severity, status, fix_ref, notes):
        row = f"| {bug_id} | {date} | {area} | {description} | {severity} | {status} | {fix_ref} | {notes} |\n"
        with open(self.log_path, 'a') as f:
            f.write(row)

    def close_bug(self, description, close_date):
        # Read all lines
        with open(self.log_path, 'r') as f:
            lines = f.readlines()
        # Find and update the bug row
        new_lines = []
        closed = False
        for line in lines:
            if description in line and '| Open |' in line:
                # Mark as closed
                line = line.replace('| Open |', f'| Closed |').rstrip('\n')
                if '|' in line:
                    line += f' (Closed {close_date})|\n'
                closed = True
            new_lines.append(line)
        if closed:
            with open(self.log_path, 'w') as f:
                f.writelines(new_lines)

def main():
    # Run pytest as a subprocess and capture output
    result = subprocess.run([
        sys.executable, '-m', 'pytest', TESTS_DIR, '--tb=short', '-q'
    ], capture_output=True, text=True)
    output = result.stdout
    exit_code = result.returncode

    logger = MarkdownLogger(LOG_PATH)
    bug_logger = BugLogger(BUG_LOG_PATH)
    date = datetime.now().strftime('%Y-%m-%d')
    tester = os.getenv('USER', 'auto')
    test_area = 'Calibration Regression'
    automated = 'Yes'
    bug_id_counter = int(datetime.now().timestamp())

    # Parse pytest output for per-test results
    test_results = re.findall(r'([\w\./:]+)::([\w_]+)\s+(PASSED|FAILED|SKIPPED)', output)
    for file_path, test_name, result_str in test_results:
        description = f"{test_name} in {os.path.basename(file_path)}"
        bug_ref = ''
        notes = ''
        if result_str == 'FAILED':
            bug_id = f"BUG-{bug_id_counter}"
            bug_id_counter += 1
            bug_ref = bug_id
            notes = 'See bug log.'
            # Log bug details
            bug_logger.append_bug(
                bug_id, date, test_area, description, 'Medium', 'Open', '', 'Auto-logged from regression test.'
            )
        else:
            # If this test previously failed and is now passing, close the bug
            bug_logger.close_bug(description, date)
        logger.append_row(date, tester, test_area, description, automated, result_str, bug_ref, notes)

    # Add a summary row
    summary_result = 'Pass' if exit_code == 0 else 'Fail'
    logger.append_row(date, tester, test_area, 'Golden dataset regression test suite', automated, summary_result, '', 'See pytest output for details.')
    sys.exit(exit_code)

if __name__ == "__main__":
    main() 