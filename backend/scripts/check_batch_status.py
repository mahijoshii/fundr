"""
Check status of batch embedding job
"""

import json
import os
from datetime import datetime
from dotenv import load_dotenv
import google as genai

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


def check_status():
    if not os.path.exists("batch_job_info.json"):
        print("No batch job found. Run generate_batch_embeddings.py first.")
        return
    
    with open("batch_job_info.json", "r") as f:
        job_info = json.load(f)
    
    job_name = job_info["job_name"]
    created_at = datetime.fromisoformat(job_info["created_at"])
    
    print("="*70)
    print("BATCH JOB STATUS")
    print("="*70)
    print(f"Job: {job_name}")
    print(f"Created: {created_at.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Grants: {job_info['grant_count']}\n")
    
    try:
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        batch_job = client.batches.get(name=job_name)
        
        print(f"Status: {batch_job.state.name}")
        
        if batch_job.state.name == 'JOB_STATE_SUCCEEDED':
            print("\n✅ Batch job completed successfully!")
            print("Run 'python scripts/download_embeddings.py' to retrieve results")
        elif batch_job.state.name in ['JOB_STATE_FAILED', 'JOB_STATE_CANCELLED', 'JOB_STATE_EXPIRED']:
            print(f"\n❌ Job failed: {getattr(batch_job, 'error', 'Unknown error')}")
        else:
            print("\n⏳ Job still processing...")
            print("Check again in a few minutes/hours")
        
        print("="*70)
        
    except Exception as e:
        print(f"Error checking status: {e}")


if __name__ == "__main__":
    check_status()