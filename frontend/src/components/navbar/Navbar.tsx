import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { fetchMyProfile } from '../../api/usersApi'

interface Props {
  onSearch: (q: string) => void
}

export default function Navbar({ onSearch }: Props) {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['my-profile-nav'],
    queryFn: () => fetchMyProfile(getToken),
    enabled: isLoaded && (isSignedIn ?? false),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setMobileOpen(false)
    onSearch(query)
    navigate(`/catalog?q=${encodeURIComponent(query)}`)
  }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="text-xl font-bold tracking-tight">Bookstore</a>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <input
              type="text"
              placeholder="Search by title, author, genre..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </form>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
            <a href="/catalog" className="text-gray-600 hover:text-gray-900">Catalog</a>
            <SignedIn>
              <a href="/wishlist" className="text-gray-600 hover:text-gray-900">Wishlist</a>
              <a href="/cart" className="text-gray-600 hover:text-gray-900">Cart</a>
              <a href="/orders" className="text-gray-600 hover:text-gray-900">Orders</a>
              <a href="/contact" className="text-gray-600 hover:text-gray-900">Contact</a>
              {profile?.role === 'admin' && (
                <a href="/admin" className="text-gray-600 hover:text-gray-900">Admin</a>
              )}
              <UserButton />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal" />
              <SignUpButton mode="modal" />
            </SignedOut>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-3 text-sm">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border px-3 py-1.5 text-sm"
              />
            </form>
            <a href="/" className="block px-2 py-1">Home</a>
            <a href="/catalog" className="block px-2 py-1">Catalog</a>
            <SignedIn>
              <a href="/wishlist" className="block px-2 py-1">Wishlist</a>
              <a href="/cart" className="block px-2 py-1">Cart</a>
              <a href="/orders" className="block px-2 py-1">Orders</a>
              <a href="/contact" className="block px-2 py-1">Contact</a>
              {profile?.role === 'admin' && (
                <a href="/admin" className="block px-2 py-1">Admin</a>
              )}
              <div className="px-2 py-1"><UserButton /></div>
            </SignedIn>
            <SignedOut>
              <div className="px-2 py-1"><SignInButton mode="modal" /></div>
              <div className="px-2 py-1"><SignUpButton mode="modal" /></div>
            </SignedOut>
          </div>
        )}
      </div>
    </nav>
  )
}
