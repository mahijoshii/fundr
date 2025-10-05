# services/auth_routes.py
from fastapi import APIRouter
from services import snowflake_service

router = APIRouter()

@router.get("/stats")
def get_account_stats():
    """Return number of user profiles in Snowflake"""
    try:
        conn = snowflake_service.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM FUND_DB.PUBLIC.USERS")
        total_users = cur.fetchone()[0]
        cur.close()
        conn.close()
    except Exception as e:
        print("❌ Failed to fetch user count from Snowflake:", e)
        total_users = 0

    MAX_USERS = 5  # demo system limit
    remaining = max(0, MAX_USERS - total_users)
    return {
        "totalUsers": total_users,
        "maxUsers": MAX_USERS,
        "remainingSlots": remaining,
    }
