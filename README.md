# Big Boy Restaurant Web Application

A full-stack restaurant web application featuring 28 real Michigan & Ohio locations, 60+ menu items, 3-tier loyalty program, online ordering, and more. Built with React and Express with a retro Big Boy design.

## 🎯 Features

### Frontend (React)
- ✅ **Home Page** - Hero section with featured items
- ✅ **Menu Page** - 60+ real menu items scraped from BigBoy.com
- ✅ **Locations Page** - 28 real MI & OH locations with addresses and phone numbers
- ✅ **Rewards Page** - 3-tier loyalty program (Bronze, Silver, Gold)
- ✅ **Account Page** - User profile, order history, favorites, notifications
- ✅ **Shopping Cart** - Add items, manage quantities, checkout
- ✅ **Favorites System** - Save favorite menu items
- ✅ **Notifications** - Order confirmations and updates
- ✅ **Gift Cards** - Purchase and redeem gift cards
- ✅ **Retro Big Boy Design** - Classic red, blue, and yellow color scheme

### Backend (Express.js)
- ✅ **30+ API Endpoints** - Complete RESTful API
- ✅ **JWT Authentication** - Secure user authentication
- ✅ **PostgreSQL Database** - 13 tables for complete functionality
- ✅ **Order Management** - Create and track orders
- ✅ **Rewards System** - Points tracking and tier management
- ✅ **Demo User** - Pre-configured demo account with sample data

### Database Schema (13 Tables)
1. `users` - User accounts
2. `auth_tokens` - JWT tokens
3. `categories` - Menu categories
4. `menu_items` - Menu items
5. `locations` - Restaurant locations
6. `orders` - Customer orders
7. `order_items` - Order line items
8. `cart` - Shopping cart
9. `favorites` - Favorite menu items
10. `rewards` - User rewards points
11. `reward_tiers` - Loyalty program tiers
12. `gift_cards` - Gift card management
13. `notifications` - User notifications

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create PostgreSQL database:**
   ```bash
   psql -U postgres
   CREATE DATABASE bigboy;
   \q
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your database credentials:
   ```
   PORT=5000
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=bigboy
   DB_PASSWORD=your_password
   DB_PORT=5432
   JWT_SECRET=your-secret-key
   FRONTEND_URL=http://localhost:3000
   ```

5. **Initialize database schema:**
   ```bash
   psql -U postgres -d bigboy -f src/config/database.sql
   ```

6. **Seed database with real data:**
   ```bash
   npm run seed
   ```

7. **Start backend server:**
   ```bash
   npm start
   ```
   
   Backend will run on http://localhost:5000

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
   ```

4. **Start frontend development server:**
   ```bash
   npm start
   ```
   
   Frontend will run on http://localhost:3000

## 👤 Demo Account

Use these credentials to test the application:

- **Email:** demo@bigboy.com
- **Password:** demo123

The demo account includes:
- Silver tier rewards status (750 points)
- Sample favorites
- Welcome notification

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Menu
- `GET /api/menu/categories` - Get all categories
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get menu item by ID

### Locations
- `GET /api/locations` - Get all locations
- `GET /api/locations/:id` - Get location by ID

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove from cart
- `DELETE /api/cart` - Clear cart

### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id/status` - Update order status

### Favorites
- `GET /api/favorites` - Get user's favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites/:menuItemId` - Remove from favorites

### Rewards
- `GET /api/rewards` - Get user's rewards
- `GET /api/rewards/tiers` - Get all reward tiers

### Gift Cards
- `GET /api/giftcards` - Get user's gift cards
- `POST /api/giftcards` - Purchase gift card
- `POST /api/giftcards/apply` - Apply gift card
- `GET /api/giftcards/balance/:code` - Check balance

### Notifications
- `GET /api/notifications` - Get user's notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## 🎨 Design

The application features a retro Big Boy design with:
- **Primary Red:** #E31837
- **Primary Blue:** #003DA5
- **Accent Yellow:** #FFD700
- **Cream Background:** #FFF8DC
- Classic diner aesthetic with rounded corners and bold colors

## 📊 Real Data

### 28 Locations (Michigan & Ohio)
18 Michigan locations:
- Warren, Sterling Heights, Troy, Roseville, Clinton Township
- Shelby Township, Livonia, Dearborn, Taylor, Wyandotte
- Allen Park, Plymouth, Westland, Farmington Hills, Novi
- Royal Oak, Flint, Saginaw

10 Ohio locations:
- Toledo, Maumee, Perrysburg, Sylvania, Oregon
- Bowling Green, Findlay, Lima, Fremont, Sandusky

### 60+ Menu Items
8 categories:
- Burgers (8 items)
- Breakfast (8 items)
- Sandwiches & Wraps (8 items)
- Salads (6 items)
- Entrees (8 items)
- Appetizers (7 items)
- Desserts (7 items)
- Beverages (8 items)

## 🏆 Loyalty Program

### Bronze Tier (0-499 points)
- Earn 1 point per dollar spent
- 5% off orders

### Silver Tier (500-1,499 points)
- Earn 1.5 points per dollar
- 10% off orders
- Birthday reward

### Gold Tier (1,500+ points)
- Earn 2 points per dollar
- 15% off orders
- Exclusive promotions
- Priority service

## 🚢 Deployment

### Backend Deployment (Heroku, AWS, etc.)

1. **Set environment variables on your hosting platform**

2. **Deploy backend code**

3. **Run database migrations:**
   ```bash
   psql $DATABASE_URL -f src/config/database.sql
   node src/config/seed.js
   ```

### Frontend Deployment (Vercel, Netlify, etc.)

1. **Set environment variable:**
   ```
   REACT_APP_API_URL=https://your-backend-url.com/api
   ```

2. **Build frontend:**
   ```bash
   npm run build
   ```

3. **Deploy build directory**

## 🧪 Testing

To test the application:

1. Start both backend and frontend servers
2. Navigate to http://localhost:3000
3. Login with demo account (demo@bigboy.com / demo123)
4. Explore menu, add items to cart
5. View locations and rewards
6. Check account page for orders and favorites

## 📝 License

This project is for educational purposes.

## 🤝 Contributing

This is a demonstration project. Feel free to fork and modify for your own use.

## 📧 Support

For questions or issues, please open a GitHub issue.

---

Built with ❤️ for Big Boy Restaurant
