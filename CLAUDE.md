# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack **Affiliate Programs Management System** for tracking conversions, calculating commissions, and processing payouts. The platform supports multiple user roles (Admin, Affiliate, Customer) with separate dashboards and workflows.

**Current Status**: Phase 5 Complete - All core features implemented including advanced analytics and settings management.

## Tech Stack

### Backend (FastAPI)
- **Framework**: FastAPI 0.104.1
- **Database**: PostgreSQL 15 with SQLAlchemy 2.0.23
- **Migrations**: Alembic 1.12.1
- **Auth**: JWT with python-jose and passlib/bcrypt
- **Caching**: Redis 5.0.1
- **API Docs**: Auto-generated Swagger/ReDoc at `/api/v1/docs` and `/api/v1/redoc`

### Frontend (Next.js 16)
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5.7.2
- **UI**: Tailwind CSS 3.4.17
- **State**: Zustand 5.0.2
- **Data Fetching**: TanStack Query 5.59.20
- **HTTP Client**: Axios 1.7.7

### Additional Components
- **Tracking SDK**: Lightweight JavaScript SDK in `sdk/` for client-side conversion tracking
- **Docker**: Full containerized setup with PostgreSQL, Redis, backend, and frontend

## Common Development Commands

### Backend Development

```bash
# Start backend server (development)
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run database migrations
cd backend
alembic upgrade head

# Create new migration
cd backend
alembic revision --autogenerate -m "description"

# Rollback last migration
cd backend
alembic downgrade -1

# Run tests
cd backend
pytest

# Seed database with test data
cd backend
python seed_db.py
```

### Frontend Development

```bash
# Start development server
cd frontend
npm run dev

# Build for production
cd frontend
npm run build

# Start production server
cd frontend
npm run start

# Run linter
cd frontend
npm run lint
```

### Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service_name]

# Run migrations in container
docker-compose exec backend alembic upgrade head

# Stop all services
docker-compose down

# Rebuild containers
docker-compose up -d --build
```

### SDK Development

```bash
# Build tracking SDK
cd sdk
npm run build

# Build and watch for changes
cd sdk
npm run dev

# Type check
cd sdk
npm run typecheck
```

## Architecture & Code Structure

### Backend Architecture

The backend follows a **layered architecture** with clear separation of concerns:

```
backend/app/
├── api/v1/endpoints/     # REST API route handlers
├── core/                 # Security, config, exceptions
├── models/               # SQLAlchemy database models
├── schemas/              # Pydantic request/response schemas
├── services/             # Business logic layer
└── utils/                # Helper functions
```

**Key architectural patterns**:
- **Service layer pattern**: Business logic lives in `services/`, not in endpoints
- **Dependency injection**: Database sessions and auth injected via FastAPI dependencies
- **Schema validation**: All input/output validated with Pydantic schemas
- **Transaction management**: Services handle database transactions

**Important services**:
- `commission_service.py`: Commission calculation engine with tiered rates
- `conversion_service.py`: Conversion tracking and validation workflow
- `payout_service.py`: Batch payout generation and processing
- `referral_service.py`: Referral link and click tracking

### Database Schema

**Core entities**:
- `users` → `affiliate_profiles` (1:1)
- `affiliate_programs` → `program_enrollments` ← `affiliate_profiles` (M:N)
- `referral_links` → `referral_clicks` (1:N)
- `referral_links` → `conversions` → `commissions` → `payouts` (workflow chain)
- `affiliate_tiers` → commission multipliers

**Critical relationships**:
- Conversions link to: referral_link, affiliate, program, and optionally customer
- Commissions are 1:1 with conversions (unique constraint)
- Payouts aggregate multiple commissions for a single affiliate

### Frontend Architecture

The frontend uses **Next.js App Router** with route-based organization:

```
frontend/app/
├── (auth)/          # Login, register pages (unauthenticated)
├── (admin)/         # Admin dashboard and management pages
├── (affiliate)/     # Affiliate portal and analytics
├── layout.tsx       # Root layout with providers
└── providers.tsx    # React Query and Zustand setup
```

**Key patterns**:
- **Server components by default**: Client components marked with 'use client'
- **API client pattern**: All API calls go through `lib/api.ts` singleton
- **Token management**: Automatic refresh token handling in axios interceptors
- **Type safety**: Shared TypeScript types in `types/index.ts`

**State management**:
- **Global auth state**: Zustand store in `lib/store.ts`
- **Server data**: TanStack Query for caching and synchronization
- **Local UI state**: React useState for component-level state

### API Structure

**Endpoint organization**:
- `/api/v1/auth/*` - Authentication (login, register, refresh)
- `/api/v1/users/*` - User management
- `/api/v1/affiliates/*` - Affiliate applications and profiles
- `/api/v1/programs/*` - Program management and enrollments
- `/api/v1/referrals/*` - Referral link and click tracking
- `/api/v1/conversions/*` - Conversion tracking and validation
- `/api/v1/commissions/*` - Commission approval and statistics
- `/api/v1/payouts/*` - Payout generation and processing
- `/sdk/*` - JavaScript SDK static files (minified, unminified, ESM, TypeScript definitions)

**Authentication flow**:
1. Login returns access_token (15min) and refresh_token (7 days)
2. Frontend stores tokens in Zustand
3. Axios interceptor adds Authorization header
4. Token refresh happens automatically on 401 responses

### Commission Calculation System

**Commission types** (configured per program):
- **Percentage**: Commission = conversion_value × rate
- **Fixed**: Commission = fixed amount per conversion
- **Tiered**: Base calculation × tier_multiplier

**Workflow**: Conversion (pending) → Validated → Commission Created (pending) → Approved → Included in Payout → Paid

**Tier system**: Affiliates automatically upgrade based on performance (total conversions and revenue). Tiers apply multipliers (e.g., 1.2x, 1.5x, 2.0x) to commission calculations.

### Frontend Page Responsibilities

**Admin pages**:
- `dashboard/page.tsx` - Overview metrics, pending actions, quick navigation
- `affiliates/page.tsx` - Approve/reject affiliate applications
- `programs/page.tsx` - CRUD operations on affiliate programs
- `conversions/page.tsx` - Validate/reject conversions
- `commissions/page.tsx` - Approve commissions for payment
- `payouts/page.tsx` - Generate and process batch payouts
- `analytics/page.tsx` - Business intelligence with timeframe filtering and CSV export
- `settings/page.tsx` - Platform configuration (commission defaults, tiers, notifications)

**Affiliate pages**:
- `dashboard/page.tsx` - Personal performance overview
- `apply/page.tsx` - Affiliate application form
- `profile/page.tsx` - Update affiliate profile
- `programs/page.tsx` - Browse and enroll in programs
- `links/page.tsx` - Create and manage referral links with UTM parameters
- `commissions/page.tsx` - View earnings and commission history
- `payouts/page.tsx` - Track payment status
- `performance/page.tsx` - Detailed analytics with performance grades

### Tracking SDK

The JavaScript SDK in `sdk/` enables client-side conversion tracking:

**Key features**:
- Auto-detects referral codes from URL parameters (`?ref=CODE`)
- Stores session data in cookies/localStorage
- Tracks conversions via `AffiliateSDK.trackConversion()`
- GDPR-compliant with consent management
- Built with Rollup for multiple output formats (UMD, ESM)

**Integration**: Include SDK script on merchant websites to automatically attribute conversions to affiliates.

**SDK Hosting**: The backend serves SDK files as static assets:
- **Development**: `http://localhost:8000/sdk/affiliate-sdk.min.js`
- **Production**: `https://your-api-domain.com/sdk/affiliate-sdk.min.js`
- SDK files are mounted from `sdk/dist/` directory via Docker volume
- Available files: `affiliate-sdk.min.js` (production), `affiliate-sdk.js` (debug), `affiliate-sdk.esm.js` (ESM), `index.d.ts` (TypeScript)

**Building and deploying SDK**:
```bash
# Build SDK files
cd sdk
npm run build

# Or use the convenience script (Linux/Mac)
./scripts/build-and-deploy-sdk.sh

# Or on Windows
scripts\build-and-deploy-sdk.bat

# Restart backend to pick up changes
docker-compose restart backend
```

The backend automatically serves SDK files from `/sdk` endpoint when `sdk/dist/` directory exists.

## Development Workflow Notes

### Running Tests
- Backend tests use pytest with conftest.py fixtures
- Test files in `backend/tests/`
- Run specific test: `pytest backend/tests/test_program_types.py`

### Database Migrations
- Always review auto-generated migrations before applying
- Alembic creates migrations in `backend/alembic/versions/`
- Migration naming: `001_description.py`, `002_description.py`, etc.
- Database enum types used for status fields (check `models/` for valid values)

### Environment Variables
- Backend: Copy `backend/.env.example` to `backend/.env`
- Frontend: Copy `frontend/.env.local.example` to `frontend/.env.local`
- Critical settings: `DATABASE_URL`, `SECRET_KEY`, `NEXT_PUBLIC_API_URL`

### CORS Configuration
- Backend CORS origins in `app/core/config.py` (default: localhost:3000)
- Update for production deployments
- Frontend API URL in `next.config.ts` and `.env.local`

### Role-Based Access Control
- Implemented at endpoint level with `get_current_active_user` dependency
- Role checks in service layer for data filtering
- Admins see all data, affiliates see only their own data
- User roles stored in `users.role` enum field

### Commission Calculation
- Service: `backend/app/services/commission_service.py`
- Supports percentage, fixed amount, and tiered calculations
- Tier multipliers applied automatically based on affiliate's current tier
- Commission approval required before inclusion in payouts

## Common Pitfalls

1. **Migration conflicts**: If migration fails, check for existing enum types or columns in database
2. **CORS errors**: Ensure frontend URL is in `CORS_ORIGINS` list
3. **Token expiry**: Access tokens expire in 15 minutes; frontend handles refresh automatically
4. **Customer ID in conversions**: For lead-gen forms without user accounts, omit `customer_id` and store contact info in `metadata` field instead
5. **Payout cancellation**: Canceling a payout rolls back commission statuses from "paid" to "approved"
6. **SDK not available**: If `/sdk` endpoint returns 404, ensure SDK is built (`cd sdk && npm run build`) and backend container is restarted (`docker-compose restart backend`)

## API Access

Once backend is running:
- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc
- **Health check**: http://localhost:8000/health
- **SDK Files**: http://localhost:8000/sdk/affiliate-sdk.min.js
- **SDK Info**: http://localhost:8000/ (root endpoint shows SDK availability)
- **Frontend**: http://localhost:3000

## Phase Implementation Status

✅ **Phase 1**: Authentication, user management, basic CRUD
✅ **Phase 2**: Affiliate applications, programs, referral tracking
✅ **Phase 3**: Conversions, commissions, payouts
✅ **Phase 4**: Dashboards, analytics, performance metrics
✅ **Phase 5**: Advanced analytics, platform settings

## Additional Resources

- Phase summaries: `PHASE3_SUMMARY.md`, `PHASE4_SUMMARY.md`, `PHASE5_SUMMARY.md`
- Backend-specific info: `backend/README.md`
- SDK documentation: `sdk/README.md`
- Main README: `README.md`
