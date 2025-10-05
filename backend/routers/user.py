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

@router.post("/")
def save_user(profile: UserProfile):
    conn = snowflake_service.get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS FUND_DB.PUBLIC.USERS (
            user_id STRING PRIMARY KEY,
            name STRING,
            age INT,
            residency STRING,
            income STRING,
            race STRING,
            gender STRING,
            studentStatus STRING,
            immigrantStatus STRING,
            indigenousStatus STRING,
            veteranStatus STRING,
            funding_goal_low INT,
            funding_goal_high INT,
            funding_purpose ARRAY,
            eligibility_tags ARRAY,
            project_summary STRING
        )
    """)

    cur.execute("""
        MERGE INTO FUND_DB.PUBLIC.USERS t
        USING (SELECT %s AS user_id) s
        ON t.user_id = s.user_id
        WHEN MATCHED THEN UPDATE SET
            name=%s, age=%s, residency=%s, income=%s, race=%s, gender=%s,
            studentStatus=%s, immigrantStatus=%s, indigenousStatus=%s,
            veteranStatus=%s, funding_goal_low=%s, funding_goal_high=%s,
            funding_purpose=TO_ARRAY(PARSE_JSON(%s)),
            eligibility_tags=TO_ARRAY(PARSE_JSON(%s)),
            project_summary=%s
        WHEN NOT MATCHED THEN INSERT (user_id, name, age, residency, income, race, gender,
            studentStatus, immigrantStatus, indigenousStatus, veteranStatus,
            funding_goal_low, funding_goal_high, funding_purpose, eligibility_tags, project_summary)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                TO_ARRAY(PARSE_JSON(%s)), TO_ARRAY(PARSE_JSON(%s)), %s)
    """, (
        profile.user_id, profile.name, profile.age, profile.residency, profile.income, profile.race,
        profile.gender, profile.studentStatus, profile.immigrantStatus, profile.indigenousStatus,
        profile.veteranStatus, profile.funding_goal_low, profile.funding_goal_high,
        json.dumps(profile.funding_purpose), json.dumps(profile.eligibility_tags), profile.project_summary,
        # Reuse for insert
        profile.user_id, profile.name, profile.age, profile.residency, profile.income, profile.race,
        profile.gender, profile.studentStatus, profile.immigrantStatus, profile.indigenousStatus,
        profile.veteranStatus, profile.funding_goal_low, profile.funding_goal_high,
        json.dumps(profile.funding_purpose), json.dumps(profile.eligibility_tags), profile.project_summary
    ))
    conn.commit()
    cur.close()
    conn.close()
    return {"status": "ok", "user_id": profile.user_id}
