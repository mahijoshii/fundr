from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def matches_demo():
    return {"message": "Matches route working ✅"}
