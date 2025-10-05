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