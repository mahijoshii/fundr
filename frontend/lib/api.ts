// lib/api.ts
// Centralized API helper for Fundr frontend <-> FastAPI backend

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Validate API_URL on module load
if (!API_URL) {
  console.error('❌ EXPO_PUBLIC_API_URL is not set in .env file!');
}

console.log('🔗 API_URL configured as:', API_URL);

/* ---------------------------------------------------------------------------
   🔹 USER PROFILE ENDPOINT
   --------------------------------------------------------------------------- */
export async function saveUserProfile(profile: any) {
  try {
    const url = `${API_URL}/user/`;
    console.log('📤 Saving user profile to:', url);
    console.log('📦 Profile data:', JSON.stringify(profile, null, 2));

    const res = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(profile),
    });

    console.log('📥 Response status:', res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error('❌ Error response:', text);
      throw new Error(`Failed to save user profile: ${res.status} - ${text}`);
    }

    const data = await res.json();
    console.log('✅ Success:', data);
    return data;
  } catch (err: any) {
    console.error("❌ Error saving user profile:", err.message);
    console.error("Full error:", err);
    throw err;
  }
}

/* ---------------------------------------------------------------------------
   🔹 MATCHING ENDPOINT (uses /match/{user_id})
   --------------------------------------------------------------------------- */
export async function getMatches(userId: string) {
  try {
    const url = `${API_URL}/match/${userId}`;
    console.log('📤 Fetching matches from:', url);
    
    const res = await fetch(url);
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch matches (${res.status}): ${text}`);
    }
    
    return await res.json();
  } catch (err: any) {
    console.error("❌ Error fetching matches:", err.message);
    throw err;
  }
}

/* ---------------------------------------------------------------------------
   🔹 ELIGIBILITY ENDPOINT (uses /eligibility)
   --------------------------------------------------------------------------- */
export async function checkEligibility(profile: any) {
  try {
    const url = `${API_URL}/eligibility/`;
    console.log('📤 Checking eligibility at:', url);
    
    const res = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Eligibility check failed (${res.status}): ${text}`);
    }
    
    return await res.json();
  } catch (err: any) {
    console.error("❌ Error checking eligibility:", err.message);
    throw err;
  }
}

/* ---------------------------------------------------------------------------
   🔹 GRANTS ENDPOINT (uses /match/grants/all)
   --------------------------------------------------------------------------- */
export async function getAllGrants(limit: number = 20) {
  try {
    const url = `${API_URL}/match/grants/all?limit=${limit}`;
    console.log('📤 Fetching grants from:', url);
    
    const res = await fetch(url);
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch grants (${res.status}): ${text}`);
    }
    
    const data = await res.json();
    console.log(`✅ Fetched ${data.grants?.length || 0} grants`);
    return data.grants || [];
  } catch (err: any) {
    console.error("❌ Error fetching grants:", err.message);
    throw err;
  }
}

/* ---------------------------------------------------------------------------
   🔹 CHATBOT ENDPOINT (uses /ask)
   --------------------------------------------------------------------------- */
export async function askGemini(question: string) {
  try {
    const url = `${API_URL}/ask/`;
    console.log('📤 Asking chatbot:', url);
    
    const res = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ question }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Chatbot request failed (${res.status}): ${text}`);
    }
    
    const data = await res.json();
    return data.answer || data.response || "No response";
  } catch (err: any) {
    console.error("❌ Error asking chatbot:", err.message);
    throw err;
  }
}

export async function getUserProfile(userId: string) {
  try {
    const url = `${API_URL}/user/${userId}`;
    console.log('📥 Fetching user profile from:', url);
    
    const res = await fetch(url);
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch profile (${res.status}): ${text}`);
    }
    
    const data = await res.json();
    
    if (data.status === "not_found") {
      return null;
    }
    
    console.log('✅ Profile fetched for user:', userId);
    return data.profile;
  } catch (err: any) {
    console.error("❌ Error fetching profile:", err.message);
    throw err;
  }
}