# Affiliate Programs Management System

A comprehensive platform for managing affiliate programs, tracking conversions, calculating commissions, and processing payouts.

## 🚀 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Primary database
- **Redis** - Caching and background tasks
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations
- **JWT** - Authentication

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **TanStack Query** - Data fetching
- **Axios** - HTTP client

## 📁 Project Structure

```
affiliate-mng/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core utilities (security, config)
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   ├── tasks/          # Background tasks
│   │   └── utils/          # Utility functions
│   ├── alembic/            # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/               # Next.js 16 frontend
│   ├── app/               # App router pages
│   │   ├── (auth)/        # Authentication pages
│   │   ├── (admin)/       # Admin dashboard
│   │   └── (affiliate)/   # Affiliate portal
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and API client
│   ├── types/            # TypeScript types
│   ├── package.json
│   └── Dockerfile
│
└── docker-compose.yml     # Docker orchestration
```

## 🏃 Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd affiliate-mng
   ```

2. **Set up environment variables**

   Backend:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your settings
   ```

   Frontend:
   ```bash
   cd frontend
   cp .env.local.example .env.local
   # Edit .env.local with your settings
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/api/v1/docs

### Local Development (Without Docker)

#### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up PostgreSQL and Redis**
   ```bash
   # Make sure PostgreSQL and Redis are running
   # Update .env with your database credentials
   ```

3. **Run migrations**
   ```bash
   alembic upgrade head
   ```

4. **Start the server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:3000

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:
- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc

## 🔐 Authentication

The system uses JWT-based authentication with:
- **Access tokens**: 15 minutes expiry
- **Refresh tokens**: 7 days expiry

### User Roles
- **Admin**: Full system access, manage all resources
- **Affiliate**: Access to affiliate portal, manage own data
- **Customer**: Basic access, track own referrals

## 🗄️ Database

### Running Migrations

Create a new migration:
```bash
cd backend
alembic revision --autogenerate -m "description of changes"
```

Apply migrations:
```bash
alembic upgrade head
```

Rollback migration:
```bash
alembic downgrade -1
```

### Initial Data

To create the first admin user, update these variables in `backend/.env`:
```
FIRST_SUPERUSER_EMAIL=admin@example.com
FIRST_SUPERUSER_PASSWORD=changeme123
```

Then run the initialization script (to be implemented in Phase 2).

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚢 Deployment

### Production Considerations

1. **Environment Variables**
   - Generate a secure `SECRET_KEY` for JWT
   - Use strong database passwords
   - Configure proper CORS origins

2. **Database**
   - Use managed PostgreSQL (AWS RDS, DigitalOcean)
   - Enable SSL connections
   - Regular backups

3. **Redis**
   - Use managed Redis (Redis Cloud, AWS ElastiCache)
   - Configure persistence

4. **Frontend**
   - Deploy to Vercel or Netlify
   - Set `NEXT_PUBLIC_API_URL` to production API

5. **Backend**
   - Deploy to cloud VPS or PaaS (Railway, Render)
   - Use proper WSGI server (Gunicorn + Uvicorn)
   - Enable HTTPS

## 📝 Features (Phase 1 - Complete)

### Backend
- ✅ User authentication (JWT)
- ✅ Role-based access control
- ✅ User management endpoints
- ✅ Database models (User, Affiliate, Program)
- ✅ Database migrations with Alembic
- ✅ API documentation (Swagger/ReDoc)

### Frontend
- ✅ Next.js 16 with App Router
- ✅ Authentication pages (login, register)
- ✅ Admin dashboard layout
- ✅ Affiliate portal layout
- ✅ API client with automatic token refresh
- ✅ Responsive design with Tailwind CSS

## 🔜 Next Phases

### Phase 2: Core Affiliate Features
- Affiliate profile management
- Affiliate application & approval workflow
- Program management (CRUD)
- Referral link generation
- Click tracking

### Phase 3: Commission System
- Commission rules engine
- Conversion tracking
- Commission calculation
- Approval workflow

### Phase 4: Payouts & Analytics
- Payout generation & processing
- Analytics dashboards
- Performance metrics
- Charts and visualizations

### Phase 5: Marketing & Polish
- Marketing materials management
- Email notifications
- Testing
- Documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Phase 1 Complete** ✅
- Backend structure with FastAPI
- Frontend with Next.js 16
- Authentication system
- Basic layouts and navigation
- Docker setup for development
