import { useState } from 'react'
import type { BookFormData, Book } from '../../types'

interface Props {
  initial?: Book | null
  onSubmit: (data: BookFormData) => void
  onCancel: () => void
  loading: boolean
  onImageSelect?: (file: File) => void
  uploadingImage?: boolean
}

export default function BookForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  onImageSelect,
  uploadingImage,
}: Props) {
  const [form, setForm] = useState<BookFormData>({
    title: initial?.title ?? '',
    author: initial?.author ?? '',
    genre: initial?.genre ?? '',
    description: initial?.description ?? '',
    price_inr: initial?.price_inr ?? '',
    quantity_available: initial?.quantity_available ?? 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  const update = (field: keyof BookFormData, value: string | number) => {
    setForm((prev: BookFormData) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {onImageSelect && (
        <div>
          <label className="block text-sm font-medium mb-1">Image</label>
          <input
            type="file"
            accept="image/*"
            className="w-full text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImageSelect(file)
            }}
          />
          {uploadingImage && <p className="text-xs text-blue-600 mt-1">Uploading image...</p>}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          className="w-full rounded-lg border px-3 py-2"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Author</label>
        <input
          className="w-full rounded-lg border px-3 py-2"
          value={form.author}
          onChange={(e) => update('author', e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Genre</label>
        <input
          className="w-full rounded-lg border px-3 py-2"
          value={form.genre}
          onChange={(e) => update('genre', e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          className="w-full rounded-lg border px-3 py-2"
          rows={3}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Price (INR)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className="w-full rounded-lg border px-3 py-2"
            value={form.price_inr}
            onChange={(e) => update('price_inr', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full rounded-lg border px-3 py-2"
            value={form.quantity_available}
            onChange={(e) => {
              const val = e.target.value
              if (val === '') {
                update('quantity_available', '')
              } else if (/^\d+$/.test(val)) {
                update('quantity_available', parseInt(val, 10))
              }
            }}
            required
          />
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gray-900 text-white px-6 py-2 hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Saving...' : initial ? 'Update Book' : 'Create Book'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-6 py-2 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
