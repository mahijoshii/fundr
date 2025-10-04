from fastapi import FastAPI
from routers import ask, eligibility, match

app = FastAPI(title="Fundr Backend")

# Register routers
app.include_router(ask.router, prefix="/ask", tags=["Chatbot"])
app.include_router(eligibility.router, prefix="/eligibility", tags=["Eligibility"])
app.include_router(match.router, prefix="/match", tags=["Matching"])

@app.get("/")
def root():
    return {"message": "Fundr API running"}