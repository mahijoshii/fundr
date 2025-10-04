import snowflake.connector
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return snowflake.connector.connect(
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASS"),
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
        database=os.getenv("SNOWFLAKE_DATABASE"),
        schema=os.getenv("SNOWFLAKE_SCHEMA"),
    )

def get_grants(limit=20, keyword=None):
    conn = get_connection()
    cur = conn.cursor()

    if keyword:
        sql = """
            SELECT program_name, funding_low, funding_high, description, eligibility, deadline, url, source
            FROM grants
            WHERE program_name ILIKE %s OR description ILIKE %s OR eligibility ILIKE %s
            ORDER BY scraped_at DESC
            LIMIT %s
        """
        cur.execute(sql, (f"%{keyword}%", f"%{keyword}%", f"%{keyword}%", limit))
    else:
        sql = """
            SELECT program_name, funding_low, funding_high, description, eligibility, deadline, url, source
            FROM grants
            ORDER BY scraped_at DESC
            LIMIT %s
        """
        cur.execute(sql, (limit,))

    results = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            "program_name": r[0],
            "funding_low": r[1],
            "funding_high": r[2],
            "description": r[3],
            "eligibility": r[4],
            "deadline": r[5],
            "url": r[6],
            "source": r[7],
        }
        for r in results
    ]
