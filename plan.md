# IOMS Implementation Plan

## Progress

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Foundation | ✅ COMPLETE | Project setup, DB schema, Auth, Base UI |
| Phase 2: Core Modules | ✅ COMPLETE | Clients, Projects, Credentials, Billing |
| Phase 3: Infrastructure | ✅ COMPLETE | Servers, Domains, Reminders |
| Phase 4: Utilities | ✅ COMPLETE | URL Shortener, QR Generator |
| Phase 5: Dashboard & Search | ✅ COMPLETE | Dashboard stats API, Global Search, Recharts charts |
| Phase 6: Security & Audit | ✅ COMPLETE | Audit logs, RBAC enforcement, login history |
| Phase 7: Polish & Deployment | ✅ COMPLETE | Toast notifications, confirmation dialogs, responsive design, testing, API docs |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| TypeScript 5.8 | Type safety |
| Vite 6 | Build tool & dev server |
| Tailwind CSS 4 | Styling |
| React Router v7 | Client-side routing |
| Zustand | State management |
| React Hook Form + Zod | Form handling & validation |
| Lucide React | Icons |
| Axios | HTTP client |
| QRCode.react | QR code generation |
| Date-fns | Date formatting |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express 4 | HTTP framework |
| TypeScript | Type safety |
| Prisma ORM | Database ORM |
| MySQL 8 | Database |
| JWT (jsonwebtoken) | Authentication |
| bcrypt | Password hashing |
| AES-256-GCM | Credential encryption |
| Zod | Request validation |
| node-cron | Scheduled jobs |
| qrcode | QR code generation |
| cors | Cross-origin requests |
| dotenv | Environment config |

### DevOps
| Technology | Purpose |
|------------|---------|
| Local MySQL 8 | Database (locally installed) |

---

## Project Structure

```
internal-service-application/
├── frontend/
│   ├── src/
│   │   ├── api/                 # API client & endpoint functions
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ui/              # Base components (Button, Input, Modal, etc.)
│   │   │   └── layout/          # Sidebar, TopBar, PageWrapper
│   │   ├── pages/               # Route-level page components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── store/               # Zustand stores
│   │   ├── types/               # Shared TypeScript types
│   │   ├── utils/               # Helper functions
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── config/              # DB, JWT, encryption config
│   │   ├── middleware/           # Auth, error, validation middleware
│   │   ├── modules/             # Feature modules
│   │   │   ├── auth/
│   │   │   ├── clients/
│   │   │   ├── projects/
│   │   │   ├── servers/
│   │   │   ├── domains/
│   │   │   ├── credentials/
│   │   │   ├── urls/
│   │   │   ├── qrcodes/
│   │   │   ├── reminders/
│   │   │   ├── dashboard/       # TODO
│   │   │   └── search/          # TODO
│   │   ├── utils/               # Encryption, cron, helpers
│   │   └── index.ts             # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── PRD.md
└── plan.md
```

---

## Phase 1: Foundation ✅ COMPLETE

### 1.1 Project Scaffolding ✅
- Cleaned up existing frontend code (removed expense management code)
- Set up frontend folder with React 19 + Vite 6 + Tailwind CSS 4 + TypeScript
- Set up backend folder with Express 4 + TypeScript + Prisma ORM
- Configured local MySQL 8 database (`ioms_db` on `localhost:3306`)

### 1.2 Database Schema (Prisma) ✅
Models implemented:
- User, Client, Project, Billing, Asset, Credential
- Server, Domain, ShortUrl, ClickLog, AuditLog, Notification, QrCode

### 1.3 Authentication System ✅
- **Backend**: JWT access + refresh tokens, bcrypt password hashing, register/login/refresh/me endpoints
- **Frontend**: Login page, auth store (Zustand with persist), protected routes, Axios interceptor for token refresh
- **Roles**: ADMIN, PROJECT_MANAGER, DEVELOPER, ACCOUNTS, OPERATIONS

### 1.4 Base UI Component Library ✅
Built in `frontend/src/components/ui/`:
- Button, Input, Select, Textarea
- Card, Badge, StatusPill
- Modal, Skeleton
- PageHeader, PageWrapper

---

## Phase 2: Core Modules ✅ COMPLETE

### 2.1 Client Management ✅
**Backend:** CRUD endpoints with pagination, search, status filter
**Frontend:**
- Client list page (card layout with search, status filter)
- Client detail page (tabs: Projects, Servers, Domains)
- Client create/edit page with form validation

### 2.2 Project Management ✅
**Backend:** CRUD endpoints with pagination, search, status/client filters
**Frontend:**
- Project list page (card layout)
- Project detail page (tabs: Overview, Assets, Credentials, Billing)
- Project create page with client selector

### 2.3 Credentials Management (Encrypted) ✅
**Backend:**
- AES-256-GCM encryption for password field (`src/utils/encryption.ts`)
- `GET /api/credentials/:id/reveal` — decrypt on demand with audit logging
**Frontend:**
- Show/hide password toggle, copy-to-clipboard
- Add credential modal on project detail page

### 2.4 Billing Management ✅
**Backend:** CRUD endpoints with status filter
**Frontend:**
- Billing table with status badges (Pending, Paid, Overdue, Cancelled)
- Add billing modal on project detail page

---

## Phase 3: Infrastructure Modules ✅ COMPLETE

### 3.1 Server Management ✅
**Backend:** CRUD endpoints with pagination, search, status/client/provider filters, `GET /api/servers/expiring`
**Frontend:**
- Servers list page (card layout with expiry countdown badges)
- Server detail page (3-column cards: General, Financial, Status + edit modal)
- Server create page with client selector

### 3.2 Domain Management ✅
**Backend:** CRUD endpoints with pagination, search, `GET /api/domains/expiring`
**Frontend:**
- Domains list page (card layout with domain/SSL expiry badges, auto-renewal toggle)
- Domain detail page (3-column cards + edit modal)
- Domain create page with client selector

### 3.3 Reminder Module ✅
**Backend:**
- `node-cron` daily job (`src/utils/cron.ts`) checking 7 expiry thresholds (90/60/30/15/7/3/1 days)
- Auto-updates server status to EXPIRED/EXPIRING_SOON
- Creates Notification records for expiring items
- `GET /api/reminders/expiring` — returns items by urgency (critical/warning/info)
- `GET /api/reminders/notifications` — list with unread filter
- `PUT /api/reminders/notifications/:id/read` — mark as read
- `PUT /api/reminders/notifications/read-all` — mark all as read
- `DELETE /api/reminders/notifications/:id` — dismiss

**Frontend:**
- Reminders page with stats cards (expired/expiring30/expiring60)
- Tabs: Expiring Items (with urgency badges) + Notifications (mark read/dismiss)

### 3.4 Dashboard (Basic) ✅
**Frontend:**
- 4 stat cards: Total Clients, Active Projects, Servers Expiring, Domains Expiring
- Expiring Servers widget (top 5 with countdown)
- Expiring Domains widget (top 5 with countdown)
- Active Projects widget (top 5)

---

## Phase 4: Utilities ✅ COMPLETE

### 4.1 URL Shortener ✅
**Backend:**
- `POST /api/urls` — Create (auto-generated short code or custom alias, optional expiry)
- `GET /api/urls` — List with pagination, search
- `GET /api/urls/:id` — Get by ID
- `GET /api/urls/:id/stats` — Click analytics (24h/7d/30d, referer breakdown, recent clicks)
- `DELETE /api/urls/:id` — Delete
- `GET /s/:shortCode` — Public redirect with click tracking (IP, User-Agent, Referer)

**Frontend:**
- URLs list page (card grid with search, expiry badges, copy-to-clipboard)
- URL create page (form with original URL, custom alias, expiry)
- URL detail page (analytics dashboard: click stats, referer breakdown, recent clicks table)

### 4.2 QR Code Generator ✅
**Backend:**
- `POST /api/qrcodes/generate` — Generate QR (SVG/PNG, customizable colors/size)
- `GET /api/qrcodes` — List saved QR codes
- `GET /api/qrcodes/:id` — Get by ID (regenerates QR data)
- `DELETE /api/qrcodes/:id` — Delete

**Frontend:**
- QR create page (form with type selector: URL/Text/Email/Phone/Wi-Fi, color pickers, size, live preview, download)
- QR codes list page (card grid with search, type badges)
- QR detail page (preview, download, delete)

---

## Phase 5: Dashboard & Search 🔲 TODO

### 5.1 Dashboard API
**Backend:**
- `GET /api/dashboard/stats` — Aggregated counts
  - Total clients, active projects
  - Domains expiring (30/60/90 days)
  - Servers expiring (30/60/90 days)
  - Pending billing total
  - Recent activity log
  - Top URLs by clicks

**Frontend:**
- Enhanced dashboard with Recharts charts
- Pending billing summary
- Recent activity timeline
- URL analytics chart

### 5.2 Global Search
**Backend:**
- `GET /api/search?q=term` — Search across clients, projects, domains, servers, billing, URLs
- Returns grouped results with entity type labels

**Frontend:**
- Search bar in TopBar (Cmd+K shortcut)
- Search results dropdown with grouped categories
- Full search results page

---

## Phase 6: Security & Audit 🔲 TODO

### 6.1 Audit Logging
- Log all CRUD operations on sensitive entities
- Log credential reveals
- Log authentication events (login, logout, failed attempts)
- `GET /api/audit-logs` — Admin-only endpoint with filters
- Audit log viewer page (Admin only)

### 6.2 Session Management
- JWT access token: 15 min expiry
- Refresh token: 7 days expiry
- Session timeout configurable per role
- Login history tracking

### 6.3 Role-Based Access Control (RBAC)
| Feature | Admin | PM | Developer | Accounts | Operations |
|---------|-------|-----|-----------|----------|------------|
| Clients | Full | Full | View | View | View |
| Projects | Full | Full | View assigned | View | View |
| Credentials | Full + Reveal | Full + Reveal | View masked | - | - |
| Billing | Full | View | - | Full | - |
| Servers | Full | View | View | - | Full |
| Domains | Full | View | View | - | Full |
| URLs | Full | Full | Full | Full | Full |
| QR Codes | Full | Full | Full | Full | Full |
| Audit Logs | Full | - | - | - | - |
| Users | Full | - | - | - | - |
| Reminders | Full | View | View | View | View |

---

## Phase 7: Polish & Deployment 🔲 TODO

### 7.1 UI Polish
- Loading states, empty states, error states for all pages
- Responsive design (mobile sidebar collapse)
- Dark mode support (optional)
- Keyboard navigation
- Toast notifications for all actions
- Confirmation dialogs for destructive actions

### 7.2 Testing
- Backend: Unit tests for utils, integration tests for API endpoints
- Frontend: Component tests with Vitest + React Testing Library
- E2E tests (optional, Playwright)

### 7.3 Deployment
- Environment variable documentation
- Production build scripts

### 7.4 Documentation
- API documentation (Swagger/OpenAPI)
- User guide
- Developer setup guide

---

## Database Seeding

Seed script (`backend/prisma/seed.ts`) creates:
- 5 users: admin, PM, developer, accounts, operations (all password: `password123`)
- 2 clients with related projects
- Sample servers, domains, credentials, billing entries
- Notification records for expiring items

---

## Verification Status

| Check | Status |
|-------|--------|
| Backend TypeScript (`npx tsc --noEmit`) | ✅ 0 errors |
| Frontend TypeScript (`npx tsc --noEmit`) | ✅ 0 errors |
| Backend build (`npm run build`) | ✅ Success |
| Frontend build (`npm run build`) | ✅ Success |
| Database schema pushed | ✅ Synced |
| Seed data loaded | ✅ Verified |
