from services import snowflake_service, gemini_service
import numpy as np
import json
import os


def match_user_to_grants(user_id: str, limit=10):
    """
    Match user to grants using precomputed embeddings.
    Only 1 Gemini API call (for user embedding).
    """
    conn = snowflake_service.get_connection()
    cur = conn.cursor()

    # Fetch user profile
    cur.execute(
        """
        SELECT 
            project_summary, 
            funding_goal_low, 
            funding_goal_high, 
            eligibility_tags
        FROM FUND_DB.PUBLIC.USERS
        WHERE user_id = %s
        LIMIT 1;
        """,
        (user_id,),
    )
    user = cur.fetchone()
    if not user:
        cur.close()
        conn.close()
        print(f"❌ No user found with ID {user_id}")
        return []

    user_summary = user[0] or ""
    goal_low = float(user[1]) if user[1] else 0
    goal_high = float(user[2]) if user[2] else 0

    # Parse eligibility tags
    tags_raw = user[3]
    tags = []
    if tags_raw:
        if isinstance(tags_raw, str):
            try:
                tags = json.loads(tags_raw)
            except:
                tags = [t.strip().lower() for t in tags_raw.split(",")]
        elif isinstance(tags_raw, list):
            tags = [str(t).lower() for t in tags_raw]

    # Load precomputed embeddings (no API call here!)
    try:
        grant_vecs = gemini_service.load_cached_embeddings()
    except FileNotFoundError as e:
        cur.close()
        conn.close()
        print(str(e))
        return []

    # Fetch grants
    cur.execute(
        """
        SELECT 
            program_name, 
            description, 
            eligibility, 
            funding_low, 
            funding_high, 
            url
        FROM FUND_DB.PUBLIC.GRANTS
        WHERE description IS NOT NULL
        """
    )
    grants = cur.fetchall()
    cur.close()
    conn.close()

    if len(grants) != len(grant_vecs):
        print(f"⚠️ Mismatch: {len(grants)} grants vs {len(grant_vecs)} embeddings")
        print("   Regenerate embeddings: python scripts/generate_batch_embeddings.py")
        return []

    # Compute user embedding (only one API call total!)
    user_vec = gemini_service.get_embedding(user_summary)

    matches = []
    for i, g in enumerate(grants):
        name, desc, elig, low, high, url = g
        g_vec = grant_vecs[i]
        sim = gemini_service.cosine_similarity(user_vec, g_vec)
        score = round((sim + 1) / 2, 3)

        # Rule-based funding overlap
        funding_match = True
        if goal_low and goal_high and low and high:
            try:
                low_f = float(str(low).replace("$", "").replace(",", ""))
                high_f = float(str(high).replace("$", "").replace(",", ""))
                if not (low_f <= goal_high and high_f >= goal_low):
                    funding_match = False
            except Exception:
                pass
        if not funding_match:
            continue

        # Tag-based boost
        tag_boost = 0
        text_lower = f"{desc or ''} {elig or ''}".lower()
        for tag in tags:
            if tag in text_lower:
                tag_boost += 0.05

        total_score = min(score + tag_boost, 1.0)
        matches.append(
            {
                "program_name": name,
                "url": url,
                "description": (desc[:200] + "...") if desc and len(desc) > 200 else desc,
                "funding_low": low,
                "funding_high": high,
                "score": round(total_score, 3),
            }
        )

    matches = sorted(matches, key=lambda x: x["score"], reverse=True)[:limit]
    print(f"✅ Matching complete — returning top {len(matches)} results")
    return matches