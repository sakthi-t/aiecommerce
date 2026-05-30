import type { UserProfile } from '../types'

const API_BASE = ''  // same domain in dev, set VITE_API_BASE_URL in production

export async function fetchMyProfile(
  getToken: () => Promise<string | null>
): Promise<UserProfile> {
  const token = await getToken()
  const res = await fetch(`${API_BASE}/api/v1/users/me/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  if (res.status === 403) throw new Error('Account is deactivated')
  if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`)
  return res.json()
}

export interface AdminUser {
  id: number
  display_name: string
  email: string
  role: string
  is_active: boolean
  total_orders: number
  created_at: string
}

export async function fetchAdminUsers(
  getToken: () => Promise<string | null>,
  page = 1
): Promise<{ results: AdminUser[]; count: number; next: string | null; previous: string | null }> {
  const token = await getToken()
  const res = await fetch(`${API_BASE}/api/v1/users/admin/list/?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export async function deactivateUser(
  id: number,
  getToken: () => Promise<string | null>
): Promise<void> {
  const token = await getToken()
  const res = await fetch(`/api/v1/users/admin/${id}/deactivate/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to deactivate user')
}

export async function reactivateUser(
  id: number,
  getToken: () => Promise<string | null>
): Promise<void> {
  const token = await getToken()
  const res = await fetch(`/api/v1/users/admin/${id}/reactivate/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to reactivate user')
}
