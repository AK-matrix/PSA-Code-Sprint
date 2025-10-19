#!/usr/bin/env python3
"""
Script to fix Unicode characters in test_hybrid_search.py
"""

def fix_unicode_in_test_file():
    """Replace Unicode characters with ASCII alternatives"""
    
    # Read the file
    with open('test_hybrid_search.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace Unicode characters with ASCII alternatives
    replacements = {
        '🚀': '[TEST]',
        '📋': '[INIT]',
        '🔍': '[SEARCH]',
        '🔬': '[DIAGNOSTIC]',
        '🔮': '[PREDICTIVE]',
        '🧠': '[ANALYSIS]',
        '🔄': '[PROCESSING]',
        '✅': '[OK]',
        '❌': '[ERROR]',
        '🎯': '[TARGET]',
        '🧪': '[TEST]',
        '🎉': '[SUCCESS]'
    }
    
    # Apply replacements
    for unicode_char, ascii_replacement in replacements.items():
        content = content.replace(unicode_char, ascii_replacement)
    
    # Write back to file
    with open('test_hybrid_search.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Unicode characters in test file replaced successfully!")

if __name__ == "__main__":
    fix_unicode_in_test_file()
