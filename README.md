# Fundr

**Find the money that finds you.**

Fundr is an AI-powered grant matching platform that connects users with relevant funding opportunities through personalized recommendations. Built for hackathon demonstration purposes, it showcases semantic search, web scraping, and intelligent matching algorithms.

---

## Overview

Fundr helps users discover grants and subsidies they're eligible for by:
- Creating personalized user profiles with demographic and project information
- Scraping grant data from multiple Ontario sources
- Using AI embeddings to semantically match users with relevant opportunities
- Providing a swipe-based interface for browsing matches

---

## Features

- **Smart Matching**: AI-powered semantic search using Google Gemini embeddings
- **Swipe Interface**: Tinder-style card UI for browsing grant opportunities
- **Profile Management**: Comprehensive user profiles with demographic targeting
- **Grant Search**: Browse all available grants with filtering
- **AI Chatbot**: Voiceflow-powered assistant for grant questions
- **Multi-Source Scraping**: Automated data collection from 3+ grant sources
- **Personalized Recommendations**: Matching based on eligibility, demographics, and project goals

---

## Tech Stack

### Frontend
- **React Native** with **Expo** - Cross-platform mobile development
- **TypeScript** - Type-safe JavaScript
- **Expo Router** - File-based navigation
- **React Native Deck Swiper** - Card swipe UI
- **AsyncStorage** - Local data persistence
- **Expo Haptics** - Touch feedback

### Backend
- **FastAPI** - Modern Python web framework
- **Snowflake** - Cloud data warehouse
- **Google Gemini API** - AI embeddings for semantic matching
- **Voiceflow** - Conversational AI chatbot
- **bcrypt** - Password hashing

### Data Collection
- **Playwright** - Browser automation for dynamic sites
- **BeautifulSoup4** - HTML parsing
- **Pandas** - Data processing and CSV handling

### Data Sources
- The Grant Portal (ontario-canada.thegrantportal.com)
- Ontario Government Funding Page
- Ontario Trillium Foundation

---

## Project Structure

```
fundr/
├── frontend/
│   ├── app/
│   │   ├── (tabs)/          # Tab navigation screens
│   │   │   ├── swipe.tsx    # Main swipe interface
│   │   │   ├── matches.tsx  # Saved matches
│   │   │   ├── search.tsx   # Grant search
│   │   │   ├── profile.tsx  # User profile
│   │   │   └── _layout.tsx  # Tab bar + chatbot
│   │   ├── login.tsx        # Authentication
│   │   ├── signup.tsx       # Account creation
│   │   ├── profile.tsx      # Profile setup
│   │   └── _layout.tsx      # Root navigation
│   ├── components/          # Reusable UI components
│   ├── constants/           # Theme and styling
│   └── lib/
│       ├── api.ts           # Backend API calls
│       ├── auth.ts          # Authentication logic
│       └── storage.ts       # Local storage helpers
│
└── backend/
    ├── main.py              # FastAPI app entry point
    ├── routers/
    │   ├── user.py          # User profile endpoints
    │   ├── match.py         # Matching algorithm
    │   ├── eligibility.py   # Eligibility checking
    │   └── ask.py           # Chatbot endpoint
    ├── services/
    │   ├── snowflake_service.py      # Database connection
    │   ├── gemini_service.py         # AI embeddings
    │   ├── matching_service.py       # Core matching logic
    │   ├── consolidated_scraper.py   # Web scraping
    │   └── snowflake_uploader.py     # Data upload
    └── scripts/
        ├── insert_test_user.py       # Test data
        ├── generate_embeddings_with_ratelimit.py  # Precompute embeddings
        └── run_full_pipeline.py      # Full scraping pipeline
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Snowflake account
- Google Gemini API key
- Voiceflow project (optional, for chatbot)

### 1. Clone Repository
```bash
git clone <repository-url>
cd fundr
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers (for scraping)
playwright install chromium

# Create .env file
cp .env.example .env
```

**Configure `.env`:**
```env
SNOWFLAKE_USER=your_username
SNOWFLAKE_PASS=your_password
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_WAREHOUSE=your_warehouse
SNOWFLAKE_DATABASE=FUND_DB
SNOWFLAKE_SCHEMA=PUBLIC
GEMINI_API_KEY=your_gemini_api_key
```

**Initialize Snowflake Database:**
```sql
-- Run in Snowflake console
CREATE DATABASE IF NOT EXISTS FUND_DB;
CREATE SCHEMA IF NOT EXISTS FUND_DB.PUBLIC;

-- Users table will be auto-created on first user signup
-- Grants table will be created by uploader script
```

**Scrape and Upload Grant Data:**
```bash
# Option 1: Run full pipeline (scrape + upload)
python services/run_full_pipeline.py

