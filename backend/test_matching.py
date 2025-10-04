"""
Test script to verify the matching system works end-to-end
Run this after setting up your test user
"""

from services.matching_service import match_user_to_grants
from services import snowflake_service
import json

def test_matching():
    print("="*70)
    print("TESTING GRANT MATCHING SYSTEM")
    print("="*70)
    
    # Test user ID
    user_id = "demo_1"
    
    # 1. Verify user exists
    print(f"\n1. Checking if user '{user_id}' exists...")
    conn = snowflake_service.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT name, project_summary FROM FUND_DB.PUBLIC.USERS WHERE user_id = %s", (user_id,))
    user = cur.fetchone()
    
    if not user:
        print(f"User '{user_id}' not found!")
        print("   Run insert_test_user.py first")
        cur.close()
        conn.close()
        return
    
    print(f"Found user: {user[0]}")
    print(f"   Project: {user[1][:80]}...")
    
    # 2. Check grants exist
    print(f"\n2. Checking grants in database...")
    cur.execute("SELECT COUNT(*) FROM FUND_DB.PUBLIC.GRANTS")
    grant_count = cur.fetchone()[0]
    
    if grant_count == 0:
        print("No grants found in database!")
        print("   Run the scraper and uploader first:")
        print("   python run_full_pipeline.py")
        cur.close()
        conn.close()
        return
    
    print(f"Found {grant_count} grants in database")
    
    # 3. Test matching
    print(f"\n3. Running matching algorithm...")
    try:
        matches = match_user_to_grants(user_id, limit=5)
        
        if not matches:
            print("No matches found")
            print("   This might mean:")
            print("   - Grant data doesn't match user profile")
            print("   - Gemini API key is not configured")
        else:
            print(f"Found {len(matches)} matches!\n")
            print("="*70)
            print("TOP MATCHES")
            print("="*70)
            
            for i, match in enumerate(matches, 1):
                print(f"\n{i}. {match['program_name']}")
                print(f"   Score: {match['score']}")
                print(f"   Funding: ${match['funding_low']} - ${match['funding_high']}")
                print(f"   URL: {match['url']}")
                if match.get('description'):
                    print(f"   Description: {match['description'][:100]}...")
    
    except Exception as e:
        print(f"Matching failed: {e}")
        import traceback
        traceback.print_exc()
    
    cur.close()
    conn.close()
    
    print("\n" + "="*70)
    print("TEST COMPLETE")
    print("="*70)

if __name__ == "__main__":
    test_matching()