from fastapi import APIRouter
from pydantic import BaseModel
from services import snowflake_service

router = APIRouter()

class UserProfile(BaseModel):
    age: int
    income: float
    citizenship: str
    student: bool

@router.post("/")
def check_eligibility(profile: UserProfile):
    subsidies = snowflake_service.get_subsidies()

    # For now: return *all subsidies* regardless of profile
    # Later in Phase 5: Gemini will filter
    return {
        "user": profile.dict(),
        "eligible_subsidies": subsidies
    }
