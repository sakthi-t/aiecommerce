import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

const API_BASE = import.meta.env.PROD ? 'https://aiecommerce-production.up.railway.app' : ''

async function fetchAdminOrders(getToken: () => Promise<string | null>, page: number) {
  const token = await getToken()
  const res = await fetch(`${API_BASE}/api/v1/orders/admin/list/?page=${page}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to fetch orders')
  return res.json()
}

async function updateOrderStatus(
  id: number,
  status: string,
  getToken: () => Promise<string | null>
) {
  const token = await getToken()
  const res = await fetch(`${API_BASE}/api/v1/orders/admin/${id}/status/`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update order')
  return res.json()
}

interface AdminOrdersProps {
  getToken: () => Promise<string | null>
}

export default function AdminOrders({ getToken }: AdminOrdersProps) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page],
    queryFn: () => fetchAdminOrders(getToken, page),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateOrderStatus(id, status, getToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
  })

  if (isLoading) return <p className="text-gray-500">Loading orders...</p>

  const orders = data?.results ?? []

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Manage Orders</h3>
      <div className="space-y-3">
        {orders.map((order: any) => {
          const statuses =
            order.status === 'pending'
              ? ['pending', 'cancelled']
              : order.status === 'paid'
              ? ['paid', 'delivered']
              : null

          return (
            <div key={order.id} className="rounded-xl bg-white shadow-sm border p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-semibold">
                    Order #{order.id}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(order.user_name || order.user_email)
                      ? <span>{order.user_name} <span className="text-gray-400">({order.user_email})</span></span>
                      : <span className="text-gray-400">No user info</span>
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()} · ₹{order.total_amount}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm px-2 py-0.5 rounded-full ${
                      order.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : order.status === 'delivered'
                        ? 'bg-blue-100 text-blue-700'
                        : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {order.status}
                  </span>
                  {statuses && (
                    <select
                      value=""
                      className="text-sm border rounded px-2 py-1"
                      onChange={(e) => {
                        const val = e.target.value
                        if (val) {
                          statusMutation.mutate({ id: order.id, status: val })
                        }
                      }}
                    >
                      <option value="">Change</option>
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {order.items?.map((item: any) => (
                  <span key={item.id} className="mr-3">
                    {item.book_title} x{item.quantity}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {data && data.count > 5 && (
        <div className="flex justify-center gap-4 mt-6">
          <button
            disabled={!data.previous}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-lg border disabled:opacity-30"
          >
            Previous
          </button>
          <button
            disabled={!data.next}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg border disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
