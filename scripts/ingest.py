import json
import logging
import os
from pathlib import Path

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Paths are relative to the project root (one level up from scripts/)
_PROJECT_ROOT = Path(__file__).parent.parent
_DATA_DIR = _PROJECT_ROOT / "data"
_CHROMA_DIR = _PROJECT_ROOT / "chroma_db"


def ingest_knowledge_base():
    """Embed SOPs and case logs from data/ into the ChromaDB vector store at chroma_db/."""
    logger.info("Starting knowledge base ingestion")

    knowledge_base_file = _DATA_DIR / "knowledge_base.json"
    case_logs_file = _DATA_DIR / "case_logs.json"
    
    # Check if knowledge_base.json exists
    if not os.path.exists(knowledge_base_file):
        print(f"Error: {knowledge_base_file} not found. Please run import docx.py first.")
        return
    
    if not case_logs_file.exists():
        logger.error("%s not found — run scripts/parse_case_logs.py first", case_logs_file)
        return

    try:
        knowledge_data = json.loads(knowledge_base_file.read_text(encoding="utf-8"))
        logger.info("Loaded %d SOPs", len(knowledge_data))
    except Exception:
        logger.exception("Failed to read knowledge_base.json")
        return

    try:
        case_logs_data = json.loads(case_logs_file.read_text(encoding="utf-8"))
        logger.info("Loaded %d case logs", len(case_logs_data))
    except Exception:
        logger.exception("Failed to read case_logs.json")
        return

    logger.info("Loading SentenceTransformer model…")
    try:
        model = SentenceTransformer("all-MiniLM-L6-v2")
    except Exception:
        logger.exception("Failed to load SentenceTransformer")
        return

    logger.info("Initialising ChromaDB at %s", _CHROMA_DIR)
    try:
        client = chromadb.PersistentClient(
            path=str(_CHROMA_DIR),
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
            
    except Exception:
        logger.exception("Failed to initialise ChromaDB")
        return

    logger.info("Processing SOPs and Case Logs by module…")
    
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
    
    total_documents = 0
    for module in modules:
        logger.info("Processing module: %s", module)
        if module not in collections:
            continue

        collection = collections[module]
        documents, embeddings, metadatas, ids = [], [], [], []

        for i, sop in enumerate(sops_by_module.get(module, [])):
            try:
                full_content = (
                    f"Title: {sop.get('title', '')}\n"
                    f"Module: {sop.get('module', '')}\n"
                    f"Overview: {sop.get('overview', '')}\n"
                    f"Resolution: {sop.get('resolution', '')}\n"
                    f"Verification: {sop.get('verification', '')}"
                )
                documents.append(full_content)
                embeddings.append(model.encode(full_content).tolist())
                metadatas.append({"doc_type": "SOP", **{k: sop.get(k, "") for k in ("module", "title", "overview", "resolution", "verification")}})
                ids.append(f"sop_{module}_{i+1}")
            except Exception:
                logger.warning("Failed to process SOP %d for %s", i + 1, module)

        for i, case_log in enumerate(case_logs_by_module.get(module, [])):
            try:
                full_content = case_log.get("full_content", "")
                documents.append(full_content)
                embeddings.append(model.encode(full_content).tolist())
                metadatas.append({"doc_type": "Case Log", **{k: case_log.get(k, "") for k in ("module", "case_id", "mode", "is_edi", "timestamp", "alert_email", "problem_statement", "solution", "sop_reference")}})
                ids.append(f"case_{module}_{i+1}")
            except Exception:
                logger.warning("Failed to process case log %d for %s", i + 1, module)

        if documents:
            try:
                collection.add(documents=documents, embeddings=embeddings, metadatas=metadatas, ids=ids)
                total_documents += len(documents)
                logger.info("%s: ingested %d docs (total in collection: %d)", module, len(documents), collection.count())
            except Exception:
                logger.exception("Failed to add documents to %s collection", module)

    logger.info("Ingestion complete — %d total documents across %d modules", total_documents, len(modules))

if __name__ == "__main__":
    ingest_knowledge_base()
