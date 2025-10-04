import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime

def crawl_ontario_government():
    url = "https://www.ontario.ca/page/available-funding-opportunities-ontario-government"
    r = requests.get(url)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "lxml")

    grants = []
    for header in soup.find_all("h2"):
        program_name = header.get_text(strip=True)
        if not program_name or "Overview" in program_name or "Closed funding" in program_name:
            continue

        # Collect siblings until next h2 (the grant section block)
        block = []
        for sib in header.find_next_siblings():
            if sib.name == "h2":
                break
            block.append(sib)

        # Parse each <h3> subsection in this block
        details = {"program_name": program_name, "url": url, "scraped_at": datetime.utcnow().isoformat()}
        for h3 in [b for b in block if b.name == "h3"]:
            key = h3.get_text(strip=True).lower()
            # Gather all text until next <h3> or <h2>
            texts = []
            for sib in h3.find_next_siblings():
                if sib.name in ["h3", "h2"]:
                    break
                texts.append(sib.get_text(" ", strip=True))
            details[key] = " ".join(texts).strip()

        grants.append(details)

    return grants


if __name__ == "__main__":
    data = crawl_ontario_government()
    df = pd.DataFrame(data)
    df.to_csv("ontario_funding_clean.csv", index=False)
    print(f"✅ Extracted {len(df)} programs into ontario_funding_clean.csv")
