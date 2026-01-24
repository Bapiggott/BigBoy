# Big Boy Restaurant - API Documentation

Complete API documentation for the Big Boy Restaurant web application.

## Base URL

**Development:** `http://localhost:5000/api`
**Production:** `https://api.yourdomain.com/api`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

All responses follow this format:

**Success Response:**
```json
{
  "data": { ... },
  "message": "Success message"
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

---

## 📝 Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "555-123-4567"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "555-123-4567"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login User
**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "demo@bigboy.com",
  "password": "demo123"
}
```

**Response:**
```json
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Logout User
**POST** `/auth/logout`

🔒 **Requires Authentication**

Invalidate current JWT token.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### 4. Get Current User
**GET** `/auth/me`

🔒 **Requires Authentication**

Get currently authenticated user's information.

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "555-123-4567"
  }
}
```

---

## 🍔 Menu Endpoints

### 5. Get All Categories
**GET** `/menu/categories`

Get all menu categories.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Burgers",
    "description": "Our famous Big Boy burgers",
    "image_url": "/images/categories/burgers.jpg",
    "display_order": 1
  },
  ...
]
```

### 6. Get Menu Items
**GET** `/menu`

Get all menu items, optionally filtered by category.

**Query Parameters:**
- `category` (optional): Filter by category name

**Example:** `/menu?category=Burgers`

**Response:**
```json
[
  {
    "id": 1,
    "category_id": 1,
    "name": "Big Boy Burger",
    "description": "Two beef patties, American cheese, lettuce, Big Boy sauce",
    "price": "8.99",
    "image_url": "/images/menu/big-boy-burger.jpg",
    "calories": 850,
    "is_available": true,
    "category_name": "Burgers"
  },
  ...
]
```

### 7. Get Menu Item by ID
**GET** `/menu/:id`

Get specific menu item details.

**Response:**
```json
{
  "id": 1,
  "name": "Big Boy Burger",
  "description": "Two beef patties, American cheese, lettuce, Big Boy sauce",
  "price": "8.99",
  "calories": 850,
  "category_name": "Burgers"
}
```

---

## 📍 Location Endpoints

### 8. Get All Locations
**GET** `/locations`

Get all restaurant locations.

**Query Parameters:**
- `state` (optional): Filter by state (MI or OH)

**Example:** `/locations?state=MI`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Big Boy - Warren",
    "address": "28350 Dequindre Rd",
    "city": "Warren",
    "state": "MI",
    "zip": "48092",
    "phone": "(586) 574-9200",
    "latitude": "42.4897",
    "longitude": "-83.0386",
    "hours_monday": "6:00 AM - 10:00 PM",
    "hours_tuesday": "6:00 AM - 10:00 PM",
    "hours_wednesday": "6:00 AM - 10:00 PM",
    "hours_thursday": "6:00 AM - 10:00 PM",
    "hours_friday": "6:00 AM - 11:00 PM",
    "hours_saturday": "6:00 AM - 11:00 PM",
    "hours_sunday": "7:00 AM - 9:00 PM",
    "is_active": true
  },
  ...
]
```

### 9. Get Location by ID
**GET** `/locations/:id`

Get specific location details.

**Response:**
```json
{
  "id": 1,
  "name": "Big Boy - Warren",
  "address": "28350 Dequindre Rd",
  ...
}
```

---

## 🛒 Cart Endpoints

### 10. Get User's Cart
**GET** `/cart`

🔒 **Requires Authentication**

