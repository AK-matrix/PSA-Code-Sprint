import docx
import json
import re

def parse_knowledge_base(file_path):
    """
    Parses a structured .docx knowledge base into a list of JSON objects.

    This script assumes the following structure in the .docx file:
    1. Each SOP entry starts with a title line (e.g., "CNTR: ...", "VSL: ...").
    2. Each entry has clear sections marked by "Overview", "Resolution", 
       and "Verification" headers.
    3. The module (CNTR, VSL, EDI/API) is identifiable from the title prefix.
    
    Args:
        file_path (str): The path to the .docx file.

    Returns:
        str: A JSON formatted string of the parsed SOPs.
             Returns an error message if the file cannot be processed.
    """
    try:
        doc = docx.Document(file_path)
        full_text = "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        return json.dumps({"error": f"Failed to read docx file: {e}"}, indent=2)

    # Regex to split the document into SOP entries based on their titles.
    # It looks for module prefixes like CNTR, VSL, API, EDI, etc.
    sop_chunks = re.split(r'\n(CNTR:|VSL:|API:|EDI:|ADI:|EDIE|VAS:)', full_text)
    
    parsed_sops = []
    
    # The first element of the split is usually general text before the first SOP.
    # We iterate over the chunks, combining the delimiter with the content.
    for i in range(1, len(sop_chunks), 2):
        prefix = sop_chunks[i]
        content = sop_chunks[i+1]
        
        # Reconstruct the full text for the current SOP entry
        sop_text = prefix + content
        lines = sop_text.split('\n')
        
        title = lines[0].strip()
        
        # Normalize the module name
        module = "Unknown"
        if prefix.startswith("CNTR") or prefix.startswith("VAS"):
            module = "CNTR"
        elif prefix.startswith("VSL"):
            module = "VSL"
        elif any(prefix.startswith(p) for p in ["API", "EDI", "ADI", "EDIE"]):
            module = "EDI/API"

        # Find the start of each section
        overview_start = sop_text.find("Overview")
        resolution_start = sop_text.find("Resolution")
        verification_start = sop_text.find("Verification")

        # Extract content for each section based on start positions
        overview = ""
        resolution = ""
        verification = ""

        if overview_start != -1 and resolution_start != -1:
            overview = sop_text[overview_start + len("Overview"):resolution_start].strip()
        
        if resolution_start != -1 and verification_start != -1:
            resolution = sop_text[resolution_start + len("Resolution"):verification_start].strip()
        elif resolution_start != -1: # Handle cases where verification might be missing
             resolution = sop_text[resolution_start + len("Resolution"):].strip()

        if verification_start != -1:
            verification = sop_text[verification_start + len("Verification"):].strip()

        if title and (overview or resolution): # Only add if we found a title and some content
            parsed_sops.append({
                "module": module,
                "title": title,
                "overview": overview,
                "resolution": resolution,
                "verification": verification
            })

    return json.dumps(parsed_sops, indent=2)

# --- How to use the script ---

# 1. Make sure you have the python-docx library installed:
#    pip install python-docx

# 2. Save the script above as a Python file (e.g., `parse_kb.py`).

# 3. Place your "Knowledge Base.docx" file in the same directory.

# 4. Run the script:
if __name__ == "__main__":
    import os
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_name = os.path.join(script_dir, "Knowledge Base.docx")
    parsed_data_json = parse_knowledge_base(file_name)
    
    # Print the JSON output to the console
    print(parsed_data_json)
    
    # Optionally, save the output to a file for your RAG system to use
    with open("knowledge_base.json", "w") as f:
        f.write(parsed_data_json)
        
    print(f"\nSuccessfully parsed {len(json.loads(parsed_data_json))} SOPs.")
    print("Output saved to knowledge_base.json")