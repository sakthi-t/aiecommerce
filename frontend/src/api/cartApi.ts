const BASE = '/api/v1/cart'

export async function fetchCart(getToken: () => Promise<string | null>) {
  const token = await getToken()
  const res = await fetch(`${BASE}/`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to fetch cart')
  return res.json()
}

export async function addToCart(bookId: number, quantity: number, getToken: () => Promise<string | null>) {
  const token = await getToken()
  const res = await fetch(`${BASE}/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ book_id: bookId, quantity }),
  })
  if (!res.ok) throw new Error('Failed to add to cart')
  return res.json()
}

export async function updateCartItem(id: number, quantity: number, getToken: () => Promise<string | null>) {
  const token = await getToken()
  const res = await fetch(`${BASE}/items/${id}/`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  })
  if (!res.ok) throw new Error('Failed to update cart item')
  return res.json()
}

export async function removeCartItem(id: number, getToken: () => Promise<string | null>) {
  const token = await getToken()
  const res = await fetch(`${BASE}/items/${id}/`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to remove cart item')
}
