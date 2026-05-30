import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchBook } from '../api/booksApi'
import { addToCart } from '../api/cartApi'
import { addToWishlist, removeFromWishlist, fetchWishlist } from '../api/wishlistApi'

export default function BookDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { getToken, isSignedIn } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: book, isLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: () => fetchBook(Number(id)),
    enabled: !!id,
  })

  const { data: wishlist } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => fetchWishlist(getToken),
    enabled: isSignedIn ?? false,
  })

  const cartMutation = useMutation({
    mutationFn: () => addToCart(Number(id), 1, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      alert('Added to cart!')
    },
    onError: () => alert('Failed to add to cart'),
  })

  const addWishlist = useMutation({
    mutationFn: () => addToWishlist(Number(id), getToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  })

  const removeWishlist = useMutation({
    mutationFn: () => removeFromWishlist(Number(id), getToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  })

  if (isLoading) return <div className="p-8 text-center">Loading...</div>
  if (!book) return <div className="p-8 text-center">Book not found</div>

  const isWishlisted = wishlist?.some((w: { book: number }) => w.book === book.id)
  const outOfStock = book.quantity_available === 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {book.image_url ? (
            <img src={book.image_url} alt={book.title} className="w-full rounded-xl object-cover" />
          ) : (
            <div className="w-full h-80 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">No image</div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{book.title}</h1>
          <p className="text-lg text-gray-500 mt-1">{book.author}</p>
          <p className="text-sm text-gray-400">{book.genre}</p>
          <p className="mt-4 text-gray-700 leading-relaxed">{book.description}</p>
          <p className="mt-6 text-3xl font-bold">₹{book.price_inr}</p>
          <p className={`mt-2 text-sm font-medium ${outOfStock ? 'text-red-500' : 'text-green-600'}`}>
            {outOfStock ? 'Out Of Stock' : 'In Stock'}
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                if (!isSignedIn) { navigate('/'); return }
                cartMutation.mutate()
              }}
              disabled={outOfStock || cartMutation.isPending}
              className="rounded-lg bg-gray-900 text-white px-8 py-3 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {outOfStock ? 'Out Of Stock' : cartMutation.isPending ? 'Adding...' : 'Add To Cart'}
            </button>
            {isSignedIn && (
              <button
                onClick={() => {
                  if (isWishlisted) removeWishlist.mutate()
                  else addWishlist.mutate()
                }}
                className="rounded-lg border px-8 py-3 hover:bg-gray-100"
              >
                {isWishlisted ? '♥ Remove' : '♡ Wishlist'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
