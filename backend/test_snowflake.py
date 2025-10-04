import snowflake.connector
import os
from dotenv import load_dotenv

# Load .env
load_dotenv()

try:
    conn = snowflake.connector.connect(
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASS"),
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
        database=os.getenv("SNOWFLAKE_DATABASE"),
        schema=os.getenv("SNOWFLAKE_SCHEMA"),
    )
    cur = conn.cursor()
    cur.execute("SELECT CURRENT_VERSION();")
    version = cur.fetchone()
    print("✅ Connected to Snowflake! Version:", version[0])

    # Test query: list all subsidies
    cur.execute("SELECT * FROM SUBSIDIES;")
    rows = cur.fetchall()
    print("Subsidies table contents:")
    for row in rows:
        print(row)

    cur.close()
    conn.close()
except Exception as e:
    print("❌ Connection failed:", e)
