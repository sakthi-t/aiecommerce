import { useAuth } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchOrders } from '../api/ordersApi'

interface OrderItemType {
  id: number
  book_title: string
  book_price: string
  quantity: number
}

interface Order {
  id: number
  total_amount: string
  status: string
  created_at: string
  items: OrderItemType[]
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  delivered: 'bg-blue-100 text-blue-700',
}

export default function OrdersPage() {
  const { getToken, isSignedIn } = useAuth()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => fetchOrders(getToken, page),
    enabled: isSignedIn ?? false,
  })

  if (!isSignedIn) return <div className="p-8 text-center">Sign in to view orders.</div>
  if (isLoading) return <div className="p-8 text-center">Loading...</div>

  const orders = data?.results ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Order History</h2>
      {orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order: Order) => (
              <div key={order.id} className="rounded-xl bg-white shadow-sm border p-6">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Order #{order.id}</span>
                  <span className={`text-sm px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-700'}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                <div className="mt-2 space-y-1">
                  {order.items.map((item: OrderItemType) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.book_title} x{item.quantity}</span>
                      <span>₹{item.book_price}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 font-bold text-right">₹{order.total_amount}</p>
              </div>
            ))}
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
        </>
      )}
    </div>
  )
}
