# CarRental — Fleet & Accounts Management Platform

A professional, production-ready car rental management system built with Next.js and Supabase. Designed for real car rental businesses with a strong emphasis on accounts, finance, and fleet management.

---

## Features

### Customer Facing
- Browse available vehicles with filters (category, transmission, price)
- Vehicle detail pages with image gallery (swipe + arrows)
- Online booking with real-time availability checking
- KYC verification via camera capture (selfie holding driving licence)
- EcoCash / OneMoney payments via Paynow Zimbabwe
- Customer dashboard with booking history and invoices
- PDF invoice download
- Account management and self-deletion

### Admin & Staff
- Role-based access control (Super Admin, Accountant, Fleet Manager, Customer Support)
- Fleet management with multi-image upload, gallery, and status tracking
- Booking management with status workflow (Pending → Confirmed → Active → Completed)
- Auto-invoice generation on booking confirmation
- Full accounts module — invoices, payments, expenses, profit/loss reports
- Customer KYC photo review and account activation
- Staff user creation and management
- Audit log viewer
- Overdue booking auto-detection
- Dark / Light / System theme support
- Email notifications via Resend
- Recharts-powered financial dashboards

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React, Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage, RLS) |
| Payments | Paynow Zimbabwe (EcoCash, OneMoney) |
| Email | Resend |
| PDF | @react-pdf/renderer |
| Charts | Recharts |
| Theming | next-themes |
| Hosting | Vercel |

---

## User Roles

| Role | Access |
|---|---|
| Super Admin | Full system access, staff management, account deletion |
| Accountant | Invoices, payments, expenses, reports |
| Fleet Manager | Vehicles, bookings, maintenance |
| Customer Support | Customers, bookings |
| Customer | Browse, book, pay, manage own account |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Paynow Zimbabwe merchant account
- Resend account (for emails)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/carrental-app.git
cd carrental-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your values in .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## License

MIT License — feel free to use this for your own car rental business.

---

Built using Next.js and Supabase.
