#!/bin/bash

echo "============================================================"
echo "PSA SYSTEM SETUP (Linux/macOS)"
echo "============================================================"
echo ""
echo "This script will set up the complete PSA system."
echo "Make sure you have Python 3.8+ installed."
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 not found! Please install Python 3.8+ first."
    exit 1
fi

# Check Python version
python_version=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "[OK] Python $python_version found"
echo ""

# Make the script executable
chmod +x setup.py

# Run the setup script
echo "Starting PSA system setup..."
python3 setup.py

echo ""
echo "Setup completed!"
