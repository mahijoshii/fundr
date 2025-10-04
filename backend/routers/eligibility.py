from fastapi import APIRouter
from pydantic import BaseModel
from services import canada_api_service

router = APIRouter()

class UserProfile(BaseModel):
    age: int
    income: float
    citizenship: str
    student: bool

@router.post("/")
def check_eligibility(profile: UserProfile):
    # Example: if student, look for student-related grants
    query = "student" if profile.student else None
    active_grants = canada_api_service.fetch_active_grants(limit=20, query=query)

    return {
        "user": profile.dict(),
        "eligible_grants": active_grants
    }
