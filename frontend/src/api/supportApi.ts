const API_BASE = import.meta.env.PROD ? 'https://aiecommerce-production.up.railway.app' : (import.meta.env.VITE_API_BASE_URL || '')
const BASE = `${API_BASE}/api/v1/support`

export async function startSession(getToken: () => Promise<string | null>): Promise<{
  session_id: number
  livekit_room_name: string
  livekit_token: string
}> {
  const token = await getToken()
  const res = await fetch(`${BASE}/start-session/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to start session')
  return res.json()
}

const VAPI_BASE = `${API_BASE}/api/vapi`

export async function startVapiSession(getToken: () => Promise<string | null>): Promise<{
  session_id: number
  vapi_assistant_id: string
  vapi_public_key: string
  customer_name: string
  vapi_conversation_id: string
  ctx_info: string
}> {
  const token = await getToken()
  const res = await fetch(`${VAPI_BASE}/start-session/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to start Vapi session')
  return res.json()
}