# Option 2: Manual steps
python services/consolidated_scraper.py  # Creates CSV
python services/snowflake_uploader.py    # Uploads to Snowflake
```

**Generate Embeddings (Required for Matching):**
```bash
python scripts/generate_embeddings_with_ratelimit.py
# This creates grant_embeddings.npy used by matching algorithm
```

**Start Backend Server:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

**Configure `.env`:**
```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000
EXPO_PUBLIC_VOICEFLOW_API_KEY=your_voiceflow_key
EXPO_PUBLIC_VOICEFLOW_PROJECT_ID=your_project_id
```

**Find your local IP:**
- Windows: `ipconfig` (look for IPv4)
- Mac/Linux: `ifconfig` (look for inet)
- Use `10.0.2.2` for Android emulator

**Start Development Server:**
```bash
npx expo start

# Then press:
# 'a' for Android
# 'i' for iOS
# 'w' for web (limited functionality)
```

---

## Usage

### Creating an Account
1. Open the app and tap "Create an account"
2. Enter email, user ID, and password
3. Complete your profile with demographic information
4. System limits to 5 demo accounts

### Finding Grants
1. **Swipe Tab**: View personalized matches
   - Swipe right to save
   - Swipe left to skip
2. **Matches Tab**: View saved grants
3. **Search Tab**: Browse all available grants
4. **Chatbot**: Ask questions about grants and eligibility

### Profile Updates
- Navigate to Profile tab
- Tap "Edit Profile" to update information
- Changes trigger new matching recommendations

---

## API Endpoints

### User Management
- `POST /user/` - Create/update user profile
- `GET /user/{user_id}` - Fetch user profile
- `GET /user/stats` - Get account statistics

### Matching
- `GET /match/{user_id}` - Get personalized matches
- `GET /match/grants/all?limit=20` - Get all grants

### Eligibility
- `POST /eligibility/` - Check eligibility criteria

### Chatbot
- `POST /ask/` - Ask questions (if implemented)

---

## Matching Algorithm

The system uses a hybrid approach combining:

1. **Semantic Similarity** (60-70% weight)
   - User profile embedded via Gemini API
   - Grants pre-embedded and cached
   - Cosine similarity computed

2. **Rule-Based Filters** (30-40% weight)
   - Funding amount overlap
   - Demographic eligibility (student, immigrant, indigenous, veteran, age, gender)
   - Keyword matching in grant descriptions

3. **Score Calculation**
   ```python
   base_score = (cosine_similarity + 1) / 2  # Normalize to 0-1
   demographic_boost = sum of matching criteria (0.05-0.1 each)
   final_score = min(base_score + demographic_boost, 1.0)
   ```

Only grants with `score >= 0.3` are returned, sorted by relevance.

---

## Data Pipeline

```
Web Scraping (Playwright/BeautifulSoup)
    ↓
CSV Generation (consolidated_scraper.py)
    ↓
Snowflake Upload (snowflake_uploader.py)
    ↓
Embedding Generation (generate_embeddings_with_ratelimit.py)
    ↓
Cached Embeddings (grant_embeddings.npy)
    ↓
Real-time Matching (matching_service.py)
```

**Note**: Embeddings only need regeneration when grant data changes.

---

## Known Limitations

- **5 User Demo Limit**: Hardcoded for demonstration
- **Ontario-Focused**: Grant sources are Ontario-specific
- **No Authentication Tokens**: Uses basic session storage
- **Static Embeddings**: Require manual regeneration after data updates
- **Rate Limits**: Gemini API calls limited (1 per user match request)
- **Expo AV Deprecation**: Audio library will need migration in SDK 54

---

## Troubleshooting

### "Network request failed"
- Verify backend is running: `curl http://YOUR_IP:8000`
- Check firewall settings
- Use `10.0.2.2` for Android emulator

### "No matches found"
- Run `python scripts/generate_embeddings_with_ratelimit.py`
- Check grant data exists: `SELECT COUNT(*) FROM FUND_DB.PUBLIC.GRANTS`
- Verify Gemini API key is set

### "User limit reached"
- Clear Snowflake users: `DELETE FROM FUND_DB.PUBLIC.USERS`
- Or increase `MAX_USERS` in `routers/user.py`

### Scraper Errors
- Install Playwright browsers: `playwright install chromium`
- Check target websites are accessible
- Adjust scraping delays if rate-limited

---

## Future Enhancements

- [ ] Expand to Canada-wide and US grant sources
- [ ] Add grant application tracking
- [ ] Implement deadline reminders
- [ ] Email notifications for new matches
- [ ] Multi-language support
- [ ] Grant success rate analytics
- [ ] Community features (reviews, tips)
- [ ] Integration with grant application portals

---

## License

This project is built for educational and demonstration purposes.

---

## Contributors

Built for [Hackathon Name]

---

## Acknowledgments

- Grant data sourced from public Ontario government resources
- AI powered by Google Gemini
- Chatbot powered by Voiceflow
- Icon set by Ionicons