import { Routes, Route, useSearchParams } from 'react-router-dom'
import Navbar from './components/navbar/Navbar'
import AdminPage from './pages/AdminPage'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import BookDetailsPage from './pages/BookDetailsPage'
import WishlistPage from './pages/WishlistPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import ContactPage from './pages/ContactPage'

export default function App() {
  const [, setSearchParams] = useSearchParams()

  const handleSearch = (q: string) => {
    setSearchParams({ q })
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar onSearch={handleSearch} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/catalog/:id" element={<BookDetailsPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin/*" element={<AdminPage />} />
      </Routes>
    </div>
  )
}
