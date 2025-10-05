// frontend/lib/api.ts

// Use your PC's LAN IP so Expo Go (on your phone) can reach the backend.
// Example: "http://192.168.1.34:8000"
export const API_BASE = "http://172.16.16.48:8000";

export async function askGemini(prompt: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: prompt }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
  return data.response ?? "";
}
