# PDF → QR Frontend (Next.js)

The web client for **PDFtoQR** — upload a PDF, and get a **QR code** that opens
the published PDF instantly. Built with **Next.js 14 (App Router)**, **React 18**,
**TypeScript**, and **Tailwind CSS**, with a polished dark-mode-first UI,
authentication via JWT, and live progress polling against the FastAPI backend.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup (local)](#setup-local)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Pages & Routes](#pages--routes)
- [Client-Side Library (`lib/`)](#client-side-library-lib)
- [Authentication](#authentication)
- [Upload & Live Progress Flow](#upload--live-progress-flow)
- [Theming & Design System](#theming--design-system)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Notes & Known Limits](#notes--known-limits)

---

## Tech Stack

| Concern            | Technology                                     |
| ------------------ | ---------------------------------------------- |
| Framework          | Next.js 14 (App Router)                        |
| UI library         | React 18                                       |
| Language           | TypeScript (strict)                            |
| Styling            | Tailwind CSS 3 (dark mode via class strategy)  |
| HTTP               | Native `fetch`                                 |
| Auth state         | `localStorage` JWT + React context             |
| API base URL       | `NEXT_PUBLIC_API_URL` env var                  |

> There are **no heavy state-management or HTTP libraries** — the app leans on
> React context, native `fetch`, and Next.js primitives to stay lean.

---

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx           # Root layout: providers + global sidebar
│   ├── globals.css          # Tailwind + base styles/utilities
│   ├── page.tsx             # Home: upload + live progress + QR result
│   ├── login/page.tsx       # Sign-in page
│   ├── register/page.tsx    # Create-account page
│   ├── dashboard/page.tsx   # List / delete past uploads
│   └── documents/[id]/page.tsx  # Detail page: status, PDF link, QR
├── lib/
│   ├── auth.ts              # Token storage + fetchUser + authFetch helpers
│   ├── AuthProvider.tsx     # Auth context (user, loading, refreshUser, logout)
│   ├── Toast.tsx            # Toast notification provider
│   ├── ThemeProvider.tsx    # Dark/light theme context
│   ├── Sidebar.tsx          # Persistent navigation sidebar
│   └── Navbar.tsx           # Top navigation bar
├── tailwind.config.js       # Design tokens (colors, animations)
├── next.config.js
├── tsconfig.json
└── package.json
```

**Conventions**

- **App Router**: every folder under `app/` maps to a URL route
  (`app/login` → `/login`, `app/documents/[id]` → `/documents/:id`).
- **`"use client"` components**: all interactive pages/components are client
  components (auth, uploads, polling, toasts).
- **`lib/`**: framework-agnostic client utilities and providers, imported with
  the `@/lib/...` path alias (see `tsconfig.json`).
- **Auth + theme providers** wrap the whole app in `app/layout.tsx`, with a
  persistent `Sidebar` on the left (`md:ml-56` offsets content).

---

## Prerequisites

- **Node.js 18+** (Next.js 14 requirement)
- **npm** (or your preferred package manager)
- The **backend** running (see `../backend/README.md`). The frontend talks to it
  over HTTP on `http://localhost:8000` by default.

---

## Setup (local)

```bash
cd frontend
npm install
```

Create your local env file (see [Environment Variables](#environment-variables)):

```bash
cp .env.local.example .env.local    # or create one manually
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll be redirected to
`/login` until you sign in.

---

## Environment Variables

| Variable               | Required | Default                | Notes                                             |
| ---------------------- | -------- | ---------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`  | —        | `http://localhost:8000`| Base URL of the FastAPI backend. **Must be a public-build-time var** (Next.js exposes `NEXT_PUBLIC_*` to the browser). |

Set it per environment (`.env.local` for local dev, dashboard/project settings
for Vercel/deploy).

---

## Running the App

```bash
npm run dev       # development (hot reload)
npm run build     # production build
npm run start     # serve the production build
npm run lint      # ESLint via next lint
```

---

## Pages & Routes

| Route                   | File                          | Purpose                                                            |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------ |
| `/`                     | `app/page.tsx`                | **Home** — file picker, upload, live progress bar, and the QR code result once live. Redirects to `/login` when signed out. |
| `/login`                | `app/login/page.tsx`          | Sign-in form. Redirects to `/` when already authenticated.         |
| `/register`             | `app/register/page.tsx`       | Account creation form. Redirects to `/` after success.             |
| `/dashboard`            | `app/dashboard/page.tsx`      | History of the user’s documents (filename, status, QR link), with delete actions and full account deletion. |
| `/documents/[id]`       | `app/documents/[id]/page.tsx` | Per-document detail: status badge, progress, live PDF link, QR code. Guarded: requires an authenticated session. |

---

## Client-Side Library (`lib/`)

### `lib/auth.ts`
Pure client helpers for JWT handling:
- `getToken()` / `setToken()` / `clearToken()` — persist the JWT in
  `localStorage` under `pdfqr_token`.
- `isAuthenticated()` — quick presence check.
- `fetchUser()` — calls `GET /auth/me` with the stored token; clears the token
  if the session is invalid/expired.
- `authFetch(url, options)` — wraps `fetch`, automatically adding the
  `Authorization: Bearer <token>` header.

### `lib/AuthProvider.tsx`
React context providing `{ user, loading, refreshUser, logout }`:
- On mount it validates the stored token via `fetchUser()`.
- `logout()` clears the token and resets state (used by the sidebar/navbar).
- `useAuth()` is the hook consumed by pages and nav components.

### `lib/Toast.tsx`
`ToastProvider` + `useToast()` for lightweight, type-able notifications
(`success` / `error` / `info`).

### `lib/ThemeProvider.tsx`
Dark/light theme context (class-based `dark` mode, persisted per user
preference).

### `lib/Sidebar.tsx` / `lib/Navbar.tsx`
Persistent navigation: sidebar (brand, nav links, user menu, logout) and an
optional top navbar.

---

## Authentication

1. User submits the login or register form.
2. The page POSTs **JSON** `{ "username", "password" }` to
   `POST /auth/login` or `POST /auth/register` (credentials are never put in
   the URL).
3. On success the API returns `{ token, user }`; the page stores the token via
   `setToken()` and calls `refreshUser()` to hydrate the `AuthProvider`.
4. Protected fetches use `authFetch(...)` or add
   `Authorization: Bearer <token>` manually.
5. On a `401` from a protected call the UI clears the session and redirects to
   `/login` with a “Session expired” toast.

---

## Upload & Live Progress Flow

On the home page (`app/page.tsx`):

1. The user picks a `.pdf` file (validated client-side for extension).
2. `POST /upload` is called with `multipart/form-data` (field `file`) and the
   bearer token.
3. The backend returns `{ id, filename, status: "processing" }` **immediately**.
4. The page starts **polling** `GET /status/{id}` (with the token) every
   `POLL_INTERVAL_MS` (4 s) for up to `MAX_POLL_MINUTES` (11 min).
   - `live` → render the QR code (`qr_code_base64`) + the PDF URL.
   - `failed` → show the error message and stop.
   - `401` → session expired; redirect to login.
5. The same document can be revisited later from the dashboard or
   `/documents/[id]`, which re-fetches the status (and regenerates the QR on the
   detail page).

---

## Theming & Design System

All design tokens live in `tailwind.config.js`:

- **Dark mode**: `class` strategy; `ThemeProvider` toggles the `dark` class on
  `<html>`.
- **Brand palette**: a slate/steel-blue family (`brand-50` → `brand-900`) plus
  grayscale ramps (`charcoal_blue`, `stone_gray`, `jet_gray`, `jet_black`,
  `deep_jet`, `carbon_black`, `ink_black`, `onyx`, `near_black`, `pure_black`).
- **Typography**: Inter (fallback `system-ui`).
- **Motion**: custom keyframes/animations — `fade-in`, `slide-up`,
  `progress-shimmer`, `scale-in`, `shake` — with `out-quart` / `out-quint` /
  `out-expo` easing utilities.
- Components use utility classes like `card`, `btn-primary`, and `input-field`
  (defined in `app/globals.css`).

---

## Scripts

| Command          | Description                         |
| ---------------- | ----------------------------------- |
| `npm run dev`    | Start the Next.js dev server        |
| `npm run build`  | Create an optimized production build|
| `npm run start`  | Serve the production build          |
| `npm run lint`   | Run ESLint (`next lint`)            |

---

## Deployment

**Vercel** is the simplest fit for Next.js:

1. Import the `frontend/` folder (or the repo root) into a Vercel project.
2. Set `NEXT_PUBLIC_API_URL` to the deployed backend URL (e.g.
   `https://your-backend.onrender.com`).
3. Deploy. Any host with Node 18+ that can run `next build` works too.

**Backend pairing**: see `../backend/README.md` for the API, auth, and
deployment notes. The frontend and backend must share CORS (`ALLOWED_ORIGINS`
on the backend must include the frontend origin).

---

## Notes & Known Limits

- **Public PDFs**: uploaded PDFs are served from public GitHub Pages repos —
  anyone with the URL/QR can view them. Don’t upload sensitive documents.
- **Max 20 MB uploads** (enforced by the backend).
- **No refresh tokens** — the JWT expires after 72 hours; users sign in again.
- **Publishing takes ~20 s to a few minutes** — the UI communicates this via
  the live progress bar; don’t expect instant QR codes.
- **Deleting** a document (or account) also removes its GitHub repo, so the QR
  code stops resolving.