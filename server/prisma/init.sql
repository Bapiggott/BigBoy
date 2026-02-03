-- Big Boy Database Initialization
-- This script runs when the MySQL container is first created

-- Set character set
ALTER DATABASE bigboy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant permissions
GRANT ALL PRIVILEGES ON bigboy_db.* TO 'bigboy'@'%';
FLUSH PRIVILEGES;
