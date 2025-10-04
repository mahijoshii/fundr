import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
import time

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; FundrBot/1.0; +https://fundr.app)"}

GRANT_URLS = [
    "https://otf.ca/our-grants/community-investments-grants/seed-grant",
    "https://otf.ca/our-grants/community-investments-grants/grow-grant",
    "https://otf.ca/our-grants/community-investments-grants/capital-grant",
    "https://otf.ca/our-grants/youth-opportunities-fund",
    # You had duplicates in your list — remove/keep as needed
]

def scrape_otf_grant(url):
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "lxml")

    grant = {"url": url, "scraped_at": datetime.utcnow().isoformat()}

    # 1. Title
    title = soup.find("h1")
    grant["program_name"] = title.get_text(strip=True) if title else None

    # 2. Grant Info Table (Deadline, Term length, Amount)
    for wrapper in soup.select("section.grant_info div.grant_info_wrapper"):
        label = wrapper.select_one(".grant_info_label")
        value = wrapper.select_one(".grant_info_content")
        if label and value:
            key = label.get_text(strip=True).lower().replace(" ", "_")
            grant[key] = value.get_text(" ", strip=True)

    # 3. Descriptive sections (purpose, eligibility, etc.)
    for section in soup.select("section"):
        h3 = section.find("h3")
        if not h3:
            continue
        key = h3.get_text(strip=True).lower().replace(" ", "_")
        text = " ".join(p.get_text(" ", strip=True) for p in section.find_all(["p", "li"]))
        if text:
            grant[key] = text

    return grant


def run_scraper():
    all_data = []
    for i, url in enumerate(GRANT_URLS, 1):
        print(f"[{i}/{len(GRANT_URLS)}] Scraping {url}")
        try:
            data = scrape_otf_grant(url)
            all_data.append(data)
        except Exception as e:
            print(f"❌ Error scraping {url}: {e}")
        time.sleep(1)

    df = pd.DataFrame(all_data)
    df.to_csv("otf_grants.csv", index=False)
    print(f"✅ Saved {len(df)} grants to otf_grants.csv")


if __name__ == "__main__":
    run_scraper()
