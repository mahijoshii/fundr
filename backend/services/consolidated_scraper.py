"""
Consolidated Grant Scraper for Ontario
Scrapes from three sources:
1. The Grant Portal (ontario-canada.thegrantportal.com)
2. Ontario Government Website
3. Ontario Trillium Foundation (OTF)

Outputs a single CSV with standardized columns for Snowflake upload.
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
from playwright.sync_api import sync_playwright
import re
import time

# ============================================================================
# STANDARDIZED SCHEMA
# ============================================================================
STANDARD_COLUMNS = [
    "program_name",
    "description",
    "deadline",
    "funding_low",
    "funding_high",
    "eligibility",
    "interests",
    "application_link",
    "url",
    "source",
    "scraped_at"
]

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def clean_text(text):
    """Remove extra whitespace and clean text"""
    if not text:
        return None
    return re.sub(r'\s+', ' ', text).strip()

def standardize_grant(grant_dict, source):
    """Convert any grant dict to standard schema"""
    standardized = {col: None for col in STANDARD_COLUMNS}
    
    # Map common fields
    if "program_name" in grant_dict:
        standardized["program_name"] = grant_dict["program_name"]
    elif "title" in grant_dict:
        standardized["program_name"] = grant_dict["title"]
    
    standardized["description"] = grant_dict.get("description") or grant_dict.get("summary")
    standardized["deadline"] = grant_dict.get("deadline")
    standardized["funding_low"] = grant_dict.get("funding_low")
    standardized["funding_high"] = grant_dict.get("funding_high")
    standardized["eligibility"] = grant_dict.get("eligibility")
    standardized["interests"] = grant_dict.get("interests")
    standardized["application_link"] = grant_dict.get("application_link")
    standardized["url"] = grant_dict.get("url")
    standardized["source"] = source
    standardized["scraped_at"] = grant_dict.get("scraped_at", datetime.utcnow().isoformat())
    
    return standardized

# ============================================================================
# SOURCE 1: THE GRANT PORTAL (Playwright)
# ============================================================================

def extract_grant_details(detail_page):
    """Extract grant details from The Grant Portal detail page"""
    details = {
        "title": None,
        "grant_id": None,
        "funding_low": None,
        "funding_high": None,
        "deadline": None,
        "summary": None,
        "interests": None,
        "eligibility": None,
        "application_link": None
    }
    
    try:
        # Extract title
        if detail_page.locator("h1").count() > 0:
            details["title"] = clean_text(detail_page.locator("h1").first.inner_text())
        
        # Extract GrantID
        grant_id_elem = detail_page.locator("text=/GrantID:/i")
        if grant_id_elem.count() > 0:
            grant_id_text = grant_id_elem.first.inner_text()
            details["grant_id"] = clean_text(grant_id_text.replace("GrantID:", "").strip())
        
        # Extract Funding Amount Low
        funding_low_elem = detail_page.locator("text=/Grant Funding Amount Low:/i")
        if funding_low_elem.count() > 0:
            funding_text = funding_low_elem.first.inner_text()
            match = re.search(r'\$[\d,]+', funding_text)
            if match:
                details["funding_low"] = match.group()
        
        # Extract Funding Amount High
        funding_high_elem = detail_page.locator("text=/Grant Amount High:|Funding Amount High:/i")
        if funding_high_elem.count() > 0:
            funding_text = funding_high_elem.first.inner_text()
            if "Open" in funding_text:
                details["funding_high"] = "Open"
            else:
                match = re.search(r'\$[\d,]+', funding_text)
                if match:
                    details["funding_high"] = match.group()
        
        # Extract Deadline
        deadline_elem = detail_page.locator("text=/Deadline:/i")
        if deadline_elem.count() > 0:
            deadline_text = deadline_elem.first.inner_text()
            details["deadline"] = clean_text(deadline_text.replace("Deadline:", "").strip())
        
        # Extract Summary
        summary_heading = detail_page.locator("h4:has-text('Summary'), h3:has-text('Summary')")
        if summary_heading.count() > 0:
            parent = summary_heading.first.locator("xpath=ancestor::div[contains(@class, 'pt-')]")
            if parent.count() > 0:
                paragraphs = parent.locator("p, div.text-sm")
                summary_parts = []
                for i in range(paragraphs.count()):
                    text = clean_text(paragraphs.nth(i).inner_text())
                    if text and len(text) > 20:
                        summary_parts.append(text)
                if summary_parts:
                    details["summary"] = " ".join(summary_parts)
        
        # Extract Interests
        interests_heading = detail_page.locator("h4:has-text('Interests'), h3:has-text('Interests')")
        if interests_heading.count() > 0:
            parent = interests_heading.first.locator("xpath=ancestor::div[contains(@class, 'pt-')]")
            if parent.count() > 0:
                labels = parent.locator("label")
                interests = []
                for i in range(labels.count()):
                    label = labels.nth(i)
                    checkbox = label.locator("input[type='checkbox']")
                    if checkbox.count() > 0:
                        try:
                            if checkbox.first.is_checked():
                                text = clean_text(label.inner_text())
                                if text:
                                    interests.append(text)
                        except:
                            continue
                if interests:
                    details["interests"] = "; ".join(interests)
        
        # Extract Eligibility
        eligible_heading = detail_page.locator("h4:has-text('Eligible Requirements'), h3:has-text('Eligible Requirements')")
        if eligible_heading.count() > 0:
            parent = eligible_heading.first.locator("xpath=ancestor::div[contains(@class, 'pt-')]")
            if parent.count() > 0:
                labels = parent.locator("label")
                eligible_items = []
                for i in range(labels.count()):
                    label = labels.nth(i)
                    checkbox = label.locator("input[type='checkbox']")
                    if checkbox.count() > 0:
                        try:
                            if checkbox.first.is_checked():
                                text = clean_text(label.inner_text())
                                if text:
                                    eligible_items.append(text)
                        except:
                            continue
                if eligible_items:
                    details["eligibility"] = "; ".join(eligible_items)
        
        # Extract Application Link
        apply_button = detail_page.locator("a:has-text('Grant Application'), a:has-text('Apply Here')")
        if apply_button.count() > 0:
            href = apply_button.first.get_attribute("href")
            if href:
                details["application_link"] = href if href.startswith("http") else f"https://ontario-canada.thegrantportal.com{href}"
        
    except Exception as e:
        print(f"    Error extracting details: {e}")
    
    return details

def scrape_grant_portal(pages=5, headless=True):
    """Scrape The Grant Portal"""
    print("\n" + "="*70)
    print("SCRAPING: THE GRANT PORTAL")
    print("="*70)
    
    BASE_URL = "https://ontario-canada.thegrantportal.com"
    data = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = context.new_page()

        for page_num in range(1, pages + 1):
            url = f"{BASE_URL}/?page={page_num}"
            print(f"\nPage {page_num}/{pages}: {url}")
            
            try:
                page.goto(url, timeout=60000, wait_until="domcontentloaded")
                page.wait_for_selector("div.p-2", timeout=15000)
            except Exception as e:
                print(f"  Failed to load page: {e}")
                continue
            
            cards = page.locator("div.p-2")
            card_count = cards.count()
            print(f"  Found {card_count} grants")
            
            for card_idx in range(card_count):
                try:
                    card = cards.nth(card_idx)
                    
                    # Extract card info
                    card_title = None
                    title_elem = card.locator(".text-xs.lg\\:text-lg, h3, h2")
                    if title_elem.count() > 0:
                        card_title = clean_text(title_elem.first.inner_text())
                    
                    card_desc = None
                    desc_elem = card.locator("p")
                    if desc_elem.count() > 0:
                        card_desc = clean_text(desc_elem.first.inner_text())
                    
                    # Get detail page link
                    view_grant_link = None
                    view_btn = card.locator("a:has-text('View Grant')")
                    if view_btn.count() > 0:
                        href = view_btn.first.get_attribute("href")
                        if href:
                            view_grant_link = href if href.startswith("http") else BASE_URL + href
                    
                    # Initialize grant data
                    grant_data = {
                        "program_name": card_title,
                        "description": card_desc,
                        "url": view_grant_link,
                        "scraped_at": datetime.utcnow().isoformat()
                    }
                    
                    # Scrape detail page
                    if view_grant_link:
                        detail_page = context.new_page()
                        try:
                            detail_page.goto(view_grant_link, timeout=60000, wait_until="domcontentloaded")
                            detail_page.wait_for_selector("h1", timeout=10000)
                            
                            details = extract_grant_details(detail_page)
                            
                            # Update with detail info
                            grant_data.update({
                                "program_name": details["title"] or card_title,
                                "description": details["summary"] or card_desc,
                                "funding_low": details["funding_low"],
                                "funding_high": details["funding_high"],
                                "deadline": details["deadline"],
                                "interests": details["interests"],
                                "eligibility": details["eligibility"],
                                "application_link": details["application_link"]
                            })
                            
                        except Exception as e:
                            print(f"    Failed detail page: {e}")
                        finally:
                            detail_page.close()
                            time.sleep(0.3)
                    
                    data.append(grant_data)
                    
                except Exception as e:
                    print(f"    Error on card {card_idx + 1}: {e}")
                    continue
            
            time.sleep(1)
        
        browser.close()
    
    print(f"\n  Total scraped: {len(data)} grants")
    return data

# ============================================================================
# SOURCE 2: ONTARIO GOVERNMENT (Requests + BeautifulSoup)
# ============================================================================

def scrape_ontario_government():
    """Scrape Ontario Government funding page"""
    print("\n" + "="*70)
    print("SCRAPING: ONTARIO GOVERNMENT")
    print("="*70)
    
    url = "https://www.ontario.ca/page/available-funding-opportunities-ontario-government"
    
    try:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")
    except Exception as e:
        print(f"  Failed to load page: {e}")
        return []

    grants = []
    for header in soup.find_all("h2"):
        program_name = header.get_text(strip=True)
        if not program_name or "Overview" in program_name or "Closed funding" in program_name:
            continue

        # Collect siblings until next h2
        block = []
        for sib in header.find_next_siblings():
            if sib.name == "h2":
                break
            block.append(sib)

        # Parse each h3 subsection
        details = {
            "program_name": program_name,
            "url": url,
            "scraped_at": datetime.utcnow().isoformat()
        }
        
        for h3 in [b for b in block if b.name == "h3"]:
            key = h3.get_text(strip=True).lower()
            texts = []
            for sib in h3.find_next_siblings():
                if sib.name in ["h3", "h2"]:
                    break
                texts.append(sib.get_text(" ", strip=True))
            content = " ".join(texts).strip()
            
            # Map to standard fields
            if "eligibility" in key or "who can apply" in key:
                details["eligibility"] = content
            elif "description" in key or "overview" in key or "about" in key:
                details["description"] = content
            elif "deadline" in key or "when to apply" in key:
                details["deadline"] = content
            elif "amount" in key or "funding" in key:
                # Try to extract funding amounts
                amounts = re.findall(r'\$[\d,]+', content)
                if amounts:
                    details["funding_low"] = amounts[0] if len(amounts) > 0 else None
                    details["funding_high"] = amounts[-1] if len(amounts) > 1 else amounts[0]
            elif "apply" in key or "application" in key:
                details["application_link"] = content
            else:
                details[key] = content

        grants.append(details)

    print(f"\n  Total scraped: {len(grants)} grants")
    return grants

# ============================================================================
# SOURCE 3: ONTARIO TRILLIUM FOUNDATION (Requests + BeautifulSoup)
# ============================================================================

def scrape_otf():
    """Scrape Ontario Trillium Foundation grants"""
    print("\n" + "="*70)
    print("SCRAPING: ONTARIO TRILLIUM FOUNDATION")
    print("="*70)
    
    HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; GrantBot/1.0)"}
    GRANT_URLS = [
        "https://otf.ca/our-grants/community-investments-grants/seed-grant",
        "https://otf.ca/our-grants/community-investments-grants/grow-grant",
        "https://otf.ca/our-grants/community-investments-grants/capital-grant",
        "https://otf.ca/our-grants/youth-opportunities-fund",
    ]

    all_data = []
    for i, url in enumerate(GRANT_URLS, 1):
        print(f"\n  [{i}/{len(GRANT_URLS)}] {url}")
        try:
            r = requests.get(url, headers=HEADERS, timeout=30)
            r.raise_for_status()
            soup = BeautifulSoup(r.text, "lxml")

            grant = {"url": url, "scraped_at": datetime.utcnow().isoformat()}

            # Title
            title = soup.find("h1")
            grant["program_name"] = title.get_text(strip=True) if title else None

            # Grant info table
            for wrapper in soup.select("section.grant_info div.grant_info_wrapper"):
                label = wrapper.select_one(".grant_info_label")
                value = wrapper.select_one(".grant_info_content")
                if label and value:
                    key = label.get_text(strip=True).lower()
                    val = value.get_text(" ", strip=True)
                    
                    if "deadline" in key:
                        grant["deadline"] = val
                    elif "amount" in key or "funding" in key:
                        # Extract amounts
                        amounts = re.findall(r'\$[\d,]+', val)
                        if amounts:
                            grant["funding_low"] = amounts[0] if len(amounts) > 0 else None
                            grant["funding_high"] = amounts[-1] if len(amounts) > 1 else amounts[0]
                    else:
                        grant[key.replace(" ", "_")] = val

            # Descriptive sections
            for section in soup.select("section"):
                h3 = section.find("h3")
                if not h3:
                    continue
                key = h3.get_text(strip=True).lower()
                text = " ".join(p.get_text(" ", strip=True) for p in section.find_all(["p", "li"]))
                
                if text:
                    if "eligibility" in key or "who can apply" in key:
                        grant["eligibility"] = text
                    elif "purpose" in key or "description" in key:
                        grant["description"] = text
                    elif "apply" in key:
                        grant["application_link"] = text
                    else:
                        grant[key.replace(" ", "_")] = text

            all_data.append(grant)
            time.sleep(1)
            
        except Exception as e:
            print(f"    Error: {e}")

    print(f"\n  Total scraped: {len(all_data)} grants")
    return all_data

# ============================================================================
# MAIN CONSOLIDATION FUNCTION
# ============================================================================

def scrape_all_sources(grant_portal_pages=5, headless=True):
    """
    Scrape all three sources and consolidate into single CSV
    
    Args:
        grant_portal_pages: Number of pages to scrape from Grant Portal
        headless: Run browser in headless mode
    """
    print("\n" + "="*70)
    print("CONSOLIDATED ONTARIO GRANT SCRAPER")
    print("="*70)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    all_grants = []
    
    # Source 1: The Grant Portal
    try:
        gp_grants = scrape_grant_portal(pages=grant_portal_pages, headless=headless)
        all_grants.extend([standardize_grant(g, "The Grant Portal") for g in gp_grants])
    except Exception as e:
        print(f"\nFailed to scrape Grant Portal: {e}")
    
    # Source 2: Ontario Government
    try:
        gov_grants = scrape_ontario_government()
        all_grants.extend([standardize_grant(g, "Ontario Government") for g in gov_grants])
    except Exception as e:
        print(f"\nFailed to scrape Ontario Government: {e}")
    
    # Source 3: Ontario Trillium Foundation
    try:
        otf_grants = scrape_otf()
        all_grants.extend([standardize_grant(g, "Ontario Trillium Foundation") for g in otf_grants])
    except Exception as e:
        print(f"\nFailed to scrape OTF: {e}")
    
    # Create DataFrame with standardized columns
    df = pd.DataFrame(all_grants, columns=STANDARD_COLUMNS)
    
    # Save to CSV
    output_file = f"ontario_grants_consolidated_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    df.to_csv(output_file, index=False)
    
    # Print summary
    print("\n" + "="*70)
    print("CONSOLIDATION COMPLETE")
    print("="*70)
    print(f"Total grants scraped: {len(df)}")
    print(f"\nBreakdown by source:")
    print(df['source'].value_counts().to_string())
    print(f"\nData completeness:")
    print(f"  - With eligibility: {df['eligibility'].notna().sum()} ({df['eligibility'].notna().sum()/len(df)*100:.1f}%)")
    print(f"  - With description: {df['description'].notna().sum()} ({df['description'].notna().sum()/len(df)*100:.1f}%)")
    print(f"  - With deadline: {df['deadline'].notna().sum()} ({df['deadline'].notna().sum()/len(df)*100:.1f}%)")
    print(f"  - With funding info: {(df['funding_low'].notna() | df['funding_high'].notna()).sum()} ({(df['funding_low'].notna() | df['funding_high'].notna()).sum()/len(df)*100:.1f}%)")
    print(f"\nOutput saved to: {output_file}")
    
    return df

# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    # Configure your scrape here
    df = scrape_all_sources(
        grant_portal_pages=5,  # Number of pages from Grant Portal
        headless=True          # Set to False to watch the browser
    )
    
    # Display sample records
    print("\n" + "="*70)
    print("SAMPLE RECORDS (first 3 grants):")
    print("="*70)
    for idx in range(min(3, len(df))):
        print(f"\n--- Grant {idx + 1} ---")
        record = df.iloc[idx]
        for col in STANDARD_COLUMNS:
            if record[col]:
                val = str(record[col])
                print(f"{col}: {val[:100]}{'...' if len(val) > 100 else ''}")