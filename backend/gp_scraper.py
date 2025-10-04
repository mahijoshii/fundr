from playwright.sync_api import sync_playwright
import pandas as pd
from datetime import datetime
import re
import time

BASE_URL = "https://ontario-canada.thegrantportal.com"

def clean_text(text):
    """Remove extra whitespace and clean text"""
    if not text:
        return None
    return re.sub(r'\s+', ' ', text).strip()

def extract_grant_details(detail_page):
    """Extract grant details from the detail page"""
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
        # Extract title (h1)
        if detail_page.locator("h1").count() > 0:
            details["title"] = clean_text(detail_page.locator("h1").first.inner_text())
        
        # Extract GrantID
        grant_id_elem = detail_page.locator("text=/GrantID:/i").first
        if grant_id_elem.count() > 0:
            grant_id_text = grant_id_elem.inner_text()
            details["grant_id"] = clean_text(grant_id_text.replace("GrantID:", "").strip())
        
        # Extract Funding Amount Low
        funding_low_elem = detail_page.locator("text=/Grant Funding Amount Low:/i")
        if funding_low_elem.count() > 0:
            funding_text = funding_low_elem.first.inner_text()
            # Extract just the dollar amount
            match = re.search(r'\$[\d,]+', funding_text)
            if match:
                details["funding_low"] = match.group()
        
        # Extract Funding Amount High
        funding_high_elem = detail_page.locator("text=/Grant Amount High:|Funding Amount High:/i")
        if funding_high_elem.count() > 0:
            funding_text = funding_high_elem.first.inner_text()
            # Extract just the dollar amount or "Open"
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
        
        # Extract Summary section
        summary_heading = detail_page.locator("h4:has-text('Summary'), h3:has-text('Summary')")
        if summary_heading.count() > 0:
            # Get the parent div and find the following paragraph
            parent = summary_heading.first.locator("xpath=ancestor::div[contains(@class, 'pt-')]")
            if parent.count() > 0:
                # Get all text content after the Summary heading
                paragraphs = parent.locator("p, div.text-sm")
                summary_parts = []
                for i in range(paragraphs.count()):
                    text = clean_text(paragraphs.nth(i).inner_text())
                    if text and len(text) > 20:
                        summary_parts.append(text)
                if summary_parts:
                    details["summary"] = " ".join(summary_parts)
        
        # Extract Interests section
        interests_heading = detail_page.locator("h4:has-text('Interests'), h3:has-text('Interests')")
        if interests_heading.count() > 0:
            parent = interests_heading.first.locator("xpath=ancestor::div[contains(@class, 'pt-')]")
            if parent.count() > 0:
                # Get all checked items (checkboxes with checked attribute)
                checkboxes = parent.locator("input[type='checkbox'][checked]")
                interests = []
                for i in range(checkboxes.count()):
                    # Get the label associated with the checkbox
                    checkbox = checkboxes.nth(i)
                    label = checkbox.locator("xpath=following-sibling::text()")
                    if label.count() > 0:
                        label_text = label.first.text_content()
                    else:
                        # Try getting parent label
                        parent_label = checkbox.locator("xpath=..")
                        label_text = parent_label.inner_text() if parent_label.count() > 0 else None
                    if label_text:
                        interests.append(clean_text(label_text))
                
                # Alternative: look for labels near checkboxes
                if not interests:
                    labels = parent.locator("label")
                    for i in range(labels.count()):
                        label = labels.nth(i)
                        # Check if the checkbox inside is checked
                        checkbox_in_label = label.locator("input[type='checkbox']")
                        if checkbox_in_label.count() > 0:
                            try:
                                is_checked = checkbox_in_label.first.is_checked()
                                if is_checked:
                                    text = clean_text(label.inner_text())
                                    if text:
                                        interests.append(text)
                            except:
                                continue
                
                if interests:
                    details["interests"] = "; ".join(interests)
        
        # Extract Eligible Requirements section
        eligible_heading = detail_page.locator("h4:has-text('Eligible Requirements'), h3:has-text('Eligible Requirements')")
        if eligible_heading.count() > 0:
            parent = eligible_heading.first.locator("xpath=ancestor::div[contains(@class, 'pt-')]")
            if parent.count() > 0:
                # Get all checked eligibility items
                labels = parent.locator("label")
                eligible_items = []
                for i in range(labels.count()):
                    label = labels.nth(i)
                    checkbox_in_label = label.locator("input[type='checkbox']")
                    if checkbox_in_label.count() > 0:
                        try:
                            is_checked = checkbox_in_label.first.is_checked()
                            if is_checked:
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
                details["application_link"] = href if href.startswith("http") else BASE_URL + href
        
    except Exception as e:
        print(f"    Error extracting details: {e}")
    
    return details

