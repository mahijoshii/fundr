import snowflake.connector
import pandas as pd
import os
from dotenv import load_dotenv
from datetime import datetime
import numpy as np
import re
import glob

load_dotenv()


# ----------------------------------------------------------------------
#  SNOWFLAKE CONNECTION
# ----------------------------------------------------------------------
def get_connection():
    """Establish Snowflake connection"""
    return snowflake.connector.connect(
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASS"),
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
        database=os.getenv("SNOWFLAKE_DATABASE"),
        schema=os.getenv("SNOWFLAKE_SCHEMA"),
    )


# ----------------------------------------------------------------------
#  TABLE CREATION
# ----------------------------------------------------------------------
def create_grants_table(cur):
    """Create grants table if it doesn't exist - matches your existing schema"""
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS FUND_DB.PUBLIC.GRANTS (
        source STRING,
        grant_id STRING,
        program_name STRING,
        description STRING,
        summary STRING,
        deadline STRING,
        funding_low STRING,
        funding_high STRING,
        eligibility STRING,
        interests STRING,
        application_process STRING,
        contact STRING,
        url STRING,
        scraped_at TIMESTAMP
    )
    """
    cur.execute(create_table_sql)
    print("✓ Grants table ready")


# ----------------------------------------------------------------------
#  UPLOAD CSV
# ----------------------------------------------------------------------
def upload_csv_to_snowflake(csv_file):
    print("\n" + "=" * 70)
    print("UPLOADING TO SNOWFLAKE")
    print("=" * 70)
    print(f"File: {csv_file}")

    # -----------------------------------------------------------
    # Load CSV
    # -----------------------------------------------------------
    try:
        df = pd.read_csv(csv_file)
        print(f"✓ Loaded {len(df)} grants from CSV")
    except Exception as e:
        print(f"✗ Failed to read CSV: {e}")
        return

    # -----------------------------------------------------------
    # CLEANING PHASE
    # -----------------------------------------------------------
    # 1️⃣ Replace NaNs / None
    df = df.replace({np.nan: "", pd.NA: "", None: "", "nan": "", "NaN": ""})

    # 2️⃣ Clean funding columns (remove symbols, normalize)
    for col in ["funding_low", "funding_high"]:
        if col in df.columns:
            df[col] = df[col].astype(str).apply(lambda x: re.sub(r"[^\d.]", "", x.strip()))
            df[col] = df[col].replace("", None)

    # 3️⃣ Ensure deadlines and scraped_at are strings
    for col in ["deadline", "scraped_at"]:
        if col in df.columns:
            df[col] = df[col].astype(str).replace({"NaT": "", "nat": "", "NaN": ""})

    # 4️⃣ Trim long whitespace in text fields
    text_cols = [
        "program_name",
        "description",
        "summary",
        "eligibility",
        "interests",
        "application_process",
        "contact",
        "url",
    ]
    for col in text_cols:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()

    # 5️⃣ Fill missing cells final sweep
    df = df.fillna("").astype(str)

    # 6️⃣ Map application_link if present
    if "application_link" in df.columns:
        df["application_process"] = df["application_link"]
        df = df.drop("application_link", axis=1)
        print("✓ Mapped application_link -> application_process")

    # 7️⃣ Add missing columns
    for c in ["summary", "contact", "grant_id"]:
        if c not in df.columns:
            df[c] = None

    # 8️⃣ Clean & normalize funding values and create display string
    for col in ["funding_low", "funding_high"]:
        if col in df.columns:
            df[col] = df[col].replace({"": None, np.nan: None}).astype(str)

    df["funding_display"] = df.apply(
        lambda r: f"${r['funding_low']}–${r['funding_high']}"
        if r["funding_low"] and r["funding_high"]
        else (f"${r['funding_low']}" if r["funding_low"] else "-"),
        axis=1,
    )

    # 9️⃣ Reorder columns for Snowflake
    snowflake_columns = [
        "source",
        "grant_id",
        "program_name",
        "description",
        "summary",
        "deadline",
        "funding_low",
        "funding_high",
        "eligibility",
        "interests",
        "application_process",
        "contact",
        "url",
        "scraped_at",
    ]
    df = df[snowflake_columns]
    print("✓ Column mapping complete")
    print(f"  Columns: {list(df.columns)}")

    # -----------------------------------------------------------
    # CONNECT + UPLOAD
    # -----------------------------------------------------------
    try:
        conn = get_connection()
        cur = conn.cursor()
        print("✓ Connected to Snowflake")
    except Exception as e:
        print(f"✗ Failed to connect: {e}")
        return

    try:
        create_grants_table(cur)

        insert_sql = """
        INSERT INTO FUND_DB.PUBLIC.GRANTS (
            source, grant_id, program_name, description, summary,
            deadline, funding_low, funding_high, eligibility, interests,
            application_process, contact, url, scraped_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        records = [tuple(row) for _, row in df.iterrows()]

        print(f"Uploading {len(records)} records...")
        cur.executemany(insert_sql, records)
        conn.commit()
        print(f"✓ Successfully uploaded {len(records)} grants to Snowflake")

        # Verify upload
        cur.execute("SELECT COUNT(*) FROM FUND_DB.PUBLIC.GRANTS;")
        count = cur.fetchone()[0]
        print(f"✓ Total records in database: {count}")

        # Breakdown by source
        cur.execute(
            """
            SELECT source, COUNT(*) as count 
            FROM FUND_DB.PUBLIC.GRANTS 
            GROUP BY source
            ORDER BY count DESC
        """
        )
        print("\nBreakdown by source:")
        for row in cur.fetchall():
            print(f"  - {row[0]}: {row[1]}")

    except Exception as e:
        print(f"✗ Upload failed: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()
        print("\n✓ Connection closed")


# ----------------------------------------------------------------------
#  RETRIEVAL
# ----------------------------------------------------------------------
def get_recent_grants(limit=10, keyword=None):
    conn = get_connection()
    cur = conn.cursor()

    if keyword:
        sql = """
            SELECT program_name, funding_low, funding_high, description, 
                   eligibility, deadline, url, source, scraped_at
            FROM FUND_DB.PUBLIC.GRANTS
            WHERE program_name ILIKE %s OR description ILIKE %s OR eligibility ILIKE %s
            ORDER BY scraped_at DESC
            LIMIT %s
        """
        cur.execute(sql, (f"%{keyword}%", f"%{keyword}%", f"%{keyword}%", limit))
    else:
        sql = """
            SELECT program_name, funding_low, funding_high, description, 
                   eligibility, deadline, url, source, scraped_at
            FROM FUND_DB.PUBLIC.GRANTS
            ORDER BY scraped_at DESC
            LIMIT %s
        """
        cur.execute(sql, (limit,))

    results = cur.fetchall()
    cur.close()
    conn.close()

    grants = []
    for r in results:
        grants.append(
            {
                "program_name": r[0],
                "funding_low": r[1],
                "funding_high": r[2],
                "description": r[3],
                "eligibility": r[4],
                "deadline": r[5],
                "url": r[6],
                "source": r[7],
                "scraped_at": r[8],
            }
        )
    return grants


# ----------------------------------------------------------------------
#  DELETE OLD RECORDS
# ----------------------------------------------------------------------
def delete_old_grants(days_old=90):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM FUND_DB.PUBLIC.GRANTS WHERE scraped_at < DATEADD(day, -%s, CURRENT_TIMESTAMP())",
        (days_old,),
    )
    deleted_count = cur.rowcount
    conn.commit()
    print(f"✓ Deleted {deleted_count} grants older than {days_old} days")
    cur.close()
    conn.close()


# ----------------------------------------------------------------------
#  MAIN
# ----------------------------------------------------------------------
if __name__ == "__main__":
    csv_files = glob.glob("ontario_grants_consolidated_*.csv")

    if not csv_files:
        print("✗ No consolidated CSV files found")
        print("  Run the scraper first to generate a CSV file")
    else:
        latest_csv = max(csv_files, key=os.path.getctime)
        print(f"Found CSV file: {latest_csv}")

        upload_csv_to_snowflake(latest_csv)

        print("\n" + "=" * 70)
        print("SAMPLE RETRIEVAL TEST")
        print("=" * 70)

        try:
            recent = get_recent_grants(limit=5)
            print(f"\nRetrieved {len(recent)} recent grants:")
            for i, grant in enumerate(recent, 1):
                # Graceful funding display
                if grant["funding_low"] and grant["funding_high"]:
                    funding = f"${grant['funding_low']}–${grant['funding_high']}"
                elif grant["funding_low"]:
                    funding = f"${grant['funding_low']}"
                else:
                    funding = "-"
                print(f"\n{i}. {grant['program_name']}")
                print(f"   Source: {grant['source']}")
                print(f"   Funding: {funding}")
        except Exception as e:
            print(f"Failed to retrieve grants: {e}")
