#!/usr/bin/env python3
"""
Script to fix Unicode characters in langgraph_workflow.py
"""

import re

def fix_unicode_in_file():
    """Replace Unicode characters with ASCII alternatives"""
    
    # Read the file
    with open('langgraph_workflow.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace Unicode characters with ASCII alternatives
    replacements = {
        '✅': '[OK]',
        '❌': '[ERROR]',
        '🔍': '[SEARCH]',
        '🔬': '[DIAGNOSTIC]',
        '🔮': '[PREDICTIVE]',
        '⚠️': '[WARNING]',
        '🔄': '[PROCESSING]'
    }
    
    # Apply replacements
    for unicode_char, ascii_replacement in replacements.items():
        content = content.replace(unicode_char, ascii_replacement)
    
    # Write back to file
    with open('langgraph_workflow.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Unicode characters replaced successfully!")

if __name__ == "__main__":
    fix_unicode_in_file()
