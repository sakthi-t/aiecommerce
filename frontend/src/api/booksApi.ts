import type { Book, BookFormData, BookStats } from '../types'

const BASE = '/api/v1/books'

async function authHeaders(sessionToken?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (sessionToken) {
    const token = await sessionToken
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export async function fetchBooks(page = 1, search = ''): Promise<{
  count: number
  results: Book[]
  next: string | null
  previous: string | null
}> {
  const params = new URLSearchParams({ page: String(page) })
  if (search) params.set('q', search)
  const res = await fetch(`${BASE}/?${params}`)
  if (!res.ok) throw new Error('Failed to fetch books')
  return res.json()
}

export async function fetchBook(id: number): Promise<Book> {
  const res = await fetch(`${BASE}/${id}/`)
  if (!res.ok) throw new Error('Failed to fetch book')
  return res.json()
}

export async function createBook(
  data: BookFormData,
  getToken: () => Promise<string | null>
): Promise<Book> {
  const token = await getToken()
  const res = await fetch(`${BASE}/`, {
    method: 'POST',
    headers: await authHeaders(token ?? undefined),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create book')
  return res.json()
}

export async function updateBook(
  id: number,
  data: Partial<BookFormData>,
  getToken: () => Promise<string | null>
): Promise<Book> {
  const token = await getToken()
  const body = JSON.stringify({
    ...data,
    ...(data.quantity_available !== undefined && {
      quantity_available: data.quantity_available === '' ? 0 : data.quantity_available,
    }),
  })
  const res = await fetch(`${BASE}/${id}/`, {
    method: 'PATCH',
    headers: await authHeaders(token ?? undefined),
    body,
  })
  if (!res.ok) throw new Error('Failed to update book')
  return res.json()
}

export async function deleteBook(
  id: number,
  getToken: () => Promise<string | null>
): Promise<void> {
  const token = await getToken()
  const res = await fetch(`${BASE}/${id}/`, {
    method: 'DELETE',
    headers: await authHeaders(token ?? undefined),
  })
  if (!res.ok) throw new Error('Failed to delete book')
}

export async function fetchBookStats(
  getToken: () => Promise<string | null>
): Promise<BookStats> {
  const token = await getToken()
  const res = await fetch(`${BASE}/stats/`, {
    headers: await authHeaders(token ?? undefined),
  })
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function uploadBookImage(
  id: number,
  file: File,
  getToken: () => Promise<string | null>
): Promise<{ image_url: string }> {
  const token = await getToken()
  const formData = new FormData()
  formData.append('image', file)

  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}/${id}/upload-image/`, {
    method: 'POST',
    headers,
    body: formData,
  })
  if (!res.ok) throw new Error('Failed to upload image')
  return res.json()
}
