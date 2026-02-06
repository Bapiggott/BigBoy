import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

type MenuSource = {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    sortOrder?: number;
  }>;
  items: Array<{
    id: string;
    name: string;
    description: string;
    categoryId: string;
    calories?: number | null;
    imageKey?: string | null;
  }>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MENU_SOURCE_PATH = path.join(__dirname, 'menu_source', 'bigboy.menu.json');

const DEFAULT_PRICE_BY_CATEGORY_SLUG: Record<string, number> = {
  appetizers: 7.99,
  'sides-drinks': 4.99,
  breakfast: 8.49,
  burgers: 11.49,
  'sandwiches-and-wraps': 10.49,
  'soups-salads': 8.49,
  dinners: 13.99,
  desserts: 4.99,
  'kids-meals': 6.49,
};

const loadMenuSource = async (): Promise<MenuSource> => {
  const raw = await fs.readFile(MENU_SOURCE_PATH, 'utf8');
  const parsed = JSON.parse(raw) as MenuSource;

  if (!parsed.categories?.length || !parsed.items?.length) {
    throw new Error('Menu source file is empty. Run the importer first.');
  }

  return parsed;
};

async function main() {
  console.log('🌱 Seeding database...');
  
  // Clear existing data in correct order (respecting foreign keys)
  await prisma.$transaction([
    prisma.orderItemModifier.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.userReward.deleteMany(),
    prisma.reward.deleteMany(),
    prisma.menuItemModifierGroup.deleteMany(),
    prisma.modifier.deleteMany(),
    prisma.modifierGroup.deleteMany(),
    prisma.menuItem.deleteMany(),
    prisma.category.deleteMany(),
    prisma.location.deleteMany(),
    prisma.giftCard.deleteMany(),
    prisma.paymentMethod.deleteMany(),
    prisma.address.deleteMany(),
    prisma.userPreferences.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  
  console.log('✓ Cleared existing data');

  // ============ USERS ============
  const passwordHash = await bcrypt.hash('password123', 12);
  
  const users = await prisma.user.createMany({
    data: [
      {
        id: 'user-1',
        email: 'john@example.com',
        phone: '5551234567',
        passwordHash,
        firstName: 'John',
        lastName: 'Smith',
        loyaltyPoints: 2450,
        loyaltyTier: 'SILVER',
        lifetimePoints: 3200,
      },
      {
        id: 'user-2',
        email: 'jane@example.com',
        phone: '5559876543',
        passwordHash,
        firstName: 'Jane',
        lastName: 'Doe',
        loyaltyPoints: 850,
        loyaltyTier: 'BRONZE',
        lifetimePoints: 850,
      },
      {
        id: 'user-3',
        email: 'gold@example.com',
        phone: '5555555555',
        passwordHash,
        firstName: 'Gold',
        lastName: 'Member',
        loyaltyPoints: 5000,
        loyaltyTier: 'GOLD',
        lifetimePoints: 12500,
      },
    ],
  });
  
  console.log(`✓ Created ${users.count} users`);

  // User preferences
  await prisma.userPreferences.createMany({
    data: [
      { userId: 'user-1' },
      { userId: 'user-2' },
      { userId: 'user-3' },
    ],
  });

  // User addresses
  await prisma.address.createMany({
    data: [
      {
        userId: 'user-1',
        label: 'Home',
        street: '123 Main St',
        city: 'Warren',
        state: 'MI',
        zipCode: '48093',
        isDefault: true,
      },
      {
        userId: 'user-1',
        label: 'Work',
        street: '456 Office Blvd',
        unit: 'Suite 200',
        city: 'Troy',
        state: 'MI',
        zipCode: '48084',
        isDefault: false,
      },
    ],
  });

  // ============ LOCATIONS (10 Michigan Big Boy locations) ============
  const locationData = [
    { name: 'Big Boy - Warren', address: '12345 E 12 Mile Rd', city: 'Warren', state: 'MI', zipCode: '48093', phone: '(586) 555-0101', lat: 42.5091, lng: -82.9975, driveThru: true },
    { name: 'Big Boy - Troy', address: '2900 W Big Beaver Rd', city: 'Troy', state: 'MI', zipCode: '48084', phone: '(248) 555-0102', lat: 42.5587, lng: -83.1458, driveThru: true, wifi: true },
    { name: 'Big Boy - Sterling Heights', address: '44000 Schoenherr Rd', city: 'Sterling Heights', state: 'MI', zipCode: '48313', phone: '(586) 555-0103', lat: 42.5983, lng: -83.0302, driveThru: false },
    { name: 'Big Boy - Rochester Hills', address: '1234 Rochester Rd', city: 'Rochester Hills', state: 'MI', zipCode: '48307', phone: '(248) 555-0104', lat: 42.6584, lng: -83.1497, wifi: true, playground: true },
    { name: 'Big Boy - Dearborn', address: '5678 Michigan Ave', city: 'Dearborn', state: 'MI', zipCode: '48126', phone: '(313) 555-0105', lat: 42.3223, lng: -83.1763, driveThru: true },
    { name: 'Big Boy - Southfield', address: '29000 Telegraph Rd', city: 'Southfield', state: 'MI', zipCode: '48034', phone: '(248) 555-0106', lat: 42.4734, lng: -83.2960, wifi: true },
    { name: 'Big Boy - Ann Arbor', address: '3050 Washtenaw Ave', city: 'Ann Arbor', state: 'MI', zipCode: '48104', phone: '(734) 555-0107', lat: 42.2681, lng: -83.6914, driveThru: true, wifi: true },
    { name: 'Big Boy - Livonia', address: '33606 Plymouth Rd', city: 'Livonia', state: 'MI', zipCode: '48150', phone: '(734) 555-0108', lat: 42.3681, lng: -83.3527, driveThru: true },
    { name: 'Big Boy - Novi', address: '26200 Novi Rd', city: 'Novi', state: 'MI', zipCode: '48375', phone: '(248) 555-0109', lat: 42.4809, lng: -83.4755, wifi: true, playground: true },
    { name: 'Big Boy - Canton', address: '45675 Ford Rd', city: 'Canton', state: 'MI', zipCode: '48187', phone: '(734) 555-0110', lat: 42.3314, lng: -83.4816, driveThru: true },
  ];
  
  const defaultHours = {
    monday: { open: '07:00', close: '22:00' },
    tuesday: { open: '07:00', close: '22:00' },
    wednesday: { open: '07:00', close: '22:00' },
    thursday: { open: '07:00', close: '22:00' },
    friday: { open: '07:00', close: '23:00' },
    saturday: { open: '07:00', close: '23:00' },
    sunday: { open: '08:00', close: '21:00' },
  };

  const locations = await prisma.location.createMany({
    data: locationData.map((loc, i) => ({
      id: `location-${i + 1}`,
      name: loc.name,
      address: loc.address,
      city: loc.city,
      state: loc.state,
      zipCode: loc.zipCode,
      phone: loc.phone,
      latitude: loc.lat,
      longitude: loc.lng,
      hours: defaultHours,
      hasDriveThru: loc.driveThru ?? false,
      hasWifi: loc.wifi ?? false,
      hasPlayground: loc.playground ?? false,
    })),
  });
  
  console.log(`✓ Created ${locations.count} locations`);

  // ============ MENU SOURCE ============
  const menuSource = await loadMenuSource();
  const filteredCategories = menuSource.categories.filter((category) => category.slug !== 'current-promotion');
  const filteredCategoryIds = new Set(filteredCategories.map((category) => category.id));
  const filteredItems = menuSource.items.filter((item) => filteredCategoryIds.has(item.categoryId));

  // ============ CATEGORIES ============
  const categories = await prisma.category.createMany({
    data: filteredCategories.map((category, index) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? null,
      sortOrder: category.sortOrder ?? index + 1,
      isActive: true,
    })),
  });

  console.log(`✓ Created ${categories.count} categories`);

  // ============ MODIFIER GROUPS ============
  await prisma.modifierGroup.create({
    data: {
      id: 'mod-cooktemp',
      name: 'Cook Temperature',
      isRequired: true,
      minSelect: 1,
      maxSelect: 1,
      modifiers: {
        create: [
          { id: 'mod-cooktemp-mr', name: 'Medium Rare', isDefault: false },
          { id: 'mod-cooktemp-m', name: 'Medium', isDefault: true },
          { id: 'mod-cooktemp-mw', name: 'Medium Well', isDefault: false },
          { id: 'mod-cooktemp-wd', name: 'Well Done', isDefault: false },
        ],
      },
    },
  });

  await prisma.modifierGroup.create({
    data: {
      id: 'mod-cheese',
      name: 'Cheese',
      isRequired: false,
      minSelect: 0,
      maxSelect: 1,
      modifiers: {
        create: [
          { id: 'mod-cheese-american', name: 'American Cheese', price: 0.99, isDefault: false },
          { id: 'mod-cheese-swiss', name: 'Swiss Cheese', price: 0.99, isDefault: false },
          { id: 'mod-cheese-pepperjack', name: 'Pepper Jack', price: 0.99, isDefault: false },
          { id: 'mod-cheese-none', name: 'No Cheese', price: 0, isDefault: false },
        ],
      },
    },
  });

  await prisma.modifierGroup.create({
    data: {
      id: 'mod-eggstyle',
      name: 'Egg Style',
      isRequired: true,
      minSelect: 1,
      maxSelect: 1,
      modifiers: {
        create: [
          { id: 'mod-egg-scrambled', name: 'Scrambled', isDefault: true },
          { id: 'mod-egg-overeasy', name: 'Over Easy', isDefault: false },
          { id: 'mod-egg-overmedium', name: 'Over Medium', isDefault: false },
          { id: 'mod-egg-overhard', name: 'Over Hard', isDefault: false },
          { id: 'mod-egg-sunny', name: 'Sunny Side Up', isDefault: false },
        ],
      },
    },
  });

  await prisma.modifierGroup.create({
    data: {
      id: 'mod-drinksize',
      name: 'Size',
      isRequired: true,
      minSelect: 1,
      maxSelect: 1,
      modifiers: {
        create: [
          { id: 'mod-size-small', name: 'Small', price: 0, isDefault: false },
          { id: 'mod-size-medium', name: 'Medium', price: 0.50, isDefault: true },
          { id: 'mod-size-large', name: 'Large', price: 1.00, isDefault: false },
        ],
      },
    },
  });

  await prisma.modifierGroup.create({
    data: {
      id: 'mod-extras',
      name: 'Add Extras',
      isRequired: false,
      minSelect: 0,
      maxSelect: 5,
      modifiers: {
        create: [
          { id: 'mod-extra-bacon', name: 'Bacon', price: 2.49, calories: 120 },
          { id: 'mod-extra-avocado', name: 'Avocado', price: 1.99, calories: 80 },
          { id: 'mod-extra-friedegg', name: 'Fried Egg', price: 1.49, calories: 90 },
          { id: 'mod-extra-patty', name: 'Extra Patty', price: 3.99, calories: 350 },
          { id: 'mod-extra-onionrings', name: 'Onion Rings', price: 1.99, calories: 180 },
        ],
      },
    },
  });

  console.log('✓ Created modifier groups');

  // ============ MENU ITEMS ============
  const categoriesById = new Map(filteredCategories.map((category) => [category.id, category]));

  const menuItemsData = filteredItems.map((item) => {
    const category = categoriesById.get(item.categoryId);
    const categorySlug = category?.slug ?? 'uncategorized';
    const price = DEFAULT_PRICE_BY_CATEGORY_SLUG[categorySlug] ?? 9.99;

    return {
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description || '',
      price,
      imageUrl: item.imageKey ?? null,
      calories: item.calories ?? null,
      prepTime: null,
      isPopular: false,
      isNew: false,
      isAvailable: true,
    };
  });

  const createdMenuItems = await prisma.menuItem.createMany({
    data: menuItemsData,
  });

  console.log(`✓ Created ${createdMenuItems.count} menu items`);

  // ============ REWARDS ============
  const rewards = await prisma.reward.createMany({
    data: [
      // Food rewards
      { name: 'Free French Fries', description: 'Enjoy a free order of our crispy golden fries', pointsCost: 150, category: 'FOOD', minTier: 'BRONZE' },
      { name: 'Free Side Salad', description: 'Fresh mixed greens with your choice of dressing', pointsCost: 200, category: 'FOOD', minTier: 'BRONZE' },
      { name: 'Free Onion Rings', description: 'Crispy beer-battered onion rings', pointsCost: 250, category: 'FOOD', minTier: 'BRONZE' },
      { name: 'Free Chicken Tenders', description: 'Hand-breaded chicken tenders basket', pointsCost: 800, category: 'FOOD', minTier: 'SILVER' },
      { name: 'Free Big Boy Burger', description: 'Our signature double-decker burger', pointsCost: 1000, category: 'FOOD', minTier: 'SILVER' },
      
      // Drink rewards
      { name: 'Free Soft Drink', description: 'Any size fountain drink', pointsCost: 100, category: 'DRINK', minTier: 'BRONZE' },
      { name: 'Free Coffee', description: 'Hot brewed coffee, regular or decaf', pointsCost: 100, category: 'DRINK', minTier: 'BRONZE' },
      { name: 'Free Fresh Lemonade', description: 'Refreshing house-made lemonade', pointsCost: 175, category: 'DRINK', minTier: 'BRONZE' },
      { name: 'Free Milkshake', description: 'Any flavor thick and creamy shake', pointsCost: 350, category: 'DRINK', minTier: 'SILVER' },
      
      // Dessert rewards
      { name: 'Free Apple Pie', description: 'Warm apple pie à la mode', pointsCost: 300, category: 'DESSERT', minTier: 'BRONZE' },
      { name: 'Free Strawberry Shortcake', description: 'Classic strawberry shortcake', pointsCost: 400, category: 'DESSERT', minTier: 'SILVER' },
      { name: 'Free Hot Fudge Cake', description: 'Our famous hot fudge sundae cake', pointsCost: 500, category: 'DESSERT', minTier: 'SILVER' },
      
      // Combo rewards
      { name: 'Free Breakfast Combo', description: 'Big Boy Breakfast with coffee', pointsCost: 900, category: 'COMBO', minTier: 'SILVER' },
      { name: 'Free Burger Combo', description: 'Any burger with fries and drink', pointsCost: 1200, category: 'COMBO', minTier: 'GOLD' },
      { name: 'Birthday Meal', description: 'Free entrée on your birthday (up to $20 value)', pointsCost: 0, category: 'COMBO', minTier: 'BRONZE' },
      
      // Merchandise
      { name: 'Big Boy T-Shirt', description: 'Classic Big Boy logo t-shirt', pointsCost: 2000, category: 'MERCHANDISE', minTier: 'GOLD' },
      { name: 'Big Boy Coffee Mug', description: 'Ceramic Big Boy coffee mug', pointsCost: 1500, category: 'MERCHANDISE', minTier: 'GOLD' },
    ],
  });
  
  console.log(`✓ Created ${rewards.count} rewards`);

  // ============ SAMPLE ORDERS ============
  await prisma.order.create({
    data: {
      id: 'order-1',
      orderNumber: 'BB1A2B3C4D5E',
      userId: 'user-1',
      locationId: 'location-1',
      type: 'PICKUP',
      status: 'COMPLETED',
      subtotal: 26.97,
      tax: 1.62,
      tip: 4.00,
      total: 32.59,
      customerName: 'John Smith',
      customerPhone: '5551234567',
      customerEmail: 'john@example.com',
      paymentMethod: 'card',
      paymentStatus: 'CAPTURED',
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      pointsEarned: 326,
      items: {
        create: [
          {
            menuItemId: 'item-10',
            name: 'Big Boy Burger',
            quantity: 2,
            unitPrice: 12.99,
            totalPrice: 25.98,
          },
          {
            menuItemId: 'item-70',
            name: 'Soft Drink',
            quantity: 1,
            unitPrice: 2.99,
            totalPrice: 2.99,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      id: 'order-2',
      orderNumber: 'BBX9Y8Z7W6V5',
      userId: 'user-1',
      locationId: 'location-2',
      type: 'DINE_IN',
      status: 'PREPARING',
      subtotal: 35.96,
      tax: 2.16,
      total: 38.12,
      customerName: 'John Smith',
      customerPhone: '5551234567',
      paymentMethod: 'cash',
      paymentStatus: 'PENDING',
      estimatedReady: new Date(Date.now() + 15 * 60 * 1000),
      pointsEarned: 381,
      items: {
        create: [
          {
            menuItemId: 'item-1',
            name: 'Big Boy Breakfast',
            quantity: 2,
            unitPrice: 11.99,
            totalPrice: 23.98,
          },
          {
            menuItemId: 'item-60',
            name: 'Hot Fudge Cake',
            quantity: 1,
            unitPrice: 7.99,
            totalPrice: 7.99,
          },
          {
            menuItemId: 'item-71',
            name: 'Fresh Brewed Coffee',
            quantity: 2,
            unitPrice: 2.49,
            totalPrice: 4.98,
          },
        ],
      },
    },
  });
  
  console.log('✓ Created sample orders');

  console.log('\n✅ Database seeded successfully!');
  console.log('\n🔧 Test accounts:');
  console.log('   john@example.com / password123 (Silver tier, 2450 pts)');
  console.log('   jane@example.com / password123 (Bronze tier, 850 pts)');
  console.log('   gold@example.com / password123 (Gold tier, 5000 pts)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
