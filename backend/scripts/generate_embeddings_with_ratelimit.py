# scripts/generate_embeddings_with_ratelimit.py
"""
Generate embeddings with proper rate limiting (non-batch)
"""

import json
import os
import sys
import time
import numpy as np
from datetime import datetime
from dotenv import load_dotenv
from google import genai

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services import snowflake_service

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
OUTPUT_DIM = 768
CACHE_FILE = "grant_embeddings.npy"
META_FILE = "grant_metadata.json"

BATCH_SIZE = 10
DELAY_BETWEEN_BATCHES = 2.0


def _normalize(v: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(v)
    return v / norm if norm != 0 else v


def generate_embeddings():
    print("="*70)
    print("EMBEDDING GENERATION (WITH RATE LIMITING)")
    print("="*70)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    print("Fetching grants from Snowflake...")
    conn = snowflake_service.get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT program_name, description, eligibility 
        FROM FUND_DB.PUBLIC.GRANTS 
        WHERE description IS NOT NULL
    """)
    grants = cur.fetchall()
    cur.close()
    conn.close()
    
    print(f"Found {len(grants)} grants to process\n")
    
    all_embeddings = []
    metadata = []
    
    total_batches = (len(grants) + BATCH_SIZE - 1) // BATCH_SIZE
    
    for batch_idx in range(0, len(grants), BATCH_SIZE):
        batch = grants[batch_idx:batch_idx + BATCH_SIZE]
        batch_num = batch_idx // BATCH_SIZE + 1
        
        print(f"Processing batch {batch_num}/{total_batches} ({len(batch)} grants)...")
        
        for name, desc, elig in batch:
            text = f"{desc or ''} {elig or ''}".strip()
            
            try:
                result = client.models.embed_content(
                    model="models/text-embedding-004",
                    contents=text,  # CHANGED: content -> contents
                    config=genai.types.EmbedContentConfig(
                        task_type="SEMANTIC_SIMILARITY",
                        output_dimensionality=OUTPUT_DIM
                    )
                )
                
                embedding = np.array(result.embeddings[0].values, dtype=np.float32)
                all_embeddings.append(_normalize(embedding))
                metadata.append({"program_name": name})
                
            except Exception as e:
                print(f"  Error on '{name[:50]}...': {e}")
                all_embeddings.append(np.zeros(OUTPUT_DIM, dtype=np.float32))
                metadata.append({"program_name": name})
        
        completed = min(batch_idx + BATCH_SIZE, len(grants))
        print(f"  Completed: {completed}/{len(grants)}")
        
        if batch_num < total_batches:
            print(f"  Waiting {DELAY_BETWEEN_BATCHES}s...")
            time.sleep(DELAY_BETWEEN_BATCHES)
    
    print("\nSaving embeddings...")
    np.save(CACHE_FILE, np.array(all_embeddings, dtype=np.float32))
    
    with open(META_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    
    print("="*70)
    print("EMBEDDING GENERATION COMPLETE")
    print("="*70)
    print(f"Saved {len(all_embeddings)} embeddings to {CACHE_FILE}")
    print(f"Saved metadata to {META_FILE}")
    print("\nYou can now run: python test_matching.py")
    print("="*70)


if __name__ == "__main__":
    generate_embeddings()