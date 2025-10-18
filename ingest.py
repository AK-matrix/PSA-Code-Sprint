import json
import os
import chromadb
from sentence_transformers import SentenceTransformer
from chromadb.config import Settings

def ingest_knowledge_base():
    """
    Prepares data from knowledge_base.json and loads it into a ChromaDB vector database.
    This script performs the following actions:
    1. Reads the knowledge_base.json file
    2. Initializes a SentenceTransformer model
    3. Initializes a ChromaDB client and creates a collection
    4. Processes each SOP and stores it with embeddings
    """
    
    print("Starting knowledge base ingestion process...")
    
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    knowledge_base_file = os.path.join(script_dir, "knowledge_base.json")
    
    # Check if knowledge_base.json exists
    if not os.path.exists(knowledge_base_file):
        print(f"Error: {knowledge_base_file} not found. Please run import docx.py first.")
        return
    
    # Read the knowledge base JSON file
    print("Reading knowledge_base.json...")
    try:
        with open(knowledge_base_file, 'r', encoding='utf-8') as f:
            knowledge_data = json.load(f)
        print(f"Successfully loaded {len(knowledge_data)} SOPs from knowledge_base.json")
    except Exception as e:
        print(f"Error reading knowledge_base.json: {e}")
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
        
        # Create or get the collection
        collection_name = "psa_sop_collection"
        try:
            collection = client.get_collection(name=collection_name)
            print(f"Found existing collection: {collection_name}")
        except:
            collection = client.create_collection(
                name=collection_name,
                metadata={"description": "PSA SOP Knowledge Base"}
            )
            print(f"Created new collection: {collection_name}")
            
    except Exception as e:
        print(f"Error initializing ChromaDB: {e}")
        return
    
    # Process each SOP
    print("Processing SOPs and generating embeddings...")
    documents = []
    embeddings = []
    metadatas = []
    ids = []
    
    for i, sop in enumerate(knowledge_data):
        try:
            # Create unique ID
            sop_id = f"sop_{i+1}"
            
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
            ids.append(sop_id)
            
            print(f"Processed SOP {i+1}: {sop.get('title', 'Unknown')} ({sop.get('module', 'Unknown')})")
            
        except Exception as e:
            print(f"Error processing SOP {i+1}: {e}")
            continue
    
    # Add documents to ChromaDB collection
    print(f"Adding {len(documents)} documents to ChromaDB collection...")
    try:
        collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        print(f"Successfully ingested {len(documents)} documents into ChromaDB")
        
        # Verify the collection
        count = collection.count()
        print(f"Collection now contains {count} documents")
        
    except Exception as e:
        print(f"Error adding documents to ChromaDB: {e}")
        return
    
    print("Knowledge base ingestion completed successfully!")
    print(f"Total documents ingested: {len(documents)}")
    print(f"ChromaDB collection: {collection_name}")
    print(f"Database location: {os.path.join(script_dir, 'chroma_db')}")

if __name__ == "__main__":
    ingest_knowledge_base()
