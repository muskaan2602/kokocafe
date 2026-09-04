# KOKO – Café & Bakers

A full-stack QR-based café ordering system built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

---

## Features

- **QR Table Ordering** — Every table has a unique QR code. Customers scan → browse menu → order. No account needed.
- **Real-time Orders** — Manager dashboard receives new orders instantly via Supabase Realtime (no page refresh).
- **Order Status Tracking** — Customers see live status updates (Pending → Accepted → Preparing → Ready → Completed).
- **Manager Dashboard** — Live orders, table management, menu CRUD, analytics.
- **QR Code Generation** — Download/print QR codes for each table directly from the manager panel.
- **Public Website** — Homepage, menu browsing, about, contact pages.

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Framework  | Next.js 16 App Router                  |
| Language   | TypeScript                              |
| Styling    | Tailwind CSS v4                         |
| Database   | Supabase (PostgreSQL)                   |
| Auth       | Supabase Auth                           |
| Realtime   | Supabase Realtime                       |
| QR Codes   | qrcode (npm)                            |
| Deployment | Vercel                                  |

---

## Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd "koko cafe"
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **anon key** from Settings → API

### 3. Configure environment variables

Rename `.env.local` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run the database schema

In your Supabase project, go to **SQL Editor** and run:

1. `supabase/schema.sql` — creates all tables, RLS policies, and realtime
2. `supabase/seed.sql` — seeds categories, menu items, and tables T01–T10

### 5. Create a manager account

In Supabase dashboard → **Authentication** → **Users** → **Add User**:

- Email: `manager@kokocafe.in`
- Password: `your-password`

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Routes

### Public
| Route | Description |
|-------|-------------|
| `/` | Homepage |
| `/menu` | Browse full menu |
| `/about` | About KOKO |
| `/contact` | Location & contact |

### Customer Ordering (QR Flow)
| Route | Description |
|-------|-------------|
| `/order` | QR scan landing / demo table links |
| `/order/T01` | Table 01 ordering page |
| `/order/T01/cart` | Cart for Table 01 |
| `/order/T01/confirmation/[orderId]` | Order confirmation + live status |

### Manager Dashboard (requires auth)
| Route | Description |
|-------|-------------|
| `/manager/login` | Login |
| `/manager` | Dashboard overview |
| `/manager/orders` | Live orders board |
| `/manager/tables` | Table + QR management |
| `/manager/menu` | Menu CRUD |
| `/manager/categories` | Category management |
| `/manager/analytics` | Revenue & order analytics |
| `/manager/settings` | Account settings |

---

## Deploy to Vercel

1. Push your code to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy!

---

## QR Code Usage

1. Go to `/manager/tables`
2. Each table card shows its QR code
3. Click **Download** to save as PNG, or **Print** to get a printable sheet
4. Place printed QR codes in table stands

---

## Database Schema

```
tables          — café seating tables with QR tokens
categories      — menu categories (Coffee, Bakery, etc.)
menu_items      — food & drink items with prices
orders          — placed orders with status
order_items     — individual items in each order
profiles        — manager user profiles
```
