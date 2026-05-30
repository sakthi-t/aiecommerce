import { useAuth } from '@clerk/clerk-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { fetchCart } from '../api/cartApi'
import { createRazorpayOrder, verifyRazorpayPayment } from '../api/paymentsApi'

export default function CheckoutPage() {
  const { getToken, isSignedIn } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => fetchCart(getToken),
    enabled: isSignedIn ?? false,
  })

  if (!isSignedIn) return <div className="p-8 text-center">Sign in to checkout.</div>
  if (isLoading) return <div className="p-8 text-center">Loading...</div>
  if (!cart?.items?.length) return <div className="p-8 text-center">Your cart is empty. <a href="/cart" className="underline">Go to cart</a></div>

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const orderData = await createRazorpayOrder(getToken)

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Bookstore',
        description: 'Book Purchase',
        order_id: orderData.order_id,
        handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
          try {
            await verifyRazorpayPayment(response, getToken)
            queryClient.invalidateQueries({ queryKey: ['orders'] })
            navigate('/orders')
          } catch {
            alert('Payment verification failed. Contact support.')
          }
        },
        prefill: {
          name: '',
          email: '',
        },
        theme: {
          color: '#1f2937',
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch {
      alert('Failed to initiate checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Checkout</h2>
      <div className="rounded-xl bg-white shadow-sm border p-6 space-y-3">
        {cart.items.map((item: { id: number; book_title: string; quantity: number; book_price: string }) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.book_title} x{item.quantity}</span>
            <span>₹{(parseFloat(item.book_price) * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <hr />
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>₹{parseFloat(cart.subtotal).toFixed(2)}</span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full rounded-lg bg-gray-900 text-white py-3 hover:bg-gray-800 font-medium disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Pay with Razorpay'}
        </button>
        <button
          onClick={() => navigate('/cart')}
          className="w-full rounded-lg border py-3 hover:bg-gray-100"
        >
          Back to Cart
        </button>
      </div>
    </div>
  )
}
