export interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  description: string;
  price_inr: string;
  quantity_available: number;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface BookFormData {
  title: string;
  author: string;
  genre: string;
  description: string;
  price_inr: string;
  quantity_available: number | '';
}

export interface BookStats {
  total_books: number;
  books_in_stock: number;
  books_out_of_stock: number;
}

export interface UserProfile {
  id: number;
  clerk_user_id: string;
  email: string;
  display_name: string;
  role: 'customer' | 'admin';
  created_at: string;
  updated_at: string;
}
