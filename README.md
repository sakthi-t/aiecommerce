# AI-Powered Online Bookstore

A full-stack ecommerce platform for an online bookstore with an AI voice customer support agent named **Haney**. Built with Django, React, PostgreSQL, Clerk, Razorpay, and Vapi.

---

## Key Features

- Browse, search, and purchase books with a clean modern UI
- Persistent cart and wishlist per authenticated user
- Razorpay payment integration with inventory deduction at checkout
- AI voice support agent (Haney) powered by Vapi — understands orders, provides status, captures ratings
- Admin dashboard for book inventory, order management, user management, and support session monitoring
- Soft user deactivation with real-time API blocking at the authentication layer
- Clerk authentication with role-based access control
- Cloudinary media storage for book cover images

---

## Architecture Overview

```
                         ┌──────────────────┐
                         │  Customer Browser │
                         └────────┬─────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │    React Frontend (Vite)    │
                    │  Tailwind + TanStack Query  │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │   Django REST API (:8000)   │
                    │        DRF Viewsets          │
                    └──┬───────┬──────┬───────┬──┘
                       │       │      │       │
              ┌────────▼┐ ┌───▼──┐ ┌─▼──┐ ┌──▼──────┐
              │PostgreSQL│ │Clerk │ │Vapi│ │Cloudinary│
              │  (Neon)│ │ JWT  │ │AI  │ │  Media     │
              └──────────┘ └──────┘ └────┘ └─────────┘
                                    │
                              ┌─────▼──────┐
                              │  Razorpay  │
                              │  Payments  │
                              └────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 6, Tailwind CSS 4, Vite |
| Backend | Django 6.0, Django REST Framework 3.17 |
| Database | PostgreSQL (Neon Serverless/Railway) |
| Auth | Clerk (JWKS + RS256 JWT verification) |
| Payments | Razorpay (INR) |
| Media | Cloudinary |
| AI Voice | Vapi with ElevenLabs TTS + Deepgram STT |
| State | TanStack Query 5, React Router 7 |

---

## System Design

### Ecommerce Workflow

```
  Customer
     │
     ▼
  Browse Books ───────────────→ Search by title, author, genre
     │
     ▼
  Add To Cart ────────────────→ Stock validation at add & update
     │
     ▼
  Checkout ───────────────────→ Stock deducted immediately
     │                          Cart cleared after order creation
     ▼
  Razorpay Payment Modal ─────→ INR payments via Razorpay
     │
     ▼
  Payment Verified ───────────→ Signature verification
     │                          Order status → paid
     ▼
  Order Stored ───────────────→ Persistent in PostgreSQL
     │                          Visible in admin dashboard
     ▼
  Admin Marks Delivered ──────→ Status update only
                                (stock already deducted at checkout)

  Cancel Order ───────────────→ Stock restored to inventory
```

**Key design decisions:**
- Inventory deducts at **checkout**, not payment — prevents overselling during payment delay
- Cancelling an order restores all book quantities automatically
- Cart quantity updates are capped to available stock both on frontend and backend

### Voice Support Workflow

```
  Customer
     │
     ▼
  Clicks "Call Haney" ────────→ POST /api/vapi/start-session/
     │                          Django builds customer context
     ▼                          (name, email, all orders with status)
  Vapi Web SDK Initializes
     │  customer_name
     │  ctx_info (order history)
     │  vapi_conversation_id
     ▼
  Vapi Agent (Haney) ─────────→ ElevenLabs TTS + Deepgram STT
     │                          OpenAI GPT-4.1 for reasoning
     │
     ├── Customer asks about order
     │   Agent checks {{ctx_info}} for matching order
     │   Returns status, items, delivery info
     │
     ├── Customer gives rating (1-5)
     │   Vapi structured output extracts rating
     │
     └── Call ends
         │
         ▼
  Webhook POST ──────────────→ Django receives payload
     │                          /api/vapi/webhook/
     ├── Transcript stored → TranscriptMessage per speaker
     ├── Rating stored → SupportSession.rating
     ├── Summary stored → AI-generated call summary
     └── Duration recorded → SupportSession.duration_seconds
         │
         ▼
  Admin Dashboard ────────────→ View summary, rating, transcript
```

---

## Database Design

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│     User     │       │   UserProfile│       │     Book     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │──1:1──│ id (PK)      │       │ id (PK)      │
│ username     │       │ clerk_user_id│       │ title        │
│ email        │       │ display_name │       │ author       │
│ password     │       │ email        │       │ genre        │
└──────────────┘       │ role         │       │ price_inr    │
                       │ is_active    │       │ qty_available│
                       │ created_at   │       │ image_url    │
                       └──────────────┘       └──────┬───────┘
                                                     │
          ┌──────────────┐        ┌──────────────┐   │
          │    Cart      │        │   Wishlist   │   │
          ├──────────────┤        ├──────────────┤   │
          │ id (PK)      │        │ id (PK)      │   │
          │ user (FK)    │        │ user (FK)    │   │
          └──────┬───────┘        │ book (FK) ───┘   │
                 │                └──────────────┘   │
          ┌──────▼───────┐                           │
          │   CartItem   │                           │
          ├──────────────┤                           │
          │ id (PK)      │                           │
          │ cart (FK)    │   ┌──────────────┐        │
          │ book (FK) ───┘   │    Order     │        │
          │ quantity     │   ├──────────────┤        │
          └──────────────┘   │ id (PK)      │        │
                             │ user (FK)    │        │
                             │ total_amount │        │
          ┌──────────────┐   │ status       │        │
          │  OrderItem   │   │ stripe_id    │        │
          ├──────────────┤   └──────┬───────┘        │
          │ id (PK)      │          │                │
          │ order (FK) ──┘          │                │
          │ book (FK) ──────────────┘ (SET_NULL)     │
          │ book_title   │ (snapshot)                 │
          │ book_price   │ (snapshot)                 │
          │ quantity     │                            │
          └──────────────┘                            │
                                                     │
┌──────────────────┐       ┌──────────────────┐      │
│ SupportSession   │       │ TranscriptMessage│      │
├──────────────────┤       ├──────────────────┤      │
│ id (PK)          │──1:N──│ id (PK)          │      │
│ user (FK)        │       │ session (FK)     │      │
│ livekit_room_name│       │ speaker          │      │
│ vapi_conv_id     │       │ message          │      │
│ started_at       │       │ timestamp        │      │
│ ended_at         │       └──────────────────┘      │
│ duration_seconds │                                  │
│ rating (1-5)     │                                  │
│ feedback         │                                  │
│ summary          │                                  │
│ created_at       │                                  │
└──────────────────┘                                  │
```

---

## API Design

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/books/` | GET | Public | List/search books (paginated) |
| `/api/v1/books/` | POST | Admin | Create book |
| `/api/v1/books/{id}/` | GET/PATCH/DELETE | Admin | Book CRUD |
| `/api/v1/books/{id}/upload-image/` | POST | Admin | Upload to Cloudinary |
| `/api/v1/books/stats/` | GET | Admin | Inventory stats |
| `/api/v1/users/me/` | GET | Authenticated | Current user profile |
| `/api/v1/users/admin/list/` | GET | Admin | All users (paginated) |
| `/api/v1/users/admin/{id}/deactivate/` | POST | Admin | Soft-deactivate user |
| `/api/v1/users/admin/{id}/reactivate/` | POST | Admin | Reactivate user |
| `/api/v1/cart/` | GET/POST | Authenticated | View/add to cart |
| `/api/v1/cart/items/{pk}/` | PATCH/DELETE | Authenticated | Update/remove item |
| `/api/v1/wishlist/` | GET/POST/DELETE | Authenticated | Manage wishlist |
| `/api/v1/orders/` | GET | Authenticated | Order history |
| `/api/v1/orders/admin/list/` | GET | Admin | All orders |
| `/api/v1/orders/admin/{pk}/status/` | PATCH | Admin | Update order status |
| `/api/v1/payments/create-order/` | POST | Authenticated | Create Razorpay order |
| `/api/v1/payments/verify-payment/` | POST | Authenticated | Verify payment signature |
| `/api/vapi/start-session/` | POST | Authenticated | Create Vapi support session |
| `/api/vapi/webhook/` | POST | None | Vapi event webhook |

---

## Authentication Flow

1. Customer signs up / logs in through **Clerk** on the frontend
2. Clerk issues a JWT token — React attaches it as `Authorization: Bearer <token>` on every API request
3. Django's `ClerkJWTAuthentication` class:
   - Extracts the Bearer token from the request header
   - Validates the JWT signature against Clerk's JWKS endpoint
   - Extracts `sub` (clerk_user_id) from the payload
   - Calls `get_or_create_user_from_clerk()` — creates/updates Django `User` + `UserProfile`
   - Syncs role, display name, email from Clerk metadata
4. If `UserProfile.is_active = False` → raises `PermissionDenied("Account is deactivated")` at the authentication layer
5. `IsAdminUser` permission class verifies admin-only endpoints server-side — never trusted from frontend

---

## Payment Flow

- **Cart items** are validated against current stock before Razorpay order creation
- **Inventory deduction** happens immediately at checkout — not after payment
- Razorpay creates a payment order in INR, customer completes payment in the Razorpay modal
- Frontend calls `/verify-payment/` with Razorpay's `payment_id`, `order_id`, and `signature`
- Backend verifies the signature server-side and updates order status to `paid`
- If admin cancels an order, all book quantities are restored to inventory

---

## Admin Features

**Book Management**
- CRUD operations on books with Cloudinary image upload
- Inventory stats — total books, in stock, out of stock counts

**Inventory Management**
- Stock deducted at checkout, restored on cancellation
- Cart updates capped to available quantity — frontend button disabled when max reached

**Order Management**
- View all orders with customer, items, status, total amount
- Update status: pending → paid → delivered → cancelled

**User Management**
- Paginated user list with name, email, order count, active status
- Deactivate / reactivate users without deleting Clerk accounts
- Deactivated users blocked at Django authentication layer

**Support Session Monitoring**
- View all AI voice support sessions with transcript, rating, and AI-generated summary
- KPI boxes: average rating, total rated calls, total calls
- Transcript playback with customer/agent role labels

---

## Security Considerations

- **Clerk JWT verification**: Server-side JWKS validation on every request — no token trust from client
- **Admin-only APIs**: All write endpoints verified via `IsAdminUser` permission class on the server
- **No hard deletes**: Users are soft-deactivated — orders, sessions, transcripts preserved
- **Environment variables**: All secrets in `.env`, excluded from version control
- **Payment verification**: Razorpay signatures verified server-side before updating order status
- **CSRF exemption**: Only on Vapi webhook endpoint (external POST from Vapi servers)
- **Scoped queries**: Cart/wishlist/order views filter by `request.user` — no cross-user access

---

## Future Enhancements

- Intent classification using a fine-tuned LLM to categorize support calls
- Sentiment analysis on transcripts for customer satisfaction tracking
- Automated support insights — trending issues, common questions, resolution rates
- Multi-agent support system for specialized domains (orders, recommendations, returns)

---

## Local Development Setup

### Prerequisites

- Python 3.13+
- Node.js 18+
- PostgreSQL (or Neon database URL)
- Clerk account
- Razorpay test account
- Cloudinary account
- Vapi account (for voice agent)

### Backend

```bash
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Ngrok (Vapi webhook)

