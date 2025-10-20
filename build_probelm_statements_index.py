import os
import json
import chromadb
import pandas as pd
from tqdm import tqdm
from sentence_transformers import SentenceTransformer
from chromadb.config import Settings

# --- Config ---
EXCEL_PATH = "/Users/roysougata/PycharmProjects/PSA/Case Log.xlsx"  # update if needed
SHEET_NAME = 0  # or a sheet name string
COL_PROBLEM = "Problem Statements"  # exact column name in your file
# Some typical column names you might have; include what you want to return
META_COLS = [ "TIMESTAMP" , "Solution" , "SOP" , "MODULE" , "Mode" , "EDI?"]

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    client = chromadb.PersistentClient(
        path=os.path.join(script_dir, "chroma_db"),
        settings=Settings(anonymized_telemetry=False)
    )

    collection_name = "psa_problem_statements_collection"
    try:
        collection = client.get_collection(collection_name)
        print(f"Found existing collection: {collection_name}")
    except:
        collection = client.create_collection(
            name=collection_name,
            metadata={"description": "Problem statements only (from Case Log)"}
        )
        print(f"Created collection: {collection_name}")

    print("Loading Excel...")
    df = pd.read_excel(EXCEL_PATH, sheet_name=SHEET_NAME)
    df = df.dropna()

    if COL_PROBLEM not in df.columns:
        raise ValueError(f"Column '{COL_PROBLEM}' not found. Available columns: {list(df.columns)}")

    print("Loading embedding model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    ids, docs, metas, embs = [], [], [], []
    print("Indexing rows...")
    for idx, row in tqdm(df.iterrows(), total=len(df)):
        ps = str(row.get(COL_PROBLEM, "")).strip()
        if not ps:
            continue

        doc_id = f"ps_{idx}"
        ids.append(doc_id)
        docs.append(ps)

        meta = {"row_index": int(idx)}
        for c in META_COLS:
            if c in df.columns:
                # store as string to be safe with JSON
                meta[c] = None if pd.isna(row.get(c)) else str(row.get(c))
        metas.append(meta)

        # Compute embedding
        embs.append(model.encode(ps).tolist())

        # (Optional) batch every 500 for large files
        if len(ids) % 500 == 0:
            collection.add(ids=ids, documents=docs, metadatas=metas, embeddings=embs)
            ids, docs, metas, embs = [], [], [], []

    if ids:
        collection.add(ids=ids, documents=docs, metadatas=metas, embeddings=embs)

    print("✅ Finished building problem statement index.")
    print(f"Collection: {collection_name}")

if __name__ == "__main__":
    main()