Get all items in user's shopping cart.

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "menu_item_id": 1,
    "quantity": 2,
    "name": "Big Boy Burger",
    "description": "Two beef patties...",
    "price": "8.99",
    "image_url": "/images/menu/big-boy-burger.jpg"
  },
  ...
]
```

### 11. Add Item to Cart
**POST** `/cart`

🔒 **Requires Authentication**

Add an item to cart or update quantity if already exists.

**Request Body:**
```json
{
  "menuItemId": 1,
  "quantity": 2
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "menu_item_id": 1,
  "quantity": 2
}
```

### 12. Update Cart Item
**PUT** `/cart/:id`

🔒 **Requires Authentication**

Update quantity of cart item.

**Request Body:**
```json
{
  "quantity": 3
}
```

### 13. Remove Item from Cart
**DELETE** `/cart/:id`

🔒 **Requires Authentication**

Remove specific item from cart.

**Response:**
```json
{
  "message": "Item removed from cart"
}
```

### 14. Clear Cart
**DELETE** `/cart`

🔒 **Requires Authentication**

Remove all items from cart.

**Response:**
```json
{
  "message": "Cart cleared"
}
```

---

## 📦 Order Endpoints

### 15. Get User's Orders
**GET** `/orders`

🔒 **Requires Authentication**

Get all orders for current user.

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "location_id": 1,
    "order_number": "BB1234567890",
    "total_amount": "27.47",
    "status": "completed",
    "payment_method": "credit_card",
    "payment_status": "paid",
    "pickup_time": "2024-01-24T18:00:00Z",
    "special_instructions": "Extra sauce please",
    "created_at": "2024-01-24T16:30:00Z",
    "location_name": "Big Boy - Warren",
    "address": "28350 Dequindre Rd",
    "city": "Warren",
    "state": "MI"
  },
  ...
]
```

### 16. Get Order by ID
**GET** `/orders/:id`

🔒 **Requires Authentication**

Get detailed order information including items.

**Response:**
```json
{
  "id": 1,
  "order_number": "BB1234567890",
  "total_amount": "27.47",
  "status": "completed",
  "location_name": "Big Boy - Warren",
  "items": [
    {
      "id": 1,
      "menu_item_id": 1,
      "name": "Big Boy Burger",
      "quantity": 2,
      "price": "8.99"
    },
    ...
  ]
}
```

### 17. Create Order
**POST** `/orders`

🔒 **Requires Authentication**

Create new order from cart items.

**Request Body:**
```json
{
  "locationId": 1,
  "paymentMethod": "credit_card",
  "pickupTime": "2024-01-24T18:00:00Z",
  "specialInstructions": "Extra sauce please"
}
```

**Response:**
```json
{
  "id": 1,
  "order_number": "BB1234567890",
  "total_amount": "27.47",
  "status": "pending"
}
```

**Notes:**
- Automatically clears cart after order creation
- Awards reward points (1 point per dollar)
- Creates notification for user

### 18. Update Order Status
**PATCH** `/orders/:id/status`

🔒 **Requires Authentication**

Update order status.

**Request Body:**
```json
{
  "status": "completed"
}
```

**Valid statuses:** pending, preparing, ready, completed, cancelled

---

## ❤️ Favorites Endpoints

### 19. Get User's Favorites
**GET** `/favorites`

🔒 **Requires Authentication**

Get all favorite menu items for user.

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "menu_item_id": 1,
    "name": "Big Boy Burger",
    "description": "Two beef patties...",
    "price": "8.99",
    "image_url": "/images/menu/big-boy-burger.jpg",
    "calories": 850,
    "created_at": "2024-01-24T16:30:00Z"
  },
  ...
]
```

### 20. Add to Favorites
**POST** `/favorites`

🔒 **Requires Authentication**

Add menu item to favorites.

**Request Body:**
```json
{
  "menuItemId": 1
}
```

### 21. Remove from Favorites
**DELETE** `/favorites/:menuItemId`

🔒 **Requires Authentication**

Remove menu item from favorites.

**Response:**
```json
{
  "message": "Removed from favorites"
}
```

---

## 🏆 Rewards Endpoints

### 22. Get User's Rewards
**GET** `/rewards`

🔒 **Requires Authentication**

Get current user's rewards information.

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "tier_id": 2,
  "points": 750,
  "lifetime_points": 750,
  "tier_name": "Silver",
  "min_points": 500,
  "max_points": 1499,
  "discount_percentage": "10.00",
  "benefits": "Earn 1.5 points per dollar, 10% off orders, birthday reward",
  "color": "#C0C0C0"
}
```

### 23. Get All Reward Tiers
**GET** `/rewards/tiers`

