#!/bin/bash
# Add author information to all scripts
# Author: Shinish Sasidharan

SCRIPTS_DIR="/Users/shinish/Documents/projects/Logica/automation-platform/scripts"

# Function to add author to shell scripts
add_author_sh() {
    local file="$1"

    # Check if author already present
    if grep -q "Shinish Sasidharan" "$file" 2>/dev/null; then
        echo "✓ Skipping $file (author already present)"
        return
    fi

    # Get first line (shebang)
    local shebang=$(head -1 "$file")
    local rest=$(tail -n +2 "$file")

    # Create new content with author
    {
        echo "$shebang"
        echo "# Author: Shinish Sasidharan"
        echo "# Autoclik v1.0 - Automation Platform"
        echo "$rest"
    } > "${file}.tmp"

    mv "${file}.tmp" "$file"
    chmod +x "$file"
    echo "✓ Added author to $file"
}

# Function to add author to batch files
add_author_bat() {
    local file="$1"

    # Check if author already present
    if grep -q "Shinish Sasidharan" "$file" 2>/dev/null; then
        echo "✓ Skipping $file (author already present)"
        return
    fi

    # Get first line (@echo off usually)
    local first_line=$(head -1 "$file")
    local rest=$(tail -n +2 "$file")

    # Create new content with author
    {
        echo "$first_line"
        echo "REM Author: Shinish Sasidharan"
        echo "REM Autoclik v1.0 - Automation Platform"
        echo "$rest"
    } > "${file}.tmp"

    mv "${file}.tmp" "$file"
    echo "✓ Added author to $file"
}

# Function to add author to PowerShell files
add_author_ps1() {
    local file="$1"

    # Check if author already present
    if grep -q "Shinish Sasidharan" "$file" 2>/dev/null; then
        echo "✓ Skipping $file (author already present)"
        return
    fi

    # Add author comment at top
    {
        echo "# Author: Shinish Sasidharan"
        echo "# Autoclik v1.0 - Automation Platform"
        echo ""
        cat "$file"
    } > "${file}.tmp"

    mv "${file}.tmp" "$file"
    echo "✓ Added author to $file"
}

echo "Processing shell scripts..."
for file in "$SCRIPTS_DIR"/*.sh; do
    if [ -f "$file" ] && [ "$(basename "$file")" != "add-author-scripts.sh" ]; then
        add_author_sh "$file"
    fi
done

echo ""
echo "Processing batch files..."
for file in "$SCRIPTS_DIR"/*.bat; do
    if [ -f "$file" ]; then
        add_author_bat "$file"
    fi
done

echo ""
echo "Processing PowerShell files..."
for file in "$SCRIPTS_DIR"/*.ps1; do
    if [ -f "$file" ]; then
        add_author_ps1 "$file"
    fi
done

echo ""
echo "✓ All scripts updated with author information!"
