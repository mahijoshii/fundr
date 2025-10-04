import requests
from datetime import datetime

BASE_URL = "https://open.canada.ca/data/en/api/3/action/datastore_search"
RESOURCE_ID = "1d15a62f-5656-49ad-8c88-f40ce689d831"

import requests
from datetime import datetime

def fetch_active_grants(limit=200, query=None):
    active = []
    offset = 0
    today = datetime.today().date()

    while len(active) < 10 and offset < 1000:      # stop after 1 000 rows
        params = {
            "resource_id": RESOURCE_ID,
            "limit": limit,
            "offset": offset,
            "sort": "agreement_end_date desc"
        }
        if query:
            params["q"] = query

        res = requests.get(BASE_URL, params=params).json()
        if not res.get("success"):
            break

        for r in res["result"]["records"]:
            end_str = r.get("agreement_end_date")
            if not end_str:
                continue
            try:
                end_date = datetime.strptime(end_str, "%Y-%m-%d").date()
            except Exception:
                continue
            # if end_date >= today:
            active.append({
                "recipient": r.get("recipient_legal_name"),
                "program": r.get("prog_name_en"),
                "title": r.get("agreement_title_en"),
                "value": r.get("agreement_value"),
                "start_date": r.get("agreement_start_date"),
                "end_date": end_str,
                "description": r.get("description_en")
            })
        offset += limit

    return active

