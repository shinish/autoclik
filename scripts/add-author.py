#!/usr/bin/env python3
"""
Add author information to all markdown files
Author: Shinish Sasidharan
"""

import os
import glob

AUTHOR_INFO = """

---

## Author

**Shinish Sasidharan**

---

**Autoclik v1.0 - Automation Platform**
"""

def add_author_to_file(filepath):
    """Add author information to a markdown file if not already present"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if author info already exists
        if 'Shinish Sasidharan' in content or '**Author' in content:
            print(f"✓ Skipping {filepath} (author info already present)")
            return False

        # Add author info at the end
        new_content = content.rstrip() + AUTHOR_INFO

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

        print(f"✓ Added author info to {filepath}")
        return True

    except Exception as e:
        print(f"✗ Error processing {filepath}: {e}")
        return False

def main():
    """Main function to process all markdown files"""
    base_path = '/Users/shinish/Documents/projects/Logica/automation-platform'

    # Files to update in root
    root_files = [
        'IMPLEMENTATION_REPORT.md',
        'PLAGIARISM_CHECK.md',
        'SEO_SETTINGS.md'
    ]

    # Process root files
    print("Processing root markdown files...")
    for filename in root_files:
        filepath = os.path.join(base_path, filename)
        if os.path.exists(filepath):
            add_author_to_file(filepath)

    # Process docs folder
    print("\nProcessing docs folder...")
    docs_pattern = os.path.join(base_path, 'docs', '*.md')
    for filepath in glob.glob(docs_pattern):
        add_author_to_file(filepath)

    print("\n✓ Author information added to all markdown files!")

if __name__ == '__main__':
    main()
