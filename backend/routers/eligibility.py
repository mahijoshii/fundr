from fastapi import APIRouter
from pydantic import BaseModel
from services import snowflake_service

router = APIRouter()

class UserProfile(BaseModel):
    age: int
    income: float
    citizenship: str
    student: bool
    residency: str = None

@router.post("/")
def check_eligibility(profile: UserProfile):
    """
    Check eligibility based on user profile
    Returns grants that match basic criteria
    """
    # Build search keywords based on profile
    keywords = []
    if profile.student:
        keywords.append("student")
    if profile.age < 30:
        keywords.append("youth")
    if profile.citizenship != "Canadian":
        keywords.append("immigrant")
    
    # Search for matching grants
    all_grants = []
    if keywords:
        for keyword in keywords:
            grants = snowflake_service.get_grants(limit=50, keyword=keyword)
            all_grants.extend(grants)
    else:
        all_grants = snowflake_service.get_grants(limit=20)
    
    # Remove duplicates based on program_name
    seen = set()
    unique_grants = []
    for grant in all_grants:
        if grant["program_name"] not in seen:
            seen.add(grant["program_name"])
            unique_grants.append(grant)
    
    return {
        "user": profile.dict(),
        "eligible_grants": unique_grants[:20],
        "total_found": len(unique_grants)
    }