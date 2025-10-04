"""
Complete Ontario Grants Pipeline
Run this to scrape all sources and upload to Snowflake in one command

IMPORTANT: Make sure you have these files in the same directory:
1. This file (run_full_pipeline.py)
2. consolidated_scraper.py (the main scraper)
3. snowflake_uploader.py (the upload script)
"""

import sys
import os
from datetime import datetime
import subprocess

def run_scraper():
    """Run the consolidated scraper"""
    print("="*70)
    print("STEP 1: Running Consolidated Scraper")
    print("="*70)
    
    # Check if scraper file exists
    if not os.path.exists('consolidated_scraper.py'):
        print("✗ Error: consolidated_scraper.py not found!")
        print("  Please save the consolidated scraper artifact as 'consolidated_scraper.py'")
        return None
    
    try:
        # Run as subprocess to avoid import issues
        result = subprocess.run(
            [sys.executable, 'consolidated_scraper.py'],
            capture_output=True,
            text=True
        )
        
        print(result.stdout)
        if result.stderr:
            print(result.stderr)
        
        if result.returncode != 0:
            print("✗ Scraper failed")
            return None
        
        # Find the generated CSV file
        import glob
        csv_files = glob.glob("ontario_grants_consolidated_*.csv")
        if csv_files:
            latest_csv = max(csv_files, key=os.path.getctime)
            print(f"\n✓ Scraping complete: {latest_csv}")
            return latest_csv
        else:
            print("✗ No CSV file generated")
            return None
            
    except Exception as e:
        print(f"✗ Error running scraper: {e}")
        return None

def run_uploader(csv_file):
    """Run the Snowflake uploader"""
    print("\n" + "="*70)
    print("STEP 2: Uploading to Snowflake")
    print("="*70)
    
    # Check if uploader file exists
    if not os.path.exists('snowflake_uploader.py'):
        print("✗ Error: snowflake_uploader.py not found!")
        print("  Please save the upload script artifact as 'snowflake_uploader.py'")
        return False
    
    try:
        # Run as subprocess
        result = subprocess.run(
            [sys.executable, 'snowflake_uploader.py', csv_file],
            capture_output=True,
            text=True
        )
        
        print(result.stdout)
        if result.stderr:
            print(result.stderr)
        
        if result.returncode != 0:
            print("✗ Upload failed")
            return False
        
        print("\n✓ Upload complete")
        return True
        
    except Exception as e:
        print(f"✗ Error running uploader: {e}")
        return False

def main():
    start_time = datetime.now()
    
    print("\n" + "="*70)
    print("ONTARIO GRANTS - FULL PIPELINE")
    print("="*70)
    print(f"Started: {start_time.strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Step 1: Scrape
    csv_file = run_scraper()
    if not csv_file:
        print("\n✗ Pipeline failed at scraping step")
        sys.exit(1)
    
    # Step 2: Upload
    upload_success = run_uploader(csv_file)
    if not upload_success:
        print(f"\n⚠ Upload failed, but CSV is saved: {csv_file}")
        print("  You can upload manually using snowflake_uploader.py")
        sys.exit(1)
    
    # Complete
    end_time = datetime.now()
    duration = end_time - start_time
    
    print("\n" + "="*70)
    print("PIPELINE COMPLETE ✓")
    print("="*70)
    print(f"Started:  {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Finished: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Duration: {duration}")
    print(f"Data file: {csv_file}")
    print("="*70)

if __name__ == "__main__":
    main()