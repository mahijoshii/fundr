from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# Define request model
class UserProfile(BaseModel):
    age: int
    income: float
    citizenship: str
    student: bool

# Mock endpoint
@router.post("/")
def check_eligibility(profile: UserProfile):
    # Fake subsidies
    mock_subsidies = [
        {
            "name": "Ontario Student Grant",
            "amount": 3000,
            "reason": "Income < 20k and currently enrolled as a student"
        },
        {
            "name": "Rental Rebate",
            "amount": 1200,
            "reason": "New immigrant renting in Ontario"
        }
    ]

    return {
        "user": profile.dict(),
        "eligible_subsidies": mock_subsidies
    }
