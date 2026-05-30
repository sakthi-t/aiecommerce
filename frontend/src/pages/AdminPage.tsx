import { useAuth } from '@clerk/clerk-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchBooks,
  fetchBookStats,
  createBook,
  updateBook,
  deleteBook,
  uploadBookImage,
} from '../api/booksApi'
import { fetchMyProfile } from '../api/usersApi'
import BookForm from '../components/books/BookForm'
import AdminOrders from '../components/orders/AdminOrders'
import AdminSessions from '../components/support/AdminSessions'
import AdminUsers from '../components/users/AdminUsers'
import type { Book, BookFormData } from '../types'

export default function AdminPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [createMode, setCreateMode] = useState(false)
  const [uploadingFor, setUploadingFor] = useState<number | null>(null)
  const [pendingImage, setPendingImage] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [bookPage, setBookPage] = useState(1)
  const [tab, setTab] = useState<'books' | 'orders' | 'sessions' | 'users'>('books')

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => fetchMyProfile(getToken),
    enabled: isLoaded && (isSignedIn ?? false),
  })

  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate('/')
  }, [isLoaded, isSignedIn, navigate])

  useEffect(() => {
    if (profileError || (profile && !profileLoading && !isAdmin)) {
      navigate('/')
    }
  }, [profile, profileLoading, isAdmin, profileError, navigate])

  const { data: booksData, isLoading: booksLoading } = useQuery({
    queryKey: ['admin-books', bookPage],
    queryFn: () => fetchBooks(bookPage),
    enabled: isAdmin,
  })

  const { data: stats } = useQuery({
    queryKey: ['book-stats'],
    queryFn: () => fetchBookStats(getToken),
    enabled: isAdmin,
  })

  const createMutation = useMutation({
    mutationFn: async (data: BookFormData) => {
      const book = await createBook(data, getToken)
      if (pendingImage) {
        await uploadBookImage(book.id, pendingImage, getToken)
        setPendingImage(null)
      }
      return book
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] })
      queryClient.invalidateQueries({ queryKey: ['book-stats'] })
      setCreateMode(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BookFormData> }) =>
      updateBook(id, data, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] })
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBook(id, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] })
      queryClient.invalidateQueries({ queryKey: ['book-stats'] })
    },
  })

  const uploadMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      uploadBookImage(id, file, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] })
      setUploadingFor(null)
    },
  })

  if (!isLoaded || !isSignedIn || profileLoading) return null
  if (profileError || !isAdmin) return null

  const handleImageUpload = (id: number) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setUploadingFor(id)
        uploadMutation.mutate({ id, file })
      }
    }
    input.click()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Admin Dashboard</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white shadow-sm border p-6">
            <p className="text-sm text-gray-500">Total Books</p>
            <p className="text-3xl font-bold">{stats?.total_books ?? 0}</p>
          </div>
          <div className="rounded-xl bg-white shadow-sm border p-6">
            <p className="text-sm text-gray-500">Books In Stock</p>
            <p className="text-3xl font-bold text-green-600">{stats?.books_in_stock ?? 0}</p>
          </div>
          <div className="rounded-xl bg-white shadow-sm border p-6">
            <p className="text-sm text-gray-500">Books Out Of Stock</p>
            <p className="text-3xl font-bold text-red-500">{stats?.books_out_of_stock ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setTab('books')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
            tab === 'books' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Manage Books
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
            tab === 'orders' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Manage Orders
        </button>
        <button
          onClick={() => setTab('sessions')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
            tab === 'sessions' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Support Sessions
        </button>
        <button
          onClick={() => setTab('users')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
            tab === 'users' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Manage Users
        </button>
      </div>

      {tab === 'orders' ? (
        <AdminOrders getToken={getToken} />
      ) : tab === 'sessions' ? (
        <AdminSessions getToken={getToken} />
      ) : tab === 'users' ? (
        <AdminUsers getToken={getToken} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Manage Books</h3>
            <button
              onClick={() => { setCreateMode(true); setEditingId(null) }}
              className="rounded-lg bg-gray-900 text-white px-4 py-2 hover:bg-gray-800"
            >
              + Add Book
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700">
              {error}
            </div>
          )}

          {createMode && (
            <div className="mb-6 rounded-xl bg-white shadow-sm border p-6">
              <BookForm
                onImageSelect={(file) => setPendingImage(file)}
                uploadingImage={!!pendingImage}
                onSubmit={(data) => {
                  void createMutation.mutateAsync(data).catch(() => setError('Failed to create book'))
                }}
                onCancel={() => setCreateMode(false)}
                loading={createMutation.isPending}
              />
            </div>
          )}

          {booksLoading ? (
            <p className="text-gray-500">Loading books...</p>
          ) : (
            <>
              <div className="space-y-3">
                {booksData?.results.map((book: Book) => (
                  <div key={book.id}>
                    {editingId === book.id ? (
                      <div className="rounded-xl bg-white shadow-sm border p-6">
                        <BookForm
                          initial={book}
                          onSubmit={(data) => {
                            void updateMutation.mutateAsync({ id: book.id, data }).catch(() => setError('Failed to update book'))
                          }}
                          onCancel={() => setEditingId(null)}
                          loading={updateMutation.isPending}
                        />
                      </div>
                    ) : (
                      <div className="rounded-xl bg-white shadow-sm border p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {book.image_url ? (
                            <img src={book.image_url} alt={book.title} className="w-16 h-16 object-cover rounded-lg" />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">No img</div>
                          )}
                          <div>
                            <p className="font-semibold">{book.title}</p>
                            <p className="text-sm text-gray-500">{book.author} · {book.genre}</p>
                            <p className="text-sm">₹{book.price_inr} · Qty: {book.quantity_available}</p>
                            <p className="text-xs mt-1">
                              {book.quantity_available > 0 ? (
                                <span className="text-green-600">In Stock</span>
                              ) : (
                                <span className="text-red-500">Out Of Stock</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleImageUpload(book.id)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                            disabled={uploadingFor === book.id}
                          >
                            {uploadingFor === book.id ? 'Uploading...' : 'Upload Image'}
                          </button>
                          <button
                            onClick={() => { setEditingId(book.id); setCreateMode(false) }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete this book?')) deleteMutation.mutate(book.id) }}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {booksData && booksData.count > 5 && (
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    disabled={!booksData.previous}
                    onClick={() => setBookPage((p) => p - 1)}
                    className="px-4 py-2 rounded-lg border disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    disabled={!booksData.next}
                    onClick={() => setBookPage((p) => p + 1)}
                    className="px-4 py-2 rounded-lg border disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
