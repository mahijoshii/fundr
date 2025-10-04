"""
Generate grant embeddings using Gemini Batch API
"""

import json
import os
import sys
from datetime import datetime
from dotenv import load_dotenv
from google import genai

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services import snowflake_service

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
OUTPUT_DIM = 768


def create_embeddings_batch():
    print("="*70)
    print("BATCH EMBEDDING GENERATION")
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
    
    jsonl_file = "batch_embed_requests.jsonl"
    print(f"Creating batch request file: {jsonl_file}")
    
    with open(jsonl_file, "w", encoding="utf-8") as f:
        for i, (name, desc, elig) in enumerate(grants):
            text = f"{desc or ''} {elig or ''}".strip()
            request = {
                "key": f"grant-{i}",
                "request": {
                    "content": text,
                    "task_type": "SEMANTIC_SIMILARITY",
                    "output_dimensionality": OUTPUT_DIM
                }
            }
            f.write(json.dumps(request) + "\n")
    
    print(f"Created {len(grants)} requests\n")
    
    print("Uploading batch file to Gemini API...")
    try:
        uploaded_file = client.files.upload(
            file=jsonl_file,
            config=genai.types.UploadFileConfig(
                display_name='grant-embeddings-batch',
                mime_type='application/json'
            )
        )
        print(f"File uploaded: {uploaded_file.name}\n")
        
        print("Creating batch embedding job...")
        batch_job = client.batches.create_embeddings(
            model="models/text-embedding-004",  # CHANGED THIS LINE
            src={'file_name': uploaded_file.name},
            config={'display_name': "Grant Embeddings Batch"}
        )
        
        print(f"Batch job created: {batch_job.name}\n")
        
        job_info = {
            "job_name": batch_job.name,
            "grant_count": len(grants),
            "created_at": datetime.now().isoformat(),
            "grants": [{"index": i, "program_name": name} for i, (name, _, _) in enumerate(grants)]
        }
        
        with open("batch_job_info.json", "w", encoding="utf-8") as f:
            json.dump(job_info, f, indent=2)
        
        print("="*70)
        print("BATCH JOB SUBMITTED SUCCESSFULLY")
        print("="*70)
        print(f"Job Name: {batch_job.name}")
        print(f"Grants: {len(grants)}")
        print("\nNext steps:")
        print("1. Wait for processing (usually < 24 hours)")
        print("2. Run: python scripts/check_batch_status.py")
        print("3. When complete, run: python scripts/download_embeddings.py")
        print("="*70)
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    create_embeddings_batch()