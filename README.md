# AADAIUDAI - Indian Ethnic Dress Shop

A production-ready, full-stack dress shop application inspired by modern Indian clothing e-commerce platforms. Built with React, Node.js, Express, and MongoDB.

## Features

- **Home Page**: Banner carousel, category sections, featured products, search
- **About Page**: Brand story, vision, mission, contact, trust badges
- **Email OTP Authentication**: Email-based login with OTP, no passwords
- **User Profile**: Edit details, manage delivery addresses, order & transaction history
- **Collections**: Browse by category (Sarees, Kurtis, Western Wear, Kids Wear)
- **Cart**: Add, update quantity, remove items, proceed to checkout
- **Checkout & Payment**: UPI/Google Pay integration, payment confirmation
- **Transaction Management**: Store and view transaction history
- **Admin Module**: Dashboard, products CRUD, orders, users, transactions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT, Email OTP (Nodemailer) |
| Desktop | Electron |
| Payment | UPI deep-link |

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

## Setup

### 1. Clone & Install

```bash
cd AADAIUDAI
npm run install:all
```

### 2. Environment

```bash
cd server
cp .env.example .env
# Edit .env - set MONGODB_URI, JWT_SECRET
```

### 3. Seed Database

```bash
npm run seed
```

### 4. Run Development

**If you get "port in use" error:** Close other terminals first, or run:
```powershell
# Find what's using port 5000
netstat -ano | findstr ":5000"
# Kill it (replace <PID> with the number from last column)
taskkill /PID <PID> /F
```

**Option A: Web (recommended)**

```bash
# Terminal 1 - Backend (must start first)
npm run server

# Terminal 2 - Frontend
npm run client
```

Open http://localhost:5173 (or 5174 if 5173 is taken)

**Option B: Desktop (Electron)**

```bash
npm run build
npm run electron
```

### 5. Admin Login

- Email: `admin@aadaiudai.com`  
- OTP: `123456`

### Email Configuration (for real OTP delivery)

To send actual OTP emails, configure in `server/.env`:
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
```

For Gmail: Enable 2FA, then create App Password at https://myaccount.google.com/apppasswords

## Project Structure

```
AADAIUDAI/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Layout, shared components
│   │   ├── context/        # AuthContext
│   │   ├── pages/          # Home, Login, Cart, etc.
│   │   ├── api.js          # API client
│   │   └── main.jsx
│   └── package.json
├── server/                 # Express backend
│   ├── config/             # DB connection
│   ├── controllers/        # Auth, User, Product, Cart, Order, Admin
│   ├── middleware/         # auth, adminAuth
│   ├── models/             # User, Product, Order, Transaction, Cart
│   ├── routes/
│   ├── services/           # OTP service
│   └── scripts/            # seedDatabase.js
├── electron/               # Electron main process
├── database/               # SCHEMA.md
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/send-otp | Send OTP to phone |
| POST | /api/auth/verify-otp | Verify OTP, login |
| GET | /api/auth/me | Current user |
| POST | /api/auth/logout | Logout |
| GET | /api/products | List products (filter: category, search) |
| GET | /api/products/:id | Product detail |
| GET | /api/cart | Get cart |
| POST | /api/cart | Add to cart |
| PATCH | /api/cart | Update quantity |
| DELETE | /api/cart/:id | Remove item |
| POST | /api/orders/from-cart | Create order from cart |
| POST | /api/orders/buy-now | Buy now |
| POST | /api/orders/confirm-payment | Confirm UPI payment |
| GET | /api/admin/* | Admin endpoints (auth required) |

## Features

### Admin Capabilities
- **Dashboard**: View stats, low stock alerts, pending reviews
- **Products**: Add/edit/delete products, upload images, manage stock
- **Orders**: View all orders, update status (pending → confirmed → shipped → delivered)
- **Users**: View all users, change roles, activate/deactivate accounts
- **Reviews**: Approve/reject user reviews, delete inappropriate reviews
- **Transactions**: View all payment transactions

## Security

- OTP-based auth (no passwords)
- JWT for sessions
- Role-based access (user/admin)
- Input validation (express-validator)

## Database Schema

See `database/SCHEMA.md` for full schema.

## Suitable For

- College final-year projects
- Mini projects
- Viva and paper presentations
- Learning full-stack development

## License

MIT
