const BASE = '/api/v1/wishlist'

export async function fetchWishlist(getToken: () => Promise<string | null>) {
  const token = await getToken()
  const res = await fetch(`${BASE}/`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to fetch wishlist')
  return res.json()
}

export async function addToWishlist(bookId: number, getToken: () => Promise<string | null>) {
  const token = await getToken()
  const res = await fetch(`${BASE}/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ book_id: bookId }),
  })
  if (!res.ok) throw new Error('Failed to add to wishlist')
  return res.json()
}

export async function removeFromWishlist(bookId: number, getToken: () => Promise<string | null>) {
  const token = await getToken()
  const res = await fetch(`${BASE}/`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ book_id: bookId }),
  })
  if (!res.ok) throw new Error('Failed to remove from wishlist')
}
