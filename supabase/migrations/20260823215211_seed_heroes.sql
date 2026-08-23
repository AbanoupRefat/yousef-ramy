-- Seed Data Migration
-- Uses hardcoded UUIDs so we can easily target and delete them later via the cleanup script.

-- 1. Insert a default bonus type
INSERT INTO bonus_types (id, name, kind, params) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Commission', 'percentage_commission', '{"percent": 50}');

-- 2. Insert Heroes (Yousef and Ramy)
INSERT INTO staff (id, name, role, bonus_type_id) 
VALUES 
('00000000-0000-0000-0000-000000000002', 'Yousef', 'hero', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000003', 'Ramy', 'hero', '00000000-0000-0000-0000-000000000001');

-- 3. Insert basic Services
INSERT INTO services (id, name) 
VALUES 
('00000000-0000-0000-0000-000000000004', 'Haircut'),
('00000000-0000-0000-0000-000000000005', 'Beard Trim');

-- 4. Insert basic Products
INSERT INTO products (id, name, stock_qty, low_stock_threshold, unit_cost, sale_price) 
VALUES 
('00000000-0000-0000-0000-000000000006', 'Pomade', 10, 3, 5.00, 15.00);
