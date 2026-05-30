import { useAuth } from '@clerk/clerk-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchCart, updateCartItem, removeCartItem } from '../api/cartApi'

interface CartItemType {
  id: number
  book: number
  book_title: string
  book_author: string
  book_price: string
  book_image: string
  book_stock: number
  quantity: number
  added_at: string
}

function CartItemRow({ item, onUpdate, onRemove }: {
  item: CartItemType
  onUpdate: (id: number, qty: number) => void
  onRemove: (id: number) => void
}) {
  const navigate = useNavigate()

  return (
    <div className="rounded-xl bg-white shadow-sm border p-4 flex items-center gap-4">
      {item.book_image ? (
        <img src={item.book_image} alt={item.book_title} className="w-16 h-20 object-cover rounded-lg" />
      ) : (
        <div className="w-16 h-20 bg-gray-100 rounded-lg" />
      )}
      <div className="flex-1">
        <p className="font-semibold cursor-pointer hover:underline" onClick={() => navigate(`/catalog/${item.book}`)}>
          {item.book_title}
        </p>
        <p className="text-sm text-gray-500">{item.book_author}</p>
        <p className="font-bold mt-1">₹{item.book_price}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => item.quantity > 1 && onUpdate(item.id, item.quantity - 1)}
          className="w-8 h-8 rounded border text-sm hover:bg-gray-100"
        >
          -
        </button>
        <span className="w-8 text-center">{item.quantity}</span>
        <button
          type="button"
          onClick={() => item.quantity < item.book_stock && onUpdate(item.id, item.quantity + 1)}
          disabled={item.quantity >= item.book_stock}
          className="w-8 h-8 rounded border text-sm hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
      <p className="font-bold w-20 text-right">₹{(parseFloat(item.book_price) * item.quantity).toFixed(2)}</p>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="text-sm text-red-600 hover:text-red-800"
      >
        Remove
      </button>
    </div>
  )
}

export default function CartPage() {
  const { getToken, isSignedIn } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => fetchCart(getToken),
    enabled: isSignedIn ?? false,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      updateCartItem(id, quantity, getToken),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: () => alert('Failed to update quantity'),
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeCartItem(id, getToken),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: () => alert('Failed to remove item'),
  })

  if (!isSignedIn) return <div className="p-8 text-center">Sign in to view cart.</div>
  if (isLoading) return <div className="p-8 text-center">Loading...</div>

  const handleUpdate = (id: number, quantity: number) => {
    updateMutation.mutate({ id, quantity })
  }

  const handleRemove = (id: number) => {
    removeMutation.mutate(id)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Shopping Cart</h2>
      {!cart?.items?.length ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          <div className="space-y-4">
            {cart.items.map((item: CartItemType) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdate={handleUpdate}
                onRemove={handleRemove}
              />
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-white shadow-sm border p-6">
            <div className="flex justify-between text-lg">
              <span>Subtotal</span>
              <span>₹{parseFloat(cart.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold mt-2">
              <span>Total</span>
              <span>₹{parseFloat(cart.subtotal).toFixed(2)}</span>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="mt-4 w-full rounded-lg bg-gray-900 text-white py-3 hover:bg-gray-800 font-medium"
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  )
}
