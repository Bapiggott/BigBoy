# Quick Start Guide

Get the Big Boy Restaurant application running in under 10 minutes!

## Prerequisites

Before starting, make sure you have:
- Node.js (v14+) installed
- PostgreSQL (v12+) installed and running
- Git installed

## Step 1: Clone the Repository

```bash
git clone https://github.com/Bapiggott/BigBoy.git
cd BigBoy
```

## Step 2: Set Up the Database

### Create the database:
```bash
psql -U postgres
```

In PostgreSQL console:
```sql
CREATE DATABASE bigboy;
\q
```

### Initialize the schema:
```bash
psql -U postgres -d bigboy -f backend/src/config/database.sql
```

## Step 3: Set Up the Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:
```env
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key-at-least-32-characters
```

Seed the database:
```bash
npm run seed
```

Start the backend:
```bash
npm start
```

Backend now running at: http://localhost:5000

## Step 4: Set Up the Frontend

Open a new terminal:

```bash
cd frontend
npm install
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
npm start
```

Frontend now running at: http://localhost:3000

## Step 5: Test the Application

1. Open browser to http://localhost:3000
2. Click "Login"
3. Use demo credentials:
   - Email: `demo@bigboy.com`
   - Password: `demo123`
4. Explore the application!

## What You Can Do

✅ Browse 60+ menu items  
✅ View 28 real MI & OH locations  
✅ Add items to cart  
✅ Create orders  
✅ View your Silver tier rewards (750 points)  
✅ Add items to favorites  
✅ Check notifications  

## Troubleshooting

### Database Connection Error
- Make sure PostgreSQL is running: `sudo service postgresql status`
- Check credentials in `backend/.env`
- Verify database exists: `psql -U postgres -l`

### Port Already in Use
- Backend: Change `PORT` in `backend/.env`
- Frontend: It will prompt you to use a different port

### Module Not Found
- Run `npm install` in both `backend` and `frontend` directories

## Next Steps

- Read [API.md](API.md) for API documentation
- Read [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Read [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for code organization

## Support

For issues, check the troubleshooting section in [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Quick Links:**
- Backend: http://localhost:5000
- Frontend: http://localhost:3000
- API Health: http://localhost:5000/api/health
- Demo Login: demo@bigboy.com / demo123
