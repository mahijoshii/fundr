from fastapi import APIRouter, HTTPException
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


@router.post("/")
def create_or_update_profile(profile: UserProfile):
    """Create or update user profile"""
    try:
        conn = snowflake_service.get_connection()
        cur = conn.cursor()
        
        # Check if user exists
        cur.execute("SELECT user_id FROM FUND_DB.PUBLIC.USERS WHERE user_id = %s", (profile.user_id,))
        exists = cur.fetchone()
        
        # Convert lists to JSON - handle empty arrays
        funding_purpose_json = json.dumps(profile.funding_purpose) if profile.funding_purpose else None
        eligibility_tags_json = json.dumps(profile.eligibility_tags) if profile.eligibility_tags else None
        
        if exists:
            # Update existing profile
            if funding_purpose_json and eligibility_tags_json:
                cur.execute("""
                    UPDATE FUND_DB.PUBLIC.USERS
                    SET name = %s, age = %s, residency = %s, income = %s, race = %s, gender = %s,
                        studentStatus = %s, immigrantStatus = %s, indigenousStatus = %s, veteranStatus = %s,
                        funding_goal_low = %s, funding_goal_high = %s,
                        funding_purpose = TO_ARRAY(PARSE_JSON(%s)),
                        eligibility_tags = TO_ARRAY(PARSE_JSON(%s)),
                        project_summary = %s
                    WHERE user_id = %s
                """, (
                    profile.name, profile.age, profile.residency, profile.income, profile.race, profile.gender,
                    profile.studentStatus, profile.immigrantStatus, profile.indigenousStatus, profile.veteranStatus,
                    profile.funding_goal_low, profile.funding_goal_high,
                    funding_purpose_json, eligibility_tags_json, profile.project_summary,
                    profile.user_id
                ))
            elif funding_purpose_json:
                cur.execute("""
                    UPDATE FUND_DB.PUBLIC.USERS
                    SET name = %s, age = %s, residency = %s, income = %s, race = %s, gender = %s,
                        studentStatus = %s, immigrantStatus = %s, indigenousStatus = %s, veteranStatus = %s,
                        funding_goal_low = %s, funding_goal_high = %s,
                        funding_purpose = TO_ARRAY(PARSE_JSON(%s)),
                        eligibility_tags = NULL,
                        project_summary = %s
                    WHERE user_id = %s
                """, (
                    profile.name, profile.age, profile.residency, profile.income, profile.race, profile.gender,
                    profile.studentStatus, profile.immigrantStatus, profile.indigenousStatus, profile.veteranStatus,
                    profile.funding_goal_low, profile.funding_goal_high,
                    funding_purpose_json, profile.project_summary,
                    profile.user_id
                ))
            elif eligibility_tags_json:
                cur.execute("""
                    UPDATE FUND_DB.PUBLIC.USERS
                    SET name = %s, age = %s, residency = %s, income = %s, race = %s, gender = %s,
                        studentStatus = %s, immigrantStatus = %s, indigenousStatus = %s, veteranStatus = %s,
                        funding_goal_low = %s, funding_goal_high = %s,
                        funding_purpose = NULL,
                        eligibility_tags = TO_ARRAY(PARSE_JSON(%s)),
                        project_summary = %s
                    WHERE user_id = %s
                """, (
                    profile.name, profile.age, profile.residency, profile.income, profile.race, profile.gender,
                    profile.studentStatus, profile.immigrantStatus, profile.indigenousStatus, profile.veteranStatus,
                    profile.funding_goal_low, profile.funding_goal_high,
                    eligibility_tags_json, profile.project_summary,
                    profile.user_id
                ))
            else:
                cur.execute("""
                    UPDATE FUND_DB.PUBLIC.USERS
                    SET name = %s, age = %s, residency = %s, income = %s, race = %s, gender = %s,
                        studentStatus = %s, immigrantStatus = %s, indigenousStatus = %s, veteranStatus = %s,
                        funding_goal_low = %s, funding_goal_high = %s,
                        funding_purpose = NULL,
                        eligibility_tags = NULL,
                        project_summary = %s
                    WHERE user_id = %s
                """, (
                    profile.name, profile.age, profile.residency, profile.income, profile.race, profile.gender,
                    profile.studentStatus, profile.immigrantStatus, profile.indigenousStatus, profile.veteranStatus,
                    profile.funding_goal_low, profile.funding_goal_high,
                    profile.project_summary,
                    profile.user_id
                ))
            print(f"✅ Updated profile: {profile.user_id}")
        else:
            # Insert new profile
            if funding_purpose_json and eligibility_tags_json:
                cur.execute("""
                    INSERT INTO FUND_DB.PUBLIC.USERS (
                        user_id, name, age, residency, income, race, gender,
                        studentStatus, immigrantStatus, indigenousStatus, veteranStatus,
                        funding_goal_low, funding_goal_high, funding_purpose, eligibility_tags, project_summary
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        TO_ARRAY(PARSE_JSON(%s)), TO_ARRAY(PARSE_JSON(%s)), %s
                    )
                """, (
                    profile.user_id, profile.name, profile.age, profile.residency, profile.income,
                    profile.race, profile.gender, profile.studentStatus, profile.immigrantStatus,
                    profile.indigenousStatus, profile.veteranStatus, profile.funding_goal_low,
                    profile.funding_goal_high, funding_purpose_json, eligibility_tags_json,
                    profile.project_summary
                ))
            elif funding_purpose_json:
                cur.execute("""
                    INSERT INTO FUND_DB.PUBLIC.USERS (
                        user_id, name, age, residency, income, race, gender,
                        studentStatus, immigrantStatus, indigenousStatus, veteranStatus,
                        funding_goal_low, funding_goal_high, funding_purpose, eligibility_tags, project_summary
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        TO_ARRAY(PARSE_JSON(%s)), NULL, %s
                    )
                """, (
                    profile.user_id, profile.name, profile.age, profile.residency, profile.income,
                    profile.race, profile.gender, profile.studentStatus, profile.immigrantStatus,
                    profile.indigenousStatus, profile.veteranStatus, profile.funding_goal_low,
                    profile.funding_goal_high, funding_purpose_json,
                    profile.project_summary
                ))
            elif eligibility_tags_json:
                cur.execute("""
                    INSERT INTO FUND_DB.PUBLIC.USERS (
                        user_id, name, age, residency, income, race, gender,
                        studentStatus, immigrantStatus, indigenousStatus, veteranStatus,
                        funding_goal_low, funding_goal_high, funding_purpose, eligibility_tags, project_summary
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        NULL, TO_ARRAY(PARSE_JSON(%s)), %s
                    )
                """, (
                    profile.user_id, profile.name, profile.age, profile.residency, profile.income,
                    profile.race, profile.gender, profile.studentStatus, profile.immigrantStatus,
                    profile.indigenousStatus, profile.veteranStatus, profile.funding_goal_low,
                    profile.funding_goal_high, eligibility_tags_json,
                    profile.project_summary
                ))
            else:
                cur.execute("""
                    INSERT INTO FUND_DB.PUBLIC.USERS (
                        user_id, name, age, residency, income, race, gender,
                        studentStatus, immigrantStatus, indigenousStatus, veteranStatus,
                        funding_goal_low, funding_goal_high, funding_purpose, eligibility_tags, project_summary
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        NULL, NULL, %s
                    )
                """, (
                    profile.user_id, profile.name, profile.age, profile.residency, profile.income,
                    profile.race, profile.gender, profile.studentStatus, profile.immigrantStatus,
                    profile.indigenousStatus, profile.veteranStatus, profile.funding_goal_low,
                    profile.funding_goal_high,
                    profile.project_summary
                ))
            print(f"✅ Created profile: {profile.user_id}")
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "status": "success",
            "message": "Profile saved successfully",
            "user_id": profile.user_id
        }
        
    except Exception as e:
        print(f"❌ Error saving profile: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to save profile: {str(e)}")


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