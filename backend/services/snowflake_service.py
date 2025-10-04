import snowflake.connector
import os
from dotenv import load_dotenv

load_dotenv()  # loads .env

def get_connection():
    return snowflake.connector.connect(
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASS"),
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
        database=os.getenv("SNOWFLAKE_DATABASE"),
        schema=os.getenv("SNOWFLAKE_SCHEMA"),
    )

def get_subsidies():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT name, amount, description FROM subsidies;")
    results = cur.fetchall()
    cur.close()
    conn.close()

    # return in dict format
    return [
        {"name": r[0], "amount": r[1], "description": r[2]} for r in results
    ]
