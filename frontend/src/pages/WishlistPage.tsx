import { useAuth } from '@clerk/clerk-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchWishlist, removeFromWishlist } from '../api/wishlistApi'
import { addToCart } from '../api/cartApi'

interface WishlistItem {
  id: number
  book: number
  book_title: string
  book_author: string
  book_price: string
  book_image: string
  book_stock: number
  added_at: string
}

export default function WishlistPage() {
  const { getToken, isSignedIn } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: items, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => fetchWishlist(getToken),
    enabled: isSignedIn ?? false,
  })

  const removeMutation = useMutation({
    mutationFn: (bookId: number) => removeFromWishlist(bookId, getToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  })

  const cartMutation = useMutation({
    mutationFn: (bookId: number) => addToCart(bookId, 1, getToken),
    onSuccess: () => alert('Added to cart!'),
  })

  if (!isSignedIn) return <div className="p-8 text-center">Sign in to view wishlist.</div>
  if (isLoading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">My Wishlist</h2>
      {!items?.length ? (
        <p className="text-gray-500">Your wishlist is empty.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item: WishlistItem) => (
            <div key={item.id} className="rounded-xl bg-white shadow-sm border p-4 flex items-center gap-4">
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
                <p className={`text-xs ${item.book_stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {item.book_stock > 0 ? 'In Stock' : 'Out Of Stock'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => cartMutation.mutate(item.book)}
                  disabled={item.book_stock === 0}
                  className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg disabled:opacity-30"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => removeMutation.mutate(item.book)}
                  className="text-sm text-red-600 hover:text-red-800 px-3 py-1.5"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