Get information about all reward tiers.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Bronze",
    "min_points": 0,
    "max_points": 499,
    "discount_percentage": "5.00",
    "benefits": "Earn 1 point per dollar spent, 5% off orders",
    "color": "#CD7F32"
  },
  {
    "id": 2,
    "name": "Silver",
    "min_points": 500,
    "max_points": 1499,
    "discount_percentage": "10.00",
    "benefits": "Earn 1.5 points per dollar, 10% off orders, birthday reward",
    "color": "#C0C0C0"
  },
  {
    "id": 3,
    "name": "Gold",
    "min_points": 1500,
    "max_points": null,
    "discount_percentage": "15.00",
    "benefits": "Earn 2 points per dollar, 15% off orders, exclusive promotions, priority service",
    "color": "#FFD700"
  }
]
```

---

## 🎁 Gift Card Endpoints

### 24. Get User's Gift Cards
**GET** `/giftcards`

🔒 **Requires Authentication**

Get all gift cards owned or used by user.

**Response:**
```json
[
  {
    "id": 1,
    "code": "BB1A2B3C4D5E",
    "balance": "25.00",
    "original_amount": "50.00",
    "is_active": true,
    "expires_at": "2025-12-31T23:59:59Z",
    "created_at": "2024-01-24T16:30:00Z"
  },
  ...
]
```

### 25. Purchase Gift Card
**POST** `/giftcards`

🔒 **Requires Authentication**

Purchase a new gift card.

**Request Body:**
```json
{
  "amount": 50.00,
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "id": 1,
  "code": "BB1A2B3C4D5E",
  "balance": "50.00",
  "original_amount": "50.00"
}
```

### 26. Apply Gift Card
**POST** `/giftcards/apply`

🔒 **Requires Authentication**

Validate and apply a gift card code.

**Request Body:**
```json
{
  "code": "BB1A2B3C4D5E"
}
```

**Response:**
```json
{
  "id": 1,
  "code": "BB1A2B3C4D5E",
  "balance": "50.00",
  "is_active": true
}
```

### 27. Check Gift Card Balance
**GET** `/giftcards/balance/:code`

🔒 **Requires Authentication**

Check balance of a gift card.

**Response:**
```json
{
  "balance": "50.00",
  "is_active": true,
  "expires_at": "2025-12-31T23:59:59Z"
}
```

---

## 🔔 Notification Endpoints

### 28. Get User's Notifications
**GET** `/notifications`

🔒 **Requires Authentication**

Get all notifications for user (limit 50).

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "title": "Order Confirmed",
    "message": "Your order #BB1234567890 has been confirmed!",
    "type": "success",
    "is_read": false,
    "created_at": "2024-01-24T16:30:00Z"
  },
  ...
]
```

### 29. Mark Notification as Read
**PATCH** `/notifications/:id/read`

🔒 **Requires Authentication**

Mark specific notification as read.

**Response:**
```json
{
  "id": 1,
  "is_read": true
}
```

### 30. Mark All Notifications as Read
**PATCH** `/notifications/read-all`

🔒 **Requires Authentication**

Mark all user's notifications as read.

**Response:**
```json
{
  "message": "All notifications marked as read"
}
```

### 31. Delete Notification
**DELETE** `/notifications/:id`

🔒 **Requires Authentication**

Delete specific notification.

**Response:**
```json
{
  "message": "Notification deleted"
}
```

---

## 🏥 Health Check

### 32. Health Check
**GET** `/health`

Check API server status.

**Response:**
```json
{
  "status": "ok",
  "message": "Big Boy API is running"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

---

## Rate Limiting

*To be implemented in production*

Recommended limits:
- Authentication endpoints: 5 requests per minute
- General endpoints: 100 requests per minute

---

## Testing with cURL

### Example: Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@bigboy.com","password":"demo123"}'
```

### Example: Get Menu (Authenticated)
```bash
curl http://localhost:5000/api/menu \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Postman Collection

A Postman collection with all endpoints is available in `/docs/BigBoy.postman_collection.json`

---

**Last Updated:** January 24, 2024
**Version:** 1.0.0