```bash
ngrok http 8000
# Copy HTTPS URL → paste in Vapi Dashboard → Assistant → Server URL
# Format: https://xyz.ngrok-free.dev/api/vapi/webhook/
```

---

## Environment Variables

### Backend (`backend/.env`)

```
SECRET_KEY=your-django-secret
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
CLERK_JWKS_URL=https://your-clerk-instance.clerk.accounts.dev/.well-known/jwks.json
CLERK_SECRET_KEY=sk_test_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RAZORPAY_TEST_API=rzp_test_...
RAZORPAY_TEST_SECRET=...
VAPI_API_KEY=...
VAPI_ASSISTANT_ID=...
VAPI_PUBLIC_KEY=...
```

### Frontend (`frontend/.env`)

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

---

## Project Structure

```
bookstore-ai/
├── backend/
│   ├── config/          # Django settings, URLs, WSGI/ASGI
│   └── apps/
│       ├── users/       # Clerk auth, user profiles, admin user management
│       ├── books/       # Book inventory, Cloudinary uploads
│       ├── cart/        # Persistent cart per user
│       ├── wishlist/    # Persistent wishlist per user
│       ├── orders/      # Order history, admin order management
│       ├── payments/    # Razorpay integration
│       ├── support/     # Support sessions, transcripts (LiveKit)
│       ├── vapi_support/# Vapi AI voice agent webhook
│       └── common/      # Pagination, permissions, utilities
├── frontend/
│   └── src/
│       ├── api/         # API client functions
│       ├── components/  # React components
│       ├── pages/       # Route pages
│       └── types/       # TypeScript interfaces
└── docs/                # Project documentation
```

---

## Lessons Learned

**Integrating Clerk with Django.** Clerk handles authentication on the frontend, but Django needs to verify JWTs independently. The key insight was validating tokens against Clerk's JWKS endpoint on every request — never trusting the client. Syncing Clerk metadata to Django's `UserProfile` on each request keeps roles and user data consistent without polling.

**Building a voice-enabled support system.** Vapi's Web SDK abstracts away WebRTC complexity, but the real value comes from the backend integration. Injecting customer context (name, orders, history) into the voice agent's system prompt via `variableValues` made Haney context-aware. The webhook-based transcript and rating capture provides a complete feedback loop — admins see summaries, ratings, and full transcripts without manual intervention.

**Managing ecommerce inventory.** Deducting stock at checkout rather than payment confirmation prevents overselling during the payment delay. Adding a cancellation path that restores inventory closes the loop. Validating quantities at both the frontend (disabled buttons) and backend (capped PATCH) prevents race conditions.

**Vapi WebRTC on localhost.** Voice quality degrades significantly in development due to WebRTC limitations on localhost. The agent works correctly — transcripts store, ratings capture, summaries generate — but audio glitching is inherent to the local development environment and resolves on HTTPS deployment.
