from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def ask_demo():
    return {"message": "Ask route working ✅"}
