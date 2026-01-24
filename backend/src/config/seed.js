const pool = require('../config/db');
const { hashPassword } = require('../utils/auth');

const seedDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('Starting database seed...');

    // Seed reward tiers (3-tier loyalty program)
    console.log('Seeding reward tiers...');
    await client.query(`
      INSERT INTO reward_tiers (name, min_points, max_points, discount_percentage, benefits, color) VALUES
      ('Bronze', 0, 499, 5, 'Earn 1 point per dollar spent, 5% off orders', '#CD7F32'),
      ('Silver', 500, 1499, 10, 'Earn 1.5 points per dollar, 10% off orders, birthday reward', '#C0C0C0'),
      ('Gold', 1500, NULL, 15, 'Earn 2 points per dollar, 15% off orders, exclusive promotions, priority service', '#FFD700')
      ON CONFLICT DO NOTHING
    `);

    // Seed categories
    console.log('Seeding categories...');
    await client.query(`
      INSERT INTO categories (name, description, image_url, display_order) VALUES
      ('Burgers', 'Our famous Big Boy burgers', '/images/categories/burgers.jpg', 1),
      ('Breakfast', 'Start your day right', '/images/categories/breakfast.jpg', 2),
      ('Sandwiches & Wraps', 'Delicious sandwiches and wraps', '/images/categories/sandwiches.jpg', 3),
      ('Salads', 'Fresh and healthy salads', '/images/categories/salads.jpg', 4),
      ('Entrees', 'Hearty dinner entrees', '/images/categories/entrees.jpg', 5),
      ('Appetizers', 'Start your meal right', '/images/categories/appetizers.jpg', 6),
      ('Desserts', 'Sweet treats', '/images/categories/desserts.jpg', 7),
      ('Beverages', 'Drinks and shakes', '/images/categories/beverages.jpg', 8)
      ON CONFLICT DO NOTHING
    `);

    // Get category IDs
    const categories = await client.query('SELECT id, name FROM categories');
    const catMap = {};
    categories.rows.forEach(cat => catMap[cat.name] = cat.id);

    // Seed 60+ menu items with realistic Big Boy items
    console.log('Seeding menu items...');
    const menuItems = [
      // Burgers
      { cat: 'Burgers', name: 'Big Boy Burger', desc: 'Two beef patties, American cheese, lettuce, Big Boy sauce', price: 8.99, cal: 850 },
      { cat: 'Burgers', name: 'Classic Cheeseburger', desc: 'Beef patty with American cheese, lettuce, tomato, onion', price: 7.49, cal: 680 },
      { cat: 'Burgers', name: 'Bacon Cheeseburger', desc: 'Beef patty with crispy bacon and melted cheese', price: 8.99, cal: 890 },
      { cat: 'Burgers', name: 'Mushroom Swiss Burger', desc: 'Beef patty topped with sautéed mushrooms and Swiss cheese', price: 8.99, cal: 820 },
      { cat: 'Burgers', name: 'BBQ Bacon Burger', desc: 'Beef patty with BBQ sauce, bacon, cheddar, onion rings', price: 9.49, cal: 950 },
      { cat: 'Burgers', name: 'Turkey Burger', desc: 'Lean turkey patty with lettuce, tomato, and mayo', price: 8.49, cal: 550 },
      { cat: 'Burgers', name: 'Veggie Burger', desc: 'Plant-based patty with all the fixings', price: 8.49, cal: 480 },
      { cat: 'Burgers', name: 'Double Decker', desc: 'Three beef patties with double cheese', price: 11.99, cal: 1280 },
      
      // Breakfast
      { cat: 'Breakfast', name: 'Big Boy Breakfast', desc: 'Two eggs, bacon, sausage, hash browns, toast', price: 9.99, cal: 980 },
      { cat: 'Breakfast', name: 'Pancake Platter', desc: 'Three fluffy pancakes with butter and syrup', price: 6.99, cal: 720 },
      { cat: 'Breakfast', name: 'French Toast', desc: 'Three slices of French toast with powdered sugar', price: 7.49, cal: 680 },
      { cat: 'Breakfast', name: 'Omelet Special', desc: 'Three-egg omelet with cheese, peppers, onions', price: 8.99, cal: 550 },
      { cat: 'Breakfast', name: 'Biscuits & Gravy', desc: 'Homemade biscuits smothered in sausage gravy', price: 6.49, cal: 820 },
      { cat: 'Breakfast', name: 'Breakfast Burrito', desc: 'Eggs, cheese, potatoes, choice of meat wrapped in tortilla', price: 7.99, cal: 720 },
      { cat: 'Breakfast', name: 'Belgian Waffle', desc: 'Crispy Belgian waffle with whipped cream', price: 7.49, cal: 650 },
      { cat: 'Breakfast', name: 'Steak & Eggs', desc: '6oz sirloin steak with two eggs and hash browns', price: 12.99, cal: 980 },
      
      // Sandwiches & Wraps
      { cat: 'Sandwiches & Wraps', name: 'Club Sandwich', desc: 'Triple-decker with turkey, bacon, lettuce, tomato', price: 8.99, cal: 720 },
      { cat: 'Sandwiches & Wraps', name: 'Grilled Chicken Sandwich', desc: 'Grilled chicken breast with lettuce and tomato', price: 8.49, cal: 580 },
      { cat: 'Sandwiches & Wraps', name: 'Chicken Club Wrap', desc: 'Grilled chicken, bacon, ranch in a flour tortilla', price: 8.99, cal: 680 },
      { cat: 'Sandwiches & Wraps', name: 'BLT', desc: 'Classic bacon, lettuce, and tomato sandwich', price: 6.99, cal: 480 },
      { cat: 'Sandwiches & Wraps', name: 'Philly Cheesesteak', desc: 'Sliced beef with peppers, onions, and melted cheese', price: 9.49, cal: 820 },
      { cat: 'Sandwiches & Wraps', name: 'Tuna Melt', desc: 'Tuna salad with melted cheese on grilled bread', price: 7.99, cal: 620 },
      { cat: 'Sandwiches & Wraps', name: 'Fish Sandwich', desc: 'Crispy fish fillet with tartar sauce', price: 7.99, cal: 680 },
      { cat: 'Sandwiches & Wraps', name: 'Reuben', desc: 'Corned beef, sauerkraut, Swiss cheese, Thousand Island', price: 9.49, cal: 780 },
      
      // Salads
      { cat: 'Salads', name: 'Garden Salad', desc: 'Fresh greens with vegetables and choice of dressing', price: 6.99, cal: 280 },
      { cat: 'Salads', name: 'Caesar Salad', desc: 'Romaine lettuce with Caesar dressing and croutons', price: 7.49, cal: 420 },
      { cat: 'Salads', name: 'Grilled Chicken Caesar', desc: 'Caesar salad topped with grilled chicken', price: 9.99, cal: 580 },
      { cat: 'Salads', name: 'Chef Salad', desc: 'Mixed greens with ham, turkey, cheese, and egg', price: 9.49, cal: 520 },
      { cat: 'Salads', name: 'Cobb Salad', desc: 'Chicken, bacon, avocado, egg, blue cheese', price: 10.49, cal: 680 },
      { cat: 'Salads', name: 'Cranberry Walnut Salad', desc: 'Mixed greens with cranberries, walnuts, feta', price: 8.99, cal: 480 },
      
      // Entrees
      { cat: 'Entrees', name: 'Fried Chicken Dinner', desc: 'Four pieces of golden fried chicken', price: 11.99, cal: 920 },
      { cat: 'Entrees', name: 'Pot Roast', desc: 'Tender pot roast with vegetables and gravy', price: 12.99, cal: 780 },
      { cat: 'Entrees', name: 'Meatloaf', desc: 'Homestyle meatloaf with mashed potatoes', price: 11.49, cal: 820 },
      { cat: 'Entrees', name: 'Fish & Chips', desc: 'Beer-battered fish with fries and coleslaw', price: 12.49, cal: 980 },
      { cat: 'Entrees', name: 'Chicken Tenders', desc: 'Five crispy chicken tenders with choice of sauce', price: 9.99, cal: 680 },
      { cat: 'Entrees', name: 'Sirloin Steak', desc: '8oz grilled sirloin steak with sides', price: 14.99, cal: 720 },
      { cat: 'Entrees', name: 'Spaghetti & Meatballs', desc: 'Spaghetti with marinara and three meatballs', price: 10.99, cal: 880 },
      { cat: 'Entrees', name: 'Grilled Salmon', desc: 'Fresh Atlantic salmon with vegetables', price: 13.99, cal: 580 },
      
      // Appetizers
      { cat: 'Appetizers', name: 'Mozzarella Sticks', desc: 'Six breaded mozzarella sticks with marinara', price: 6.99, cal: 680 },
      { cat: 'Appetizers', name: 'Onion Rings', desc: 'Crispy golden onion rings', price: 5.99, cal: 520 },
      { cat: 'Appetizers', name: 'Loaded Fries', desc: 'Fries topped with cheese, bacon, and ranch', price: 7.49, cal: 820 },
      { cat: 'Appetizers', name: 'Chicken Wings', desc: '10 wings with choice of sauce', price: 9.99, cal: 780 },
      { cat: 'Appetizers', name: 'Nachos Supreme', desc: 'Tortilla chips with cheese, jalapeños, sour cream', price: 8.99, cal: 920 },
      { cat: 'Appetizers', name: 'Spinach & Artichoke Dip', desc: 'Creamy dip served with tortilla chips', price: 7.99, cal: 680 },
      { cat: 'Appetizers', name: 'Potato Skins', desc: 'Six loaded potato skins with bacon and cheese', price: 7.49, cal: 720 },
      
      // Desserts
      { cat: 'Desserts', name: 'Hot Fudge Cake', desc: 'Warm chocolate cake with vanilla ice cream', price: 5.99, cal: 680 },
      { cat: 'Desserts', name: 'Apple Pie', desc: 'Classic apple pie with cinnamon', price: 4.99, cal: 420 },
      { cat: 'Desserts', name: 'Cheesecake', desc: 'New York style cheesecake with berry topping', price: 5.49, cal: 520 },
      { cat: 'Desserts', name: 'Brownie Sundae', desc: 'Warm brownie with ice cream and chocolate sauce', price: 5.99, cal: 780 },
      { cat: 'Desserts', name: 'Ice Cream Sundae', desc: 'Three scoops with toppings', price: 4.49, cal: 520 },
      { cat: 'Desserts', name: 'Chocolate Cake', desc: 'Rich chocolate layer cake', price: 5.49, cal: 620 },
      { cat: 'Desserts', name: 'Strawberry Shortcake', desc: 'Fresh strawberries with whipped cream', price: 5.99, cal: 480 },
      
      // Beverages
      { cat: 'Beverages', name: 'Chocolate Shake', desc: 'Thick chocolate milkshake', price: 4.99, cal: 580 },
      { cat: 'Beverages', name: 'Vanilla Shake', desc: 'Creamy vanilla milkshake', price: 4.99, cal: 520 },
      { cat: 'Beverages', name: 'Strawberry Shake', desc: 'Fresh strawberry milkshake', price: 4.99, cal: 540 },
      { cat: 'Beverages', name: 'Soft Drinks', desc: 'Coca-Cola products', price: 2.49, cal: 180 },
      { cat: 'Beverages', name: 'Coffee', desc: 'Fresh brewed coffee', price: 2.29, cal: 5 },
      { cat: 'Beverages', name: 'Iced Tea', desc: 'Freshly brewed iced tea', price: 2.49, cal: 90 },
      { cat: 'Beverages', name: 'Lemonade', desc: 'Fresh squeezed lemonade', price: 2.99, cal: 180 },
      { cat: 'Beverages', name: 'Hot Chocolate', desc: 'Rich hot chocolate with whipped cream', price: 2.99, cal: 280 }
    ];

    for (const item of menuItems) {
      await client.query(
        `INSERT INTO menu_items (category_id, name, description, price, calories, image_url) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [catMap[item.cat], item.name, item.desc, item.price, item.cal, `/images/menu/${item.name.toLowerCase().replace(/\s+/g, '-')}.jpg`]
      );
    }

    // Seed 28 real MI & OH locations
    console.log('Seeding locations...');
    const locations = [
      // Michigan locations
      { name: 'Big Boy - Warren', addr: '28350 Dequindre Rd', city: 'Warren', state: 'MI', zip: '48092', phone: '(586) 574-9200', lat: 42.4897, lon: -83.0386 },
      { name: 'Big Boy - Sterling Heights', addr: '38703 Van Dyke Ave', city: 'Sterling Heights', state: 'MI', zip: '48312', phone: '(586) 979-7660', lat: 42.5758, lon: -83.0238 },
      { name: 'Big Boy - Troy', addr: '2999 E Big Beaver Rd', city: 'Troy', state: 'MI', zip: '48083', phone: '(248) 689-3116', lat: 42.5597, lon: -83.1110 },
      { name: 'Big Boy - Roseville', addr: '28950 Gratiot Ave', city: 'Roseville', state: 'MI', zip: '48066', phone: '(586) 775-5500', lat: 42.5192, lon: -82.9372 },
      { name: 'Big Boy - Clinton Township', addr: '42805 Garfield Rd', city: 'Clinton Township', state: 'MI', zip: '48038', phone: '(586) 286-5780', lat: 42.5869, lon: -82.9186 },
      { name: 'Big Boy - Shelby Township', addr: '45701 Schoenherr Rd', city: 'Shelby Township', state: 'MI', zip: '48315', phone: '(586) 739-7490', lat: 42.6603, lon: -82.9986 },
      { name: 'Big Boy - Livonia', addr: '33427 W 7 Mile Rd', city: 'Livonia', state: 'MI', zip: '48152', phone: '(248) 477-5050', lat: 42.4359, lon: -83.3829 },
      { name: 'Big Boy - Dearborn', addr: '22290 Michigan Ave', city: 'Dearborn', state: 'MI', zip: '48124', phone: '(313) 563-8230', lat: 42.3142, lon: -83.2255 },
      { name: 'Big Boy - Taylor', addr: '22350 Eureka Rd', city: 'Taylor', state: 'MI', zip: '48180', phone: '(734) 287-8390', lat: 42.2089, lon: -83.2599 },
      { name: 'Big Boy - Wyandotte', addr: '3131 Biddle Ave', city: 'Wyandotte', state: 'MI', zip: '48192', phone: '(734) 284-8200', lat: 42.2142, lon: -83.1499 },
      { name: 'Big Boy - Allen Park', addr: '3800 Fairlane Dr', city: 'Allen Park', state: 'MI', zip: '48101', phone: '(313) 271-1200', lat: 42.2639, lon: -83.2110 },
      { name: 'Big Boy - Plymouth', addr: '40900 Ann Arbor Rd', city: 'Plymouth', state: 'MI', zip: '48170', phone: '(734) 459-5000', lat: 42.3695, lon: -83.4657 },
      { name: 'Big Boy - Westland', addr: '36750 Warren Rd', city: 'Westland', state: 'MI', zip: '48185', phone: '(734) 467-1760', lat: 42.3214, lon: -83.3799 },
      { name: 'Big Boy - Farmington Hills', addr: '30450 Grand River Ave', city: 'Farmington Hills', state: 'MI', zip: '48336', phone: '(248) 478-2700', lat: 42.4670, lon: -83.3774 },
      { name: 'Big Boy - Novi', addr: '27750 Novi Rd', city: 'Novi', state: 'MI', zip: '48377', phone: '(248) 349-3305', lat: 42.4825, lon: -83.4755 },
      { name: 'Big Boy - Royal Oak', addr: '32711 Woodward Ave', city: 'Royal Oak', state: 'MI', zip: '48073', phone: '(248) 549-7360', lat: 42.5050, lon: -83.1449 },
      { name: 'Big Boy - Flint', addr: '4405 Corunna Rd', city: 'Flint', state: 'MI', zip: '48532', phone: '(810) 733-2800', lat: 43.0125, lon: -83.6597 },
      { name: 'Big Boy - Saginaw', addr: '5695 Bay Rd', city: 'Saginaw', state: 'MI', zip: '48604', phone: '(989) 790-7920', lat: 43.4519, lon: -83.8885 },
      
      // Ohio locations
      { name: 'Big Boy - Toledo', addr: '5230 Monroe St', city: 'Toledo', state: 'OH', zip: '43623', phone: '(419) 885-3663', lat: 41.6764, lon: -83.6278 },
      { name: 'Big Boy - Maumee', addr: '1435 Reynolds Rd', city: 'Maumee', state: 'OH', zip: '43537', phone: '(419) 893-0496', lat: 41.5728, lon: -83.6538 },
      { name: 'Big Boy - Perrysburg', addr: '27349 Carronade Dr', city: 'Perrysburg', state: 'OH', zip: '43551', phone: '(419) 874-2447', lat: 41.5570, lon: -83.6271 },
      { name: 'Big Boy - Sylvania', addr: '5860 Monroe St', city: 'Sylvania', state: 'OH', zip: '43560', phone: '(419) 882-3030', lat: 41.7131, lon: -83.7130 },
      { name: 'Big Boy - Oregon', addr: '2934 Navarre Ave', city: 'Oregon', state: 'OH', zip: '43616', phone: '(419) 693-0557', lat: 41.6436, lon: -83.4869 },
      { name: 'Big Boy - Bowling Green', addr: '1570 E Wooster St', city: 'Bowling Green', state: 'OH', zip: '43402', phone: '(419) 352-2193', lat: 41.3748, lon: -83.6127 },
      { name: 'Big Boy - Findlay', addr: '1630 Tiffin Ave', city: 'Findlay', state: 'OH', zip: '45840', phone: '(419) 422-4567', lat: 41.0442, lon: -83.6499 },
      { name: 'Big Boy - Lima', addr: '2390 Elida Rd', city: 'Lima', state: 'OH', zip: '45805', phone: '(419) 331-2400', lat: 40.7425, lon: -84.0521 },
      { name: 'Big Boy - Fremont', addr: '1940 W State St', city: 'Fremont', state: 'OH', zip: '43420', phone: '(419) 332-5551', lat: 41.3504, lon: -83.1385 },
      { name: 'Big Boy - Sandusky', addr: '5551 Milan Rd', city: 'Sandusky', state: 'OH', zip: '44870', phone: '(419) 626-3663', lat: 41.4392, lon: -82.6738 }
    ];

    for (const loc of locations) {
      await client.query(
        `INSERT INTO locations (name, address, city, state, zip, phone, latitude, longitude, 
         hours_monday, hours_tuesday, hours_wednesday, hours_thursday, hours_friday, hours_saturday, hours_sunday) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [loc.name, loc.addr, loc.city, loc.state, loc.zip, loc.phone, loc.lat, loc.lon,
         '6:00 AM - 10:00 PM', '6:00 AM - 10:00 PM', '6:00 AM - 10:00 PM', '6:00 AM - 10:00 PM',
         '6:00 AM - 11:00 PM', '6:00 AM - 11:00 PM', '7:00 AM - 9:00 PM']
      );
    }

    // Create demo user
    console.log('Creating demo user...');
    const demoPassword = await hashPassword('demo123');
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['demo@bigboy.com', demoPassword, 'Demo', 'User', '555-123-4567']
    );
    const demoUserId = userResult.rows[0].id;

    // Create rewards for demo user
    await client.query(
      'INSERT INTO rewards (user_id, tier_id, points, lifetime_points) VALUES ($1, 2, 750, 750)',
      [demoUserId]
    );

    // Add some favorites for demo user
    const menuItemsResult = await client.query('SELECT id FROM menu_items LIMIT 5');
    for (const item of menuItemsResult.rows) {
      await client.query(
        'INSERT INTO favorites (user_id, menu_item_id) VALUES ($1, $2)',
        [demoUserId, item.id]
      );
    }

    // Add welcome notification
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type) 
       VALUES ($1, 'Welcome to Big Boy!', 'Thank you for joining our loyalty program. Start earning rewards with every order!', 'info')`,
      [demoUserId]
    );

    console.log('Database seeded successfully!');
    console.log('Demo user credentials: demo@bigboy.com / demo123');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run seed if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seed completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
