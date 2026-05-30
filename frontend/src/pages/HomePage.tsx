import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { fetchBooks } from '../api/booksApi'
import Carousel from '../components/carousel/Carousel'
import type { Book } from '../types'

export default function HomePage() {
  const navigate = useNavigate()
  const [catalogPage, setCatalogPage] = useState(1)

  const { data: featured, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured-books'],
    queryFn: () => fetchBooks(1),
  })

  const { data: catalog, isLoading: catalogLoading } = useQuery({
    queryKey: ['home-catalog', catalogPage],
    queryFn: () => fetchBooks(catalogPage),
  })

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-10">
      <Carousel />

      <section>
        <h2 className="text-2xl font-semibold mb-4">Featured Books</h2>
        {featuredLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {featured?.results.slice(0, 3).map((book: Book) => (
              <a
                key={book.id}
                href={`/catalog/${book.id}`}
                className="rounded-xl bg-white shadow-sm border p-4 hover:shadow-md transition block"
              >
                {book.image_url ? (
                  <img src={book.image_url} alt={book.title} className="w-full h-48 object-cover rounded-lg mb-3" />
                ) : (
                  <div className="w-full h-48 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400">No image</div>
                )}
                <h3 className="font-semibold text-lg">{book.title}</h3>
                <p className="text-sm text-gray-500">{book.author}</p>
                <p className="text-sm text-gray-400">{book.genre}</p>
                <p className="mt-2 font-bold">₹{book.price_inr}</p>
                <p className={`text-sm mt-1 ${book.quantity_available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {book.quantity_available > 0 ? 'In Stock' : 'Out Of Stock'}
                </p>
              </a>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">All Books</h2>
        {catalogLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <>
            <div className="max-w-3xl mx-auto space-y-4">
              {catalog?.results.map((book: Book) => (
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

            {catalog && catalog.count > 5 && (
              <div className="flex justify-center gap-4 mt-6">
                <button
                  disabled={!catalog.previous}
                  onClick={() => setCatalogPage((p) => p - 1)}
                  className="px-4 py-2 rounded-lg border disabled:opacity-30"
                >
                  Previous
                </button>
                <button
                  disabled={!catalog.next}
                  onClick={() => setCatalogPage((p) => p + 1)}
                  className="px-4 py-2 rounded-lg border disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
