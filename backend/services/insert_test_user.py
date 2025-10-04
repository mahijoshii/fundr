import snowflake.connector
import os
from dotenv import load_dotenv
from datetime import datetime
import json

load_dotenv()

conn = snowflake.connector.connect(
    user=os.getenv("SNOWFLAKE_USER"),
    password=os.getenv("SNOWFLAKE_PASS"),
    account=os.getenv("SNOWFLAKE_ACCOUNT"),
    warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
    database=os.getenv("SNOWFLAKE_DATABASE"),
    schema=os.getenv("SNOWFLAKE_SCHEMA"),
)

cur = conn.cursor()

# First, create the USERS table if it doesn't exist
create_users_table = """
CREATE TABLE IF NOT EXISTS FUND_DB.PUBLIC.USERS (
    user_id STRING PRIMARY KEY,
    name STRING,
    age NUMBER,
    residency STRING,
    income STRING,
    race STRING,
    gender STRING,
    studentStatus STRING,
    immigrantStatus STRING,
    indigenousStatus STRING,
    veteranStatus STRING,
    funding_goal_low NUMBER,
    funding_goal_high NUMBER,
    funding_purpose ARRAY,
    eligibility_tags ARRAY,
    project_summary STRING,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
"""

cur.execute(create_users_table)
print("USERS table ready")

# Delete existing test user if exists
cur.execute("DELETE FROM FUND_DB.PUBLIC.USERS WHERE user_id = 'demo_1'")

# Prepare array data as JSON strings
funding_purpose = json.dumps(["education", "community project"])
eligibility_tags = json.dumps(["student", "immigrant", "youth"])

# Insert test user using parameterized query with TO_ARRAY(PARSE_JSON())
insert_user = """
INSERT INTO FUND_DB.PUBLIC.USERS (
    user_id, name, age, residency, income, race, gender, studentStatus,
    immigrantStatus, indigenousStatus, veteranStatus, funding_goal_low,
    funding_goal_high, funding_purpose, eligibility_tags, project_summary
)
SELECT
    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
    TO_ARRAY(PARSE_JSON(%s)),
    TO_ARRAY(PARSE_JSON(%s)),
    %s
"""

cur.execute(insert_user, (
    'demo_1',
    'Mahi Singh',
    23,
    'Toronto, ON',
    '$25,000 - $50,000',
    'South Asian',
    'Female',
    'Full-time',
    'Yes',
    'No',
    'No',
    5000,
    20000,
    funding_purpose,
    eligibility_tags,
    'I am a computer engineering student developing an app to help new immigrants find community grants.'
))

conn.commit()

print("Test user inserted successfully!")

# Verify the insert
cur.execute("SELECT * FROM FUND_DB.PUBLIC.USERS WHERE user_id = 'demo_1'")
result = cur.fetchone()
if result:
    print("\nUser Details:")
    print(f"  User ID: {result[0]}")
    print(f"  Name: {result[1]}")
    print(f"  Age: {result[2]}")
    print(f"  Funding Goal: ${result[11]:,} - ${result[12]:,}")
    print(f"  Funding Purpose: {result[13]}")
    print(f"  Eligibility Tags: {result[14]}")
    print(f"  Project: {result[15][:80]}...")
else:
    print("User not found after insert")

cur.close()
conn.close()