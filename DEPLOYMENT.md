# Big Boy Restaurant - Deployment Guide

This guide provides comprehensive instructions for deploying the Big Boy restaurant web application to production.

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Database Setup](#database-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Environment Variables](#environment-variables)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

## System Requirements

### Production Server
- **OS:** Linux (Ubuntu 20.04 LTS recommended) or compatible
- **Node.js:** v14.x or higher
- **PostgreSQL:** v12.x or higher
- **Memory:** Minimum 1GB RAM (2GB+ recommended)
- **Storage:** Minimum 10GB available

### Development Environment
- Node.js v14+ and npm
- PostgreSQL 12+
- Git

## Database Setup

### 1. Install PostgreSQL

On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

On macOS (using Homebrew):
```bash
brew install postgresql
brew services start postgresql
```

### 2. Create Database

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE bigboy;

# Create user (optional)
CREATE USER bigboy_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE bigboy TO bigboy_user;

# Exit psql
\q
```

### 3. Initialize Schema

```bash
# Navigate to backend directory
cd backend

# Run schema initialization
psql -U postgres -d bigboy -f src/config/database.sql

# Or if using custom user:
psql -U bigboy_user -d bigboy -f src/config/database.sql
```

### 4. Seed Database

```bash
# Set up environment variables first (see below)
# Then run seed script
npm run seed
```

## Backend Deployment

### Option 1: Traditional VPS (AWS EC2, DigitalOcean, etc.)

#### 1. Setup Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

#### 2. Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/yourusername/BigBoy.git
cd BigBoy/backend

# Install dependencies
npm install --production
```

#### 3. Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit with your production values
nano .env
```

Required environment variables:
```env
PORT=5000
NODE_ENV=production

DB_USER=bigboy_user
DB_HOST=localhost
DB_NAME=bigboy
DB_PASSWORD=your_secure_password
DB_PORT=5432

JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
FRONTEND_URL=https://your-frontend-domain.com
```

#### 4. Setup Process Manager (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application
pm2 start src/server.js --name bigboy-api

# Setup auto-restart on reboot
pm2 startup
pm2 save

# View logs
pm2 logs bigboy-api

# Monitor
pm2 monit
```

#### 5. Configure Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/bigboy-api
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/bigboy-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Setup SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is configured automatically
```

### Option 2: Heroku

#### 1. Install Heroku CLI

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login
```

#### 2. Create Heroku App

```bash
cd backend

# Create app
heroku create bigboy-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev
```

#### 3. Configure Environment Variables

```bash
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production
heroku config:set FRONTEND_URL=https://your-frontend.vercel.app
```

#### 4. Deploy

```bash
# Create Procfile
echo "web: node src/server.js" > Procfile

# Deploy
git push heroku main

# Run migrations
heroku run bash
psql $DATABASE_URL -f src/config/database.sql
node src/config/seed.js
exit
```

### Option 3: Docker

Create `Dockerfile` in backend directory:
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: bigboy
      POSTGRES_USER: bigboy_user
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      DB_HOST: db
      DB_USER: bigboy_user
      DB_PASSWORD: your_password
      DB_NAME: bigboy
      JWT_SECRET: your-secret-key
      NODE_ENV: production
    depends_on:
      - db

volumes:
  postgres_data:
```

Deploy:
```bash
docker-compose up -d
```

## Frontend Deployment

### Option 1: Vercel (Recommended)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Deploy

```bash
cd frontend

# Login
vercel login

# Deploy
vercel --prod
```

#### 3. Configure Environment

In Vercel dashboard:
- Go to Settings → Environment Variables
- Add: `REACT_APP_API_URL` = `https://api.yourdomain.com/api`
- Redeploy

### Option 2: Netlify

#### 1. Build Application

```bash
cd frontend
npm run build
```

#### 2. Deploy via CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=build
```

#### 3. Configure Environment

In Netlify dashboard:
- Go to Site Settings → Build & Deploy → Environment
- Add: `REACT_APP_API_URL` = `https://api.yourdomain.com/api`

### Option 3: AWS S3 + CloudFront

#### 1. Build Application

```bash
cd frontend
REACT_APP_API_URL=https://api.yourdomain.com/api npm run build
```

#### 2. Create S3 Bucket

```bash
# Install AWS CLI
pip install awscli

# Configure
aws configure

# Create bucket
aws s3 mb s3://bigboy-frontend

# Enable static website hosting
aws s3 website s3://bigboy-frontend --index-document index.html --error-document index.html

# Upload build
aws s3 sync build/ s3://bigboy-frontend --acl public-read
```

#### 3. Setup CloudFront

1. Go to AWS CloudFront console
2. Create distribution
3. Set origin to S3 bucket
4. Configure SSL certificate
5. Set default root object to `index.html`

## Environment Variables

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=production

# Database
DB_USER=bigboy_user
DB_HOST=localhost
DB_NAME=bigboy
DB_PASSWORD=your_secure_password_here
DB_PORT=5432

# Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# CORS
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend (.env)

```env
REACT_APP_API_URL=https://api.yourdomain.com/api
```

## Post-Deployment

### 1. Test API Endpoints

```bash
# Health check
curl https://api.yourdomain.com/api/health

# Test login
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@bigboy.com","password":"demo123"}'
```

### 2. Verify Database

```bash
# Connect to database
psql -U bigboy_user -d bigboy

# Check tables
\dt

# Verify data
SELECT COUNT(*) FROM menu_items;
SELECT COUNT(*) FROM locations;
SELECT COUNT(*) FROM users;
```

### 3. Monitor Application

```bash
# Backend logs (PM2)
pm2 logs bigboy-api

# Database connections
psql -U bigboy_user -d bigboy -c "SELECT count(*) FROM pg_stat_activity;"

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 4. Setup Monitoring (Optional)

Use services like:
- **Uptime monitoring:** UptimeRobot, Pingdom
- **Error tracking:** Sentry
- **Performance:** New Relic, DataDog
- **Logs:** Papertrail, Loggly

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database exists
psql -U postgres -l

# Test connection
psql -U bigboy_user -d bigboy -h localhost
```

### CORS Errors

Ensure `FRONTEND_URL` in backend `.env` matches your frontend domain exactly:
```env
FRONTEND_URL=https://yourdomain.com  # No trailing slash
```

### Build Errors

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>
```

### SSL Certificate Issues

```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

## Security Checklist

- [ ] Use strong JWT_SECRET (minimum 32 characters)
- [ ] Use strong database passwords
- [ ] Enable SSL/HTTPS on all endpoints
- [ ] Set NODE_ENV=production in production
- [ ] Keep dependencies updated
- [ ] Configure firewall (allow only necessary ports)
- [ ] Enable database backups
- [ ] Use environment variables (never commit secrets)
- [ ] Configure rate limiting
- [ ] Enable CORS only for trusted domains

## Backup Strategy

### Database Backups

```bash
# Manual backup
pg_dump -U bigboy_user bigboy > backup_$(date +%Y%m%d).sql

# Automated daily backups (cron)
0 2 * * * pg_dump -U bigboy_user bigboy > /backups/bigboy_$(date +\%Y\%m\%d).sql
```

### Application Backups

```bash
# Backup application files
tar -czf bigboy_app_$(date +%Y%m%d).tar.gz /path/to/BigBoy
```

## Performance Optimization

### Database
- Add indexes on frequently queried columns
- Enable connection pooling
- Regular VACUUM and ANALYZE

### API
- Enable compression (gzip)
- Implement caching (Redis)
- Use CDN for static assets

### Frontend
- Enable code splitting
- Optimize images
- Use lazy loading
- Enable service workers

## Support

For issues or questions:
- Check GitHub Issues
- Review logs
- Contact support team

---

**Deployment Date:** [Add date]
**Version:** 1.0.0
**Last Updated:** [Add date]
