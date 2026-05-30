const API_BASE = import.meta.env.PROD ? 'https://aiecommerce-production.up.railway.app' : (import.meta.env.VITE_API_BASE_URL || '')
const BASE = `${API_BASE}/api/v1/orders`

export async function fetchOrders(getToken: () => Promise<string | null>, page = 1) {
  const token = await getToken()
  const res = await fetch(`${BASE}/?page=${page}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to fetch orders')
  return res.json()
}
