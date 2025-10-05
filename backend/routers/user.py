from fastapi import APIRouter
from pydantic import BaseModel
import json
from services import snowflake_service

router = APIRouter()

class UserProfile(BaseModel):
    user_id: str
    name: str
    age: int
    residency: str
    income: str
    race: str
    gender: str
    studentStatus: str
    immigrantStatus: str
    indigenousStatus: str
    veteranStatus: str
    funding_goal_low: int | None = None
    funding_goal_high: int | None = None
    funding_purpose: list[str] = []
    eligibility_tags: list[str] = []
    project_summary: str | None = None

@router.get("/{user_id}")
def get_user(user_id: str):
    """Fetch user profile from Snowflake"""
    conn = snowflake_service.get_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT 
            user_id, name, age, residency, income, race, gender,
            studentStatus, immigrantStatus, indigenousStatus, veteranStatus,
            funding_goal_low, funding_goal_high, funding_purpose, 
            eligibility_tags, project_summary
        FROM FUND_DB.PUBLIC.USERS
        WHERE user_id = %s
    """, (user_id,))
    
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if not row:
        return {"status": "not_found", "message": "User profile not found"}
    
    # Parse JSON arrays
    import json
    funding_purpose = row[13] if row[13] else []
    eligibility_tags = row[14] if row[14] else []
    
    # Convert Snowflake arrays to Python lists if needed
    if isinstance(funding_purpose, str):
        funding_purpose = json.loads(funding_purpose)
    if isinstance(eligibility_tags, str):
        eligibility_tags = json.loads(eligibility_tags)
    
    return {
        "status": "ok",
        "profile": {
            "user_id": row[0],
            "name": row[1],
            "age": row[2],
            "residency": row[3],
            "income": row[4],
            "race": row[5],
            "gender": row[6],
            "studentStatus": row[7],
            "immigrantStatus": row[8],
            "indigenousStatus": row[9],
            "veteranStatus": row[10],
            "funding_goal_low": row[11],
            "funding_goal_high": row[12],
            "funding_purpose": funding_purpose,
            "eligibility_tags": eligibility_tags,
            "project_summary": row[15]
        }
    }