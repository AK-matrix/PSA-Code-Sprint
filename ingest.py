import json
import os
import chromadb
from sentence_transformers import SentenceTransformer
from chromadb.config import Settings

def ingest_knowledge_base():
    """
    Prepares data from knowledge_base.json and case_logs.json and loads it into a ChromaDB vector database.
    This script performs the following actions:
    1. Reads the knowledge_base.json file (SOPs)
    2. Reads the case_logs.json file (Case logs)
    3. Initializes a SentenceTransformer model
    4. Initializes a ChromaDB client and creates module-based collections
    5. Processes each SOP and case log and stores them with embeddings in module-specific collections
    """
    
    print("Starting knowledge base ingestion process...")
    
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    knowledge_base_file = os.path.join(script_dir, "knowledge_base.json")
    case_logs_file = os.path.join(script_dir, "case_logs.json")
    
    # Check if knowledge_base.json exists
    if not os.path.exists(knowledge_base_file):
        print(f"Error: {knowledge_base_file} not found. Please run import docx.py first.")
        return
    
    # Check if case_logs.json exists
    if not os.path.exists(case_logs_file):
        print(f"Error: {case_logs_file} not found. Please run parse_case_logs.py first.")
        return
    
    # Read the knowledge base JSON file (SOPs)
    print("Reading knowledge_base.json...")
    try:
        with open(knowledge_base_file, 'r', encoding='utf-8') as f:
            knowledge_data = json.load(f)
        print(f"Successfully loaded {len(knowledge_data)} SOPs from knowledge_base.json")
    except Exception as e:
        print(f"Error reading knowledge_base.json: {e}")
        return
    
    # Read the case logs JSON file
    print("Reading case_logs.json...")
    try:
        with open(case_logs_file, 'r', encoding='utf-8') as f:
            case_logs_data = json.load(f)
        print(f"Successfully loaded {len(case_logs_data)} case logs from case_logs.json")
    except Exception as e:
        print(f"Error reading case_logs.json: {e}")
        return
    
    # Initialize SentenceTransformer model
    print("Initializing SentenceTransformer model (all-MiniLM-L6-v2)...")
    try:
        model = SentenceTransformer('all-MiniLM-L6-v2')
        print("SentenceTransformer model loaded successfully")
    except Exception as e:
        print(f"Error loading SentenceTransformer model: {e}")
        return
    
    # Initialize ChromaDB client
    print("Initializing ChromaDB client...")
    try:
        # Create a persistent client that stores data locally
        client = chromadb.PersistentClient(
            path=os.path.join(script_dir, "chroma_db"),
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Define module-based collections
        modules = ["CNTR", "VSL", "EDI/API", "Infra/SRE", "Container Report", "Container Booking", "IMPORT/EXPORT"]
        collections = {}
        
        # Create or get collections for each module
        for module in modules:
            collection_name = f"psa_{module.lower().replace('/', '_').replace(' ', '_')}_collection"
            try:
                collection = client.get_collection(name=collection_name)
                print(f"Found existing collection: {collection_name}")
            except:
                collection = client.create_collection(
                    name=collection_name,
                    metadata={"description": f"PSA {module} Knowledge Base", "module": module}
                )
                print(f"Created new collection: {collection_name}")
            
            collections[module] = collection
            
    except Exception as e:
        print(f"Error initializing ChromaDB: {e}")
        return
    
    # Process SOPs and Case Logs by module
    print("Processing SOPs and Case Logs by module...")
    
    # Group SOPs by module
    sops_by_module = {}
    for sop in knowledge_data:
        module = sop.get('module', 'Unknown')
        if module not in sops_by_module:
            sops_by_module[module] = []
        sops_by_module[module].append(sop)
    
    # Group Case Logs by module with mapping
    case_logs_by_module = {}
    module_mapping = {
        'Vessel': 'VSL',  # Map Vessel to VSL
        'CNTR': 'CNTR',
        'VSL': 'VSL',
        'EDI/API': 'EDI/API',
        'Infra/SRE': 'Infra/SRE',
        'Container Report': 'Container Report',
        'Container Booking': 'Container Booking',
        'IMPORT/EXPORT': 'IMPORT/EXPORT'
    }
    
    for case_log in case_logs_data:
        original_module = case_log.get('module', 'Unknown')
        mapped_module = module_mapping.get(original_module, original_module)
        if mapped_module not in case_logs_by_module:
            case_logs_by_module[mapped_module] = []
        case_logs_by_module[mapped_module].append(case_log)
    
    # Process each module
    total_documents = 0
    for module in modules:
        print(f"\nProcessing module: {module}")
        
        # Get collection for this module
        if module not in collections:
            print(f"No collection found for module: {module}")
            continue
        
        collection = collections[module]
        documents = []
        embeddings = []
        metadatas = []
        ids = []
        
        # Process SOPs for this module
        if module in sops_by_module:
            print(f"Processing {len(sops_by_module[module])} SOPs for {module}")
            for i, sop in enumerate(sops_by_module[module]):
                try:
                    # Create unique ID
                    doc_id = f"sop_{module}_{i+1}"
                    
                    # Prepare full document content
                    full_content = f"""
Title: {sop.get('title', '')}
Module: {sop.get('module', '')}
Overview: {sop.get('overview', '')}
Resolution: {sop.get('resolution', '')}
Verification: {sop.get('verification', '')}
                    """.strip()
                    
                    # Create metadata
                    metadata = {
                        "doc_type": "SOP",
                        "module": sop.get('module', 'Unknown'),
                        "title": sop.get('title', ''),
                        "overview": sop.get('overview', ''),
                        "resolution": sop.get('resolution', ''),
                        "verification": sop.get('verification', '')
                    }
                    
                    # Generate embedding
                    embedding = model.encode(full_content).tolist()
                    
                    # Add to lists
                    documents.append(full_content)
                    embeddings.append(embedding)
                    metadatas.append(metadata)
                    ids.append(doc_id)
                    
                except Exception as e:
                    print(f"Error processing SOP {i+1} for {module}: {e}")
                    continue
        
        # Process Case Logs for this module
        if module in case_logs_by_module:
            print(f"Processing {len(case_logs_by_module[module])} case logs for {module}")
            for i, case_log in enumerate(case_logs_by_module[module]):
                try:
                    # Create unique ID
                    doc_id = f"case_{module}_{i+1}"
                    
                    # Use the full_content from case log
                    full_content = case_log.get('full_content', '')
                    
                    # Create metadata
                    metadata = {
                        "doc_type": "Case Log",
                        "module": case_log.get('module', 'Unknown'),
                        "case_id": case_log.get('case_id', ''),
                        "mode": case_log.get('mode', ''),
                        "is_edi": case_log.get('is_edi', ''),
                        "timestamp": case_log.get('timestamp', ''),
                        "alert_email": case_log.get('alert_email', ''),
                        "problem_statement": case_log.get('problem_statement', ''),
                        "solution": case_log.get('solution', ''),
                        "sop_reference": case_log.get('sop_reference', '')
                    }
                    
                    # Generate embedding
                    embedding = model.encode(full_content).tolist()
                    
                    # Add to lists
                    documents.append(full_content)
                    embeddings.append(embedding)
                    metadatas.append(metadata)
                    ids.append(doc_id)
                    
                except Exception as e:
                    print(f"Error processing case log {i+1} for {module}: {e}")
                    continue
        
        # Add documents to ChromaDB collection for this module
        if documents:
            print(f"Adding {len(documents)} documents to {module} collection...")
            try:
                collection.add(
                    documents=documents,
                    embeddings=embeddings,
                    metadatas=metadatas,
                    ids=ids
                )
                print(f"Successfully ingested {len(documents)} documents into {module} collection")
                
                # Verify the collection
                count = collection.count()
                print(f"{module} collection now contains {count} documents")
                total_documents += len(documents)
                
            except Exception as e:
                print(f"Error adding documents to {module} collection: {e}")
                continue
        else:
            print(f"No documents to add for {module}")
    
    print(f"\nTotal documents ingested across all modules: {total_documents}")
    
    print("Knowledge base ingestion completed successfully!")
    print(f"Total documents ingested: {total_documents}")
    print(f"ChromaDB collections created for modules: {list(collections.keys())}")
    print(f"Database location: {os.path.join(script_dir, 'chroma_db')}")

if __name__ == "__main__":
    ingest_knowledge_base()
