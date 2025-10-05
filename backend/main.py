from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ask, eligibility, match, user

# ---------------------------------------------------------
# 🚀 Initialize FastAPI app
# ---------------------------------------------------------
app = FastAPI(title="Fundr Backend")

# ---------------------------------------------------------
# 🌐 Enable CORS so Expo frontend can connect
# ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],              # or restrict to your Expo dev URL if you want tighter security
    allow_credentials=True,
    allow_methods=["*"],              # allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],              # allow all headers including Authorization
)

# ---------------------------------------------------------
# 🧩 Register API routers
# ---------------------------------------------------------
app.include_router(ask.router, prefix="/ask", tags=["Chatbot"])
app.include_router(eligibility.router, prefix="/eligibility", tags=["Eligibility"])
app.include_router(match.router, prefix="/match", tags=["Matching"])
app.include_router(user.router, prefix="/user", tags=["User"])

# ---------------------------------------------------------
# 🏠 Root route (for health check)
# ---------------------------------------------------------
@app.get("/")
def root():
    return {"message": "Fundr API running"}
