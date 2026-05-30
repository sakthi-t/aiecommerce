const BASE = '/api/v1/orders'

export async function fetchOrders(getToken: () => Promise<string | null>, page = 1) {
  const token = await getToken()
  const res = await fetch(`${BASE}/?page=${page}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to fetch orders')
  return res.json()
}
