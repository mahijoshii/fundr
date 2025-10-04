"""
Download completed batch embeddings and save to cache
"""

import json
import os
import numpy as np
from dotenv import load_dotenv
import google as genai

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

CACHE_FILE = "grant_embeddings.npy"
META_FILE = "grant_metadata.json"


def download_embeddings():
    if not os.path.exists("batch_job_info.json"):
        print("No batch job found.")
        return
    
    with open("batch_job_info.json", "r") as f:
        job_info = json.load(f)
    
    print("="*70)
    print("DOWNLOADING BATCH RESULTS")
    print("="*70)
    
    try:
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        batch_job = client.batches.get(name=job_info["job_name"])
        
        if batch_job.state.name != 'JOB_STATE_SUCCEEDED':
            print(f"Job not completed. Status: {batch_job.state.name}")
            return
        
        # Download result file
        result_file_name = batch_job.dest.file_name
        print(f"Downloading from: {result_file_name}\n")
        
        file_content = client.files.download(file=result_file_name)
        results = file_content.decode('utf-8').strip().split('\n')
        
        print(f"Processing {len(results)} results...")
        
        # Parse embeddings in order
        embeddings = []
        grant_info = {g["index"]: g["program_name"] for g in job_info["grants"]}
        
        for line in results:
            result = json.loads(line)
            
            # Extract index from key (grant-0, grant-1, etc)
            key = result.get('key', '')
            index = int(key.split('-')[1]) if '-' in key else 0
            
            if 'response' in result and 'embedding' in result['response']:
                embedding = result['response']['embedding']
                embeddings.append((index, embedding))
        
        # Sort by index to maintain order
        embeddings.sort(key=lambda x: x[0])
        embedding_arrays = [np.array(e[1], dtype=np.float32) for e in embeddings]
        
        # Normalize embeddings
        normalized = []
        for emb in embedding_arrays:
            norm = np.linalg.norm(emb)
            normalized.append(emb / norm if norm != 0 else emb)
        
        # Save to cache
        np.save(CACHE_FILE, np.array(normalized, dtype=np.float32))
        
        # Save metadata
        metadata = [{"program_name": grant_info.get(i, f"grant-{i}")} 
                   for i in range(len(normalized))]
        with open(META_FILE, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)
        
        print(f"\n✅ Saved {len(normalized)} embeddings to {CACHE_FILE}")
        print(f"✅ Saved metadata to {META_FILE}")
        print("\nYou can now run your matching service!")
        print("="*70)
        
    except Exception as e:
        print(f"Error downloading results: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    download_embeddings()