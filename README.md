# Big Boy Restaurant App

A full-featured mobile app for Big Boy Restaurant with ordering, rewards, and location services.

## Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | 18.x or 20.x LTS | `node --version` |
| npm | 9.x+ | `npm --version` |
| Docker Desktop | Latest | `docker --version` |
| Expo CLI | (installed via npx) | `npx expo --version` |
| iOS Simulator | Xcode 15+ (Mac only) | - |
| Android Emulator | Android Studio | - |

## Tech Stack

### Mobile App (app/)
- React Native with Expo SDK 52
- React Navigation 6 (bottom tabs + native stacks)
- TypeScript 5.3
- AsyncStorage for local persistence

### Backend (server/)
- Node.js 18+ with Express 4
- Prisma ORM 5.22
- MySQL 8.0
- JWT Authentication
- Zod validation

---

## Quick Start (Mac)

### 1. Clone and Install

```bash
git clone <repo-url> bigboy-app
cd bigboy-app
```

### 2. Start Database

```bash
# Start MySQL container
docker compose up -d mysql

# Wait for MySQL to be healthy (check status)
docker compose ps
# Should show: bigboy-mysql ... healthy

# If first time, wait ~30 seconds for initialization
```

### 3. Setup Server

```bash
cd server
npm ci

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with test data
npm run db:seed

# Start development server
npm run dev
```

Server runs at: http://localhost:3001

### 4. Verify Server (in new terminal)

```bash
# Health check
curl http://localhost:3001/health
# Expected: {"status":"ok","timestamp":"..."}

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
# Expected: {"message":"Login successful","user":{...},"token":"..."}

# Test menu
curl http://localhost:3001/api/menu/categories
# Expected: {"categories":[...]}

# Test locations
curl http://localhost:3001/api/locations
# Expected: {"locations":[...],"count":10}
```

### 5. Setup Mobile App

```bash
cd ../app
npm ci

# Start Expo development server
npm start
```

### 6. Run on Device/Simulator

- **iOS Simulator**: Press `i` in Expo terminal
- **Android Emulator**: Press `a` in Expo terminal
- **Physical Device**: Scan QR code with Expo Go app

---

## Environment Variables

### Server (.env)

```bash
# Database
DATABASE_URL="mysql://bigboy:bigboy123@localhost:3306/bigboy_db"

# Authentication
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# CORS (for mobile app)
CORS_ORIGIN="*"

# POS Integration (stub for now)
POS_API_URL="http://localhost:9700"
POS_API_KEY=""
```

### App (.env.local - optional)

```bash
# API URL (defaults to localhost:3001)
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

---

## Test Accounts

| Email | Password | Tier | Points | Notes |
|-------|----------|------|--------|-------|
| john@example.com | password123 | Silver | 2,450 | Primary test user |
| jane@example.com | password123 | Bronze | 850 | New user |
| gold@example.com | password123 | Gold | 5,000 | VIP user |

**Admin Access**: Any authenticated user can access admin features locally (in production, add role checks).

---

## Locations (10 Michigan Big Boys)

1. **Warren** - 12345 E 12 Mile Rd (Drive-Thru)
2. **Troy** - 2900 W Big Beaver Rd (Drive-Thru, WiFi)
3. **Sterling Heights** - 44000 Schoenherr Rd
4. **Rochester Hills** - 1234 Rochester Rd (WiFi, Playground)
5. **Dearborn** - 5678 Michigan Ave (Drive-Thru)
6. **Southfield** - 29000 Telegraph Rd (WiFi)
7. **Ann Arbor** - 3050 Washtenaw Ave (Drive-Thru, WiFi)
8. **Livonia** - 33606 Plymouth Rd (Drive-Thru)
9. **Novi** - 26200 Novi Rd (WiFi, Playground)
10. **Canton** - 45675 Ford Rd (Drive-Thru)

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Get current user |
| PUT | /api/auth/password | Yes | Change password |
| POST | /api/auth/logout | Yes | Logout |

### Menu
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/menu/categories | No | Get all categories |
| GET | /api/menu/items | No | Get all items (filter: ?category=, ?popular=true) |
| GET | /api/menu/items/:id | No | Get item details with modifiers |
| GET | /api/menu/featured | No | Get popular + new items |

### Locations
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/locations | No | List all (filter: ?search=, ?lat=, ?lng=, ?radius=) |
| GET | /api/locations/:id | No | Get location details |
| GET | /api/locations/nearby/:lat/:lng | No | Find nearby (query: ?limit=, ?radius=) |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/orders | Optional | Create order |
| GET | /api/orders | Yes | Get user's orders |
| GET | /api/orders/:id | Optional | Get order by ID or orderNumber |
| PUT | /api/orders/:id/cancel | Optional | Cancel order (if pending/confirmed) |

### Rewards
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/rewards | No | List available rewards |
| GET | /api/rewards/:id | No | Get reward details |
| POST | /api/rewards/:id/redeem | Yes | Redeem reward (deducts points) |
| GET | /api/rewards/user/my | Yes | Get user's redeemed rewards |
| PUT | /api/rewards/user/my/:id/use | Yes | Mark reward as used |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/users/profile | Yes | Get profile |
| PUT | /api/users/profile | Yes | Update profile |
| GET | /api/users/addresses | Yes | List addresses |
| POST | /api/users/addresses | Yes | Add address |
| PUT | /api/users/addresses/:id | Yes | Update address |
| DELETE | /api/users/addresses/:id | Yes | Delete address |
| GET | /api/users/preferences | Yes | Get preferences |
| PUT | /api/users/preferences | Yes | Update preferences |
| GET | /api/users/loyalty | Yes | Get loyalty status |

### Admin (Local Only)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/admin/users | Yes | List all users |
| GET | /api/admin/users/:id | Yes | Get user details |
| PATCH | /api/admin/users/:id/points | Yes | Adjust user points |
| PATCH | /api/admin/users/:id/tier | Yes | Change user tier |
| GET | /api/admin/orders | Yes | List all orders |
| GET | /api/admin/orders/:id | Yes | Get order details |
| PATCH | /api/admin/orders/:id/status | Yes | Update order status |
| GET | /api/admin/stats | Yes | Dashboard statistics |
| GET | /api/admin/locations/:id/stats | Yes | Location statistics |

---

## Menu Data (BigBoy.com)

What changed:
1. Canonical menu data now lives in `server/prisma/menu_source/bigboy.menu.json` (generated from BigBoy.com).
2. Prisma seed reads that file to create categories + items, including `categoryId` and `imageUrl`.
3. The app’s mock fallback uses `app/src/data/bigboy.menu.json`, and images are resolved via `app/src/assets/menuImageMap.ts`.

How to update the menu later:
1. Online import (preferred): `npx tsx server/scripts/importBigBoyMenu.ts`
2. If scraping is blocked, edit `server/prisma/menu_source/bigboy.menu.json` by hand and re-run the seed.
3. Validate local image filenames: `npx tsx server/scripts/validateMenuImages.ts`
4. Re-seed: `cd server && npm run db:push && npm run db:seed`

Default menu source:
1. We use the BigBoy.com main menu page as the default canonical menu.
2. If you need location-specific menus later, add a new `menu_source/*.menu.json` per location and select which file to seed by location.

---

## Database Commands

```bash
cd server

# Generate Prisma client (after schema changes)
npm run db:generate

# Push schema to database (development)
npm run db:push

# Create migration (production)
npm run db:migrate

# Reset and reseed database
npm run db:reset

# Open Prisma Studio (GUI)
npm run db:studio
```

---

## Docker Commands

```bash
# Start all services
docker compose up -d

# Start only MySQL
docker compose up -d mysql

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f mysql

# Stop services
docker compose down

# Reset (remove volumes/data)
docker compose down -v
```

---

## Project Structure

```
bigboy-app/
├── app/                          # React Native mobile app
│   ├── assets/                   # Images, fonts
│   │   └── brand/               # Big Boy logo assets
│   ├── src/
│   │   ├── api/                 # API client & endpoints
│   │   │   ├── client.ts        # HTTP client with auth
│   │   │   ├── endpoints/       # Typed API functions
│   │   │   └── types.ts         # API request/response types
│   │   ├── components/          # Reusable UI components
│   │   ├── data/                # Mock data for offline
│   │   ├── navigation/          # React Navigation setup
│   │   │   ├── RootNavigator    # Auth gate
│   │   │   ├── TabNavigator     # Bottom tabs
│   │   │   └── *Stack           # Screen stacks
│   │   ├── screens/             # Screen components
│   │   │   ├── account/         # Profile, settings
│   │   │   ├── admin/           # Admin tools
│   │   │   ├── auth/            # Login, register
│   │   │   ├── home/            # Dashboard
│   │   │   ├── locations/       # Store finder
│   │   │   ├── menu/            # Menu, cart, checkout
│   │   │   ├── orders/          # Order tracking
│   │   │   └── rewards/         # Loyalty program
│   │   ├── store/               # Context providers
│   │   ├── theme/               # Design tokens
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Helpers
│   ├── App.tsx                  # Entry point
│   ├── app.json                 # Expo config
│   └── package.json
├── server/                       # Node.js API server
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── seed.ts              # Seed data
│   ├── src/
│   │   ├── middleware/          # Auth, error handling
│   │   ├── routes/              # API route handlers
│   │   └── integrations/        # POS stub
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml            # Docker services
├── .env                         # Environment variables
├── .env.example                 # Example env file
└── README.md
```

---

## Troubleshooting

### MySQL won't start
```bash
# Check logs
docker compose logs mysql

# Remove and recreate
docker compose down -v
docker compose up -d mysql
```

### Prisma client out of sync
```bash
npm run db:generate
```

### Port 3001 already in use
```bash
# Find and kill process
lsof -i :3001
kill -9 <PID>
```

### Expo cache issues
```bash
cd app
npx expo start --clear
```

### iOS Simulator not opening
```bash
# Open manually
open -a Simulator
# Then press 'i' in Expo terminal
```

---

## QA Checklist

### Server
- [ ] MySQL container starts and becomes healthy
- [ ] `curl http://localhost:3001/health` returns `{"status":"ok"}`
- [ ] Login with test account returns JWT token
- [ ] `/api/menu/categories` returns 8 categories
- [ ] `/api/menu/items` returns 35+ items
- [ ] `/api/locations` returns 10 locations
- [ ] `/api/rewards` returns 17 rewards
- [ ] Creating order increments user points
- [ ] Redeeming reward decrements user points
- [ ] Order cancellation returns points

### Mobile App
- [ ] Expo starts without errors
- [ ] App loads on simulator/device
- [ ] Login screen accepts valid credentials
- [ ] Home screen shows user name and points
- [ ] Menu loads all categories and items
- [ ] Can add item to cart with modifiers
- [ ] Cart updates badge count
- [ ] Checkout flow completes (UI only)
- [ ] Rewards screen shows available rewards
- [ ] Locations screen shows 10 locations
- [ ] Location detail shows hours and amenities
- [ ] Account screen shows profile info
- [ ] Logout clears session

### Offline Mode
- [ ] Disable network → "Offline Mode" banner appears
- [ ] Menu still displays (mock data)
- [ ] Locations still display (mock data)
- [ ] Re-enable network → banner disappears

---

## Known Limitations / Next Upgrades

### MVP Limitations (Current)
| Area | Limitation | Notes |
|------|------------|-------|
| **Payments** | UI only, no real processing | Integrate Stripe/Square |
| **POS** | Stub implementation | Connect Oracle Simphony |
| **Images** | Placeholder icons | Add real menu/brand photos |
| **Push Notifications** | Not implemented | Add Expo Notifications |
| **Order Tracking** | Mock status updates | WebSocket for real-time |
| **Search** | Basic text search | Add Algolia/Meilisearch |
| **Analytics** | None | Add Mixpanel/Amplitude |
| **Crash Reporting** | None | Add Sentry |
| **CI/CD** | None | Add GitHub Actions |
| **Testing** | TypeScript only | Add Jest/Detox |

### Future Upgrades

**Phase 2 - Payments & Orders**
- Stripe/Square payment processing
- Apple Pay / Google Pay
- Oracle Simphony POS integration
- Real-time order tracking via WebSocket
- Order scheduling (advance orders)
- Delivery integration (DoorDash Drive)

**Phase 3 - Engagement**
- Push notifications (order updates, promotions)
- In-app messaging
- Referral program
- Birthday rewards auto-redemption
- Favorite orders
- Order history reorder

**Phase 4 - Operations**
- Admin web dashboard
- Manager mobile app
- Inventory management
- Staff scheduling
- Sales analytics
- Customer segmentation

**Phase 5 - Scale**
- CDN for images
- Redis caching
- Database read replicas
- Rate limiting
- API versioning
- Feature flags

---

## License

Private - Big Boy Restaurants
