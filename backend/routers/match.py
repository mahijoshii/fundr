from fastapi import APIRouter
from services.matching_service import match_user_to_grants
from services import snowflake_service

router = APIRouter()

@router.get("/{user_id}")
def get_matches(user_id: str):
    """
    Get personalized grant matches for a user
    """
    results = match_user_to_grants(user_id)
    return {"user_id": user_id, "matches": results}

@router.get("/grants/all")
def get_all_grants(limit: int = 20):
    """
    Get all available grants for swiping
    Returns grants formatted for the swipe UI
    """
    conn = snowflake_service.get_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT 
            program_name,
            description,
            funding_low,
            funding_high,
            deadline,
            eligibility,
            url,
            source
        FROM FUND_DB.PUBLIC.GRANTS
        WHERE description IS NOT NULL
        ORDER BY scraped_at DESC
        LIMIT %s
    """, (limit,))
    
    grants = cur.fetchall()
    cur.close()
    conn.close()
    
    # Format for swipe UI
    formatted_grants = []
    for idx, grant in enumerate(grants):
        name, desc, low, high, deadline, eligibility, url, source = grant
        
        # Format funding display
        if low and high:
            funding_display = f"${low} - ${high}"
        elif low:
            funding_display = f"${low}"
        elif high:
            funding_display = f"Up to ${high}"
        else:
            funding_display = "Contact for details"
        
        formatted_grants.append({
            "id": str(idx + 1),
            "title": name or "Untitled Grant",
            "description": desc or "No description available",
            "region": source or "Ontario",
            "deadline": deadline or "Rolling deadline",
            "funding": funding_display,
            "eligibility": eligibility,
            "url": url
        })
    
    return {"grants": formatted_grants, "total": len(formatted_grants)}