import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { fetchBooks } from '../api/booksApi'
import type { Book } from '../types'

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const q = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)

  const { data, isLoading } = useQuery({
    queryKey: ['catalog', q, page],
    queryFn: () => fetchBooks(page, q),
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">
        {q ? `Results for "${q}"` : 'All Books'}
      </h2>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : data?.results.length === 0 ? (
        <p className="text-gray-500">No books found.</p>
      ) : (
        <>
          <div className="space-y-4">
            {data?.results.map((book: Book) => (
              <div
                key={book.id}
                onClick={() => navigate(`/catalog/${book.id}`)}
                className="rounded-xl bg-white shadow-sm border p-4 flex gap-4 hover:shadow-md transition cursor-pointer"
              >
                {book.image_url ? (
                  <img src={book.image_url} alt={book.title} className="w-20 h-28 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-20 h-28 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">No img</div>
                )}
                <div className="flex flex-col justify-center min-w-0">
                  <h3 className="font-semibold text-base truncate">{book.title}</h3>
                  <p className="text-sm text-gray-500">{book.author}</p>
                  <p className="text-xs text-gray-400">{book.genre}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{book.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="font-bold">₹{book.price_inr}</p>
                    <p className={`text-xs ${book.quantity_available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {book.quantity_available > 0 ? 'In Stock' : 'Out Of Stock'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data && data.count > 5 && (
            <div className="flex justify-center gap-4 mt-8">
              <button
                disabled={!data.previous}
                onClick={() => setSearchParams({ q, page: String(page - 1) })}
                className="px-4 py-2 rounded-lg border disabled:opacity-30"
              >
                Previous
              </button>
              <button
                disabled={!data.next}
                onClick={() => setSearchParams({ q, page: String(page + 1) })}
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
