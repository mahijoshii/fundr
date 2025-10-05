from services import snowflake_service, gemini_service
import numpy as np
import json
import os


def match_user_to_grants(user_id: str, limit=20):
    """
    Match user to grants using precomputed embeddings.
    Only 1 Gemini API call (for user embedding).
    
    Args:
        user_id: The user's unique identifier
        limit: Maximum number of matches to return (default 20)
    
    Returns:
        List of matched grants with scores, sorted by relevance
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
            eligibility_tags,
            name,
            age,
            residency,
            income,
            race,
            gender,
            studentStatus,
            immigrantStatus,
            indigenousStatus,
            veteranStatus
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

    # Unpack user data
    user_summary = user[0] or ""
    goal_low = float(user[1]) if user[1] else 0
    goal_high = float(user[2]) if user[2] else 0
    tags_raw = user[3]
    
    # User demographic info for enhanced matching
    user_name = user[4]
    user_age = user[5]
    user_residency = user[6]
    user_income = user[7]
    user_race = user[8]
    user_gender = user[9]
    user_student = user[10]
    user_immigrant = user[11]
    user_indigenous = user[12]
    user_veteran = user[13]

    # Parse eligibility tags
    tags = []
    if tags_raw:
        if isinstance(tags_raw, str):
            try:
                tags = json.loads(tags_raw)
            except:
                tags = [t.strip().lower() for t in tags_raw.split(",")]
        elif isinstance(tags_raw, list):
            tags = [str(t).lower() for t in tags_raw]

    print(f"🔍 Matching user: {user_name} (ID: {user_id})")
    print(f"   Tags: {tags}")
    print(f"   Funding goal: ${goal_low} - ${goal_high}")

    # Load precomputed embeddings (no API call here!)
    try:
        grant_vecs = gemini_service.load_cached_embeddings()
        print(f"✅ Loaded {len(grant_vecs)} precomputed grant embeddings")
    except FileNotFoundError as e:
        cur.close()
        conn.close()
        print(str(e))
        return []

    # Fetch all grants with complete information
    cur.execute(
        """
        SELECT 
            program_name, 
            description, 
            eligibility, 
            funding_low, 
            funding_high,
            deadline,
            source,
            url
        FROM FUND_DB.PUBLIC.GRANTS
        WHERE description IS NOT NULL
        ORDER BY scraped_at DESC
        """
    )
    grants = cur.fetchall()
    cur.close()
    conn.close()

    if len(grants) != len(grant_vecs):
        print(f"⚠️ Mismatch: {len(grants)} grants vs {len(grant_vecs)} embeddings")
        print("   Regenerate embeddings: python scripts/generate_embeddings_with_ratelimit.py")
        return []

    print(f"📊 Processing {len(grants)} grants for matching...")

    # Compute user embedding (only one API call total!)
    user_vec = gemini_service.get_embedding(user_summary)

    matches = []
    for i, g in enumerate(grants):
        name, desc, elig, low, high, deadline, source, url = g
        
        # Skip grants with no name
        if not name:
            continue
        
        g_vec = grant_vecs[i]
        
        # Calculate semantic similarity using embeddings
        sim = gemini_service.cosine_similarity(user_vec, g_vec)
        # Normalize score to 0-1 range
        base_score = (sim + 1) / 2

        # Rule-based funding overlap check
        funding_match = True
        if goal_low and goal_high and low and high:
            try:
                # Clean and parse funding amounts
                low_str = str(low).replace("$", "").replace(",", "").strip()
                high_str = str(high).replace("$", "").replace(",", "").strip()
                
                if low_str and high_str:
                    low_f = float(low_str)
                    high_f = float(high_str)
                    # Check if there's any overlap between user's goal and grant's range
                    if not (low_f <= goal_high and high_f >= goal_low):
                        funding_match = False
            except (ValueError, TypeError):
                # If parsing fails, don't filter out the grant
                pass

        # Skip if funding doesn't match
        if not funding_match:
            continue

        # Demographic and eligibility matching boosts
        tag_boost = 0
        text_lower = f"{desc or ''} {elig or ''}".lower()
        
        # Boost for matching eligibility tags
        for tag in tags:
            if tag in text_lower:
                tag_boost += 0.05
        
        # Boost for demographic matches
        if user_student and user_student.lower() != "none":
            if "student" in text_lower:
                tag_boost += 0.08
        
        if user_immigrant and user_immigrant.lower() == "yes":
            if "immigrant" in text_lower or "newcomer" in text_lower:
                tag_boost += 0.08
        
        if user_indigenous and user_indigenous.lower() == "yes":
            if "indigenous" in text_lower or "first nation" in text_lower or "aboriginal" in text_lower:
                tag_boost += 0.1
        
        if user_veteran and user_veteran.lower() == "yes":
            if "veteran" in text_lower or "military" in text_lower:
                tag_boost += 0.08
        
        # Age-based matching
        if user_age:
            try:
                age_num = int(user_age)
                if age_num < 30 and "youth" in text_lower:
                    tag_boost += 0.06
                elif age_num >= 65 and ("senior" in text_lower or "elder" in text_lower):
                    tag_boost += 0.06
            except (ValueError, TypeError):
                pass
        
        # Gender-specific programs
        if user_gender:
            gender_lower = user_gender.lower()
            if "women" in text_lower and gender_lower == "female":
                tag_boost += 0.06
            elif "men" in text_lower and gender_lower == "male":
                tag_boost += 0.06

        # Calculate total score (cap at 1.0)
        total_score = min(base_score + tag_boost, 1.0)
        
        # Only include grants with a reasonable match score (>= 0.3)
        if total_score < 0.3:
            continue

        # Format funding amounts for display
        funding_low_display = low
        funding_high_display = high
        
        # Clean funding values if they exist
        if low:
            low_str = str(low).replace("$", "").replace(",", "").strip()
            if low_str:
                try:
                    funding_low_display = f"{int(float(low_str)):,}"
                except:
                    funding_low_display = low
        
        if high:
            high_str = str(high).replace("$", "").replace(",", "").strip()
            if high_str:
                try:
                    funding_high_display = f"{int(float(high_str)):,}"
                except:
                    funding_high_display = high

        matches.append({
            "program_name": name,
            "url": url or "",
            "description": (desc[:200] + "...") if desc and len(desc) > 200 else (desc or "No description available"),
            "funding_low": funding_low_display,
            "funding_high": funding_high_display,
            "deadline": deadline or "Rolling deadline",
            "source": source or "Ontario",
            "score": round(total_score, 3),
        })

    # Sort by score (highest first) and limit results
    matches = sorted(matches, key=lambda x: x["score"], reverse=True)[:limit]
    
    print(f"✅ Matching complete — returning top {len(matches)} results")
    if matches:
        print(f"   Top match: {matches[0]['program_name']} (score: {matches[0]['score']})")
    
    return matches