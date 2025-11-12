# Next Steps - Getting Started

## 🎉 Phase 1 Complete!

Your affiliate programs management system foundation is ready. Here's how to get started:

## 🚀 Quick Start

### 1. Start the Development Environment

```bash
# Navigate to project directory
cd affiliate-mng

# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up -d

# Watch the logs (optional)
docker-compose logs -f
```

### 2. Initialize the Database

```bash
# Run database migrations
docker-compose exec backend alembic upgrade head

# Verify migrations
docker-compose exec backend alembic current
```

### 3. Install Frontend Dependencies

```bash
# If not using Docker, install Node dependencies
cd frontend
npm install
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/v1/docs

## 📋 What's Working Now

### Backend Features ✅
- User registration and authentication
- JWT token-based auth (access + refresh tokens)
- Role-based access control (Admin, Affiliate, Customer)
- User management API endpoints
- Comprehensive API documentation
- Database models and migrations
- Secure password hashing

### Frontend Features ✅
- Landing page
- Login page
- Registration page
- Admin dashboard layout
- Affiliate portal layout
- Automatic token refresh
- Protected routes

## 🧪 Test the Application

### 1. Create Your First Admin User

**Option A: Via API Documentation**
1. Go to http://localhost:8000/api/v1/docs
2. Find `POST /api/v1/auth/register`
3. Click "Try it out"
4. Use this payload:
```json
{
  "email": "admin@example.com",
  "password": "SecurePass123!",
  "first_name": "Admin",
  "last_name": "User",
  "role": "admin"
}
```
5. Execute

**Option B: Via Frontend**
1. Go to http://localhost:3000
2. Click "Register"
3. Fill in the form
4. Select "Customer" or "Affiliate" (you can change to admin later via API)

### 2. Login

1. Go to http://localhost:3000/login
2. Enter your credentials
3. You'll be redirected to the appropriate dashboard

## 🛠️ Development Workflow

### Backend Development

```bash
# View backend logs
docker-compose logs -f backend

# Access backend container
docker-compose exec backend bash

# Run Alembic commands
docker-compose exec backend alembic revision --autogenerate -m "description"
docker-compose exec backend alembic upgrade head

# Restart backend
docker-compose restart backend
```

### Frontend Development

```bash
# View frontend logs
docker-compose logs -f frontend

# Access frontend container
docker-compose exec frontend sh

# Rebuild frontend
docker-compose restart frontend

# Or run locally (faster for development)
cd frontend
npm run dev
```

### Database Access

```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d affiliate_mng

# View tables
\dt

# View specific table
SELECT * FROM users;
```

### Redis Access

```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# View all keys
KEYS *
```

## 📚 Available API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout

### Users
- `GET /api/v1/users/me` - Get current user
- `PATCH /api/v1/users/me` - Update current user
- `GET /api/v1/users` - List all users (admin)
- `GET /api/v1/users/{id}` - Get user by ID (admin)
- `POST /api/v1/users` - Create user (admin)
- `PATCH /api/v1/users/{id}` - Update user (admin)
- `DELETE /api/v1/users/{id}` - Delete user (admin)

## 🔜 Phase 2: Core Affiliate Features

Ready to continue? Here's what's coming next:

### Backend
1. **Affiliate Profile Management**
   - Application submission
   - Admin approval workflow
   - Tier assignment

2. **Program Management**
   - Create/edit programs
   - Program enrollment
   - Commission configuration

3. **Referral System**
   - Link generation
   - Click tracking
   - UTM parameter support

### Frontend
1. **Affiliate Management UI**
   - Application form
   - Profile editor
   - Approval interface (admin)

2. **Program Management UI**
   - Program list
   - Program details
   - Enrollment management

3. **Referral Link UI**
   - Link generator
   - Link management
   - Click statistics

## 🐛 Troubleshooting

### Services won't start
```bash
# Check if ports are already in use
lsof -i :3000  # Frontend
lsof -i :8000  # Backend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Stop and rebuild
docker-compose down
docker-compose up --build
```

### Database connection errors
```bash
# Check PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Frontend build errors
```bash
# Clear Next.js cache
cd frontend
rm -rf .next node_modules
npm install
docker-compose restart frontend
```

### Database schema out of sync
```bash
# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
docker-compose exec backend alembic upgrade head
```

## 📖 Documentation

- **API Docs**: http://localhost:8000/api/v1/docs (Swagger UI)
- **API Docs (Alternative)**: http://localhost:8000/api/v1/redoc (ReDoc)
- **README**: See `README.md` for complete documentation

## 🎯 Ready for More?

Once you've tested the basic setup, let me know and we can:
1. Start Phase 2 implementation
2. Customize the commission rules
3. Add specific features you need
4. Set up additional integrations

Happy coding! 🚀