def scrape_grantportal(pages=1, headless=True):
    """
    Scrape grants from The Grant Portal
    
    Args:
        pages: Number of pages to scrape
        headless: Run browser in headless mode (False to see browser)
    """
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
            print(f"\n{'='*60}")
            print(f"Scraping page {page_num}: {url}")
            print(f"{'='*60}")
            
            try:
                page.goto(url, timeout=60000, wait_until="domcontentloaded")
                page.wait_for_selector("div.p-2", timeout=15000)
            except Exception as e:
                print(f"Failed to load page {page_num}: {e}")
                continue
            
            # Find all grant cards
            cards = page.locator("div.p-2")
            card_count = cards.count()
            print(f"Found {card_count} grants on this page\n")
            
            for card_idx in range(card_count):
                try:
                    card = cards.nth(card_idx)
                    
                    # Extract card title
                    card_title = None
                    title_elem = card.locator(".text-xs.lg\\:text-lg, h3, h2")
                    if title_elem.count() > 0:
                        card_title = clean_text(title_elem.first.inner_text())
                    
                    # Extract card description (first paragraph)
                    card_desc = None
                    desc_elem = card.locator("p")
                    if desc_elem.count() > 0:
                        card_desc = clean_text(desc_elem.first.inner_text())
                    
                    # Extract TGP Grant ID from card
                    card_grant_id = None
                    id_elem = card.locator("text=/TGP Grant ID/i")
                    if id_elem.count() > 0:
                        id_text = id_elem.first.inner_text()
                        match = re.search(r'\d+', id_text)
                        if match:
                            card_grant_id = match.group()
                    
                    # Find "View Grant" link
                    view_grant_link = None
                    view_btn = card.locator("a:has-text('View Grant')")
                    if view_btn.count() > 0:
                        href = view_btn.first.get_attribute("href")
                        if href:
                            view_grant_link = href if href.startswith("http") else BASE_URL + href
                    
                    print(f"[{card_idx + 1}/{card_count}] {card_title[:60]}...")
                    
                    # Initialize with card data
                    grant_data = {
                        "program_name": card_title,
                        "description": card_desc,
                        "grant_id": card_grant_id,
                        "deadline": None,
                        "funding_low": None,
                        "funding_high": None,
                        "interests": None,
                        "eligibility": None,
                        "summary": None,
                        "application_link": None,
                        "url": view_grant_link,
                        "scraped_at": datetime.utcnow().isoformat()
                    }
                    
                    # Scrape detail page if link exists
                    if view_grant_link:
                        detail_page = context.new_page()
                        try:
                            detail_page.goto(view_grant_link, timeout=60000, wait_until="domcontentloaded")
                            detail_page.wait_for_selector("h1", timeout=10000)
                            
                            # Extract all details
                            details = extract_grant_details(detail_page)
                            
                            # Update grant_data with details (detail page data overrides card data)
                            if details["title"]:
                                grant_data["program_name"] = details["title"]
                            if details["grant_id"]:
                                grant_data["grant_id"] = details["grant_id"]
                            if details["funding_low"]:
                                grant_data["funding_low"] = details["funding_low"]
                            if details["funding_high"]:
                                grant_data["funding_high"] = details["funding_high"]
                            if details["deadline"]:
                                grant_data["deadline"] = details["deadline"]
                            if details["summary"]:
                                grant_data["summary"] = details["summary"]
                            if details["interests"]:
                                grant_data["interests"] = details["interests"]
                            if details["eligibility"]:
                                grant_data["eligibility"] = details["eligibility"]
                            if details["application_link"]:
                                grant_data["application_link"] = details["application_link"]
                            
                            print(f"    ✓ Eligibility: {details['eligibility'][:80] if details['eligibility'] else 'N/A'}")
                            
                        except Exception as e:
                            print(f"    ✗ Failed to scrape details: {e}")
                        finally:
                            detail_page.close()
                            time.sleep(0.5)  # Small delay between requests
                    
                    data.append(grant_data)
                    
                except Exception as e:
                    print(f"    ✗ Error processing card {card_idx + 1}: {e}")
                    continue
            
            # Small delay between pages
            if page_num < pages:
                time.sleep(1)
        
        browser.close()
    
    # Create DataFrame and save
    df = pd.DataFrame(data)
    output_file = "grantportal_complete.csv"
    df.to_csv(output_file, index=False)
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"SCRAPING COMPLETE")
    print(f"{'='*60}")
    print(f"Total grants scraped: {len(df)}")
    print(f"Grants with eligibility: {df['eligibility'].notna().sum()} ({df['eligibility'].notna().sum()/len(df)*100:.1f}%)")
    print(f"Grants with summary: {df['summary'].notna().sum()} ({df['summary'].notna().sum()/len(df)*100:.1f}%)")
    print(f"Grants with interests: {df['interests'].notna().sum()} ({df['interests'].notna().sum()/len(df)*100:.1f}%)")
    print(f"Output saved to: {output_file}")
    
    # Show sample
    if len(df) > 0:
        print(f"\n{'='*60}")
        print("SAMPLE GRANT:")
        print(f"{'='*60}")
        sample = df.iloc[0]
        for key, value in sample.items():
            if value and key != "scraped_at":
                print(f"\n{key.upper()}:")
                print(f"  {str(value)[:200]}{'...' if str(value) and len(str(value)) > 200 else ''}")
    
    return df

if __name__ == "__main__":
    # Start with 1 page for testing, set headless=False to watch the browser
    df = scrape_grantportal(pages=5, headless=True)