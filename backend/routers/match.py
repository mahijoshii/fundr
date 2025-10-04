from fastapi import APIRouter
from services.matching_service import match_user_to_grants

router = APIRouter()

@router.get("/{user_id}")
def get_matches(user_id: str):
    """
    Get personalized grant matches for a user
    """
    results = match_user_to_grants(user_id)
    return {"user_id": user_id, "matches": results}