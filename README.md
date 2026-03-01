# Proofrr Admin Dashboard

Standalone React + Vite admin dashboard for Proofrr.

## Features

- Admin login with token APIs:
  - `POST /api/auth/login`
  - `POST /api/auth/google`
- `accessRole: "admin"` guard on client side.
- Dashboard page using:
  - `GET /api/admin/dashboard`
- Login activity page using:
  - `GET /api/admin/dashboard/login-activity`
- Handles common auth/admin errors (`400`, `401`, `403`).

## Project Setup

```bash
cd admin-dashboard
npm install
npm run dev
```

By default, the app uses:

- local frontend origin `/api` while running on localhost (through Vite proxy)
- fallback API origin: `http://localhost:8081/api`

You can override with:

```bash
VITE_API_BASE_URL=https://api.your-domain.com/api
```

## Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - run eslint

## Auth Behavior

- Only users with `accessRole: "admin"` can continue to dashboard.
- Non-admin login is blocked with a `403` style message.
- Missing/expired token logs user out and redirects to login.
