"""
Gemini Embedding Service
"""

import os
import numpy as np
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

OUTPUT_DIM = 768
CACHE_FILE = "grant_embeddings.npy"
META_FILE = "grant_metadata.json"


def _normalize(v: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(v)
    return v / norm if norm != 0 else v


def get_embedding(text: str) -> np.ndarray:
    """Get single embedding (for user profile only)"""
    if not text or not text.strip():
        return np.zeros(OUTPUT_DIM, dtype=np.float32)
    
    result = client.models.embed_content(
        model="models/text-embedding-004",
        contents=text,  # CHANGED: content -> contents
        config=genai.types.EmbedContentConfig(
            task_type="SEMANTIC_SIMILARITY",
            output_dimensionality=OUTPUT_DIM
        )
    )
    
    embedding = np.array(result.embeddings[0].values, dtype=np.float32)
    return _normalize(embedding)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def load_cached_embeddings():
    if not os.path.exists(CACHE_FILE):
        raise FileNotFoundError(
            f"Grant embeddings not found at {CACHE_FILE}! "
            "Run 'python scripts/generate_embeddings_with_ratelimit.py' first."
        )
    return np.load(CACHE_FILE)