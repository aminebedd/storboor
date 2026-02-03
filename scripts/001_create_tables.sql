-- =====================================================
-- DoorWin Pro - Database Schema (Updated)
-- Run this script in Supabase SQL Editor
-- شغّل هذا السكريبت في محرر SQL في Supabase
-- =====================================================

-- Drop existing tables if you want a fresh start (CAREFUL!)
-- DROP TABLE IF EXISTS stock_history CASCADE;
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS customers CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;

-- =====================================================
-- Categories Table / جدول الفئات
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  name_fr VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Products Table / جدول المنتجات
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  name_fr VARCHAR(255) NOT NULL,
  description TEXT,
  description_ar TEXT,
  description_fr TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  material VARCHAR(255),
  price DECIMAL(12, 2),
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  specifications JSONB,
  images TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Customers Table / جدول العملاء
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Orders Table / جدول الطلبات
-- IMPORTANT: Orders store customer info directly to preserve
-- history even if customer record changes
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_first_name VARCHAR(255) NOT NULL,
  customer_last_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_company VARCHAR(255),
  customer_address TEXT,
  customer_city VARCHAR(100),
  customer_notes TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  total_price DECIMAL(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Order Items Table / جدول عناصر الطلب
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_order DECIMAL(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Stock History Table / جدول سجل المخزون
-- Tracks all stock changes for audit trail
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('add', 'remove', 'adjust', 'order_approved', 'order_cancelled')),
  quantity_change INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance / فهارس للأداء
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_product ON stock_history(product_id);

-- =====================================================
-- Row Level Security (RLS) / سياسات الأمان
-- =====================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "categories_select_all" ON categories;
DROP POLICY IF EXISTS "categories_insert_auth" ON categories;
DROP POLICY IF EXISTS "categories_update_auth" ON categories;
DROP POLICY IF EXISTS "categories_delete_auth" ON categories;
DROP POLICY IF EXISTS "products_select_all" ON products;
DROP POLICY IF EXISTS "products_select_active" ON products;
DROP POLICY IF EXISTS "products_insert_auth" ON products;
DROP POLICY IF EXISTS "products_update_auth" ON products;
DROP POLICY IF EXISTS "products_delete_auth" ON products;
DROP POLICY IF EXISTS "customers_select_auth" ON customers;
DROP POLICY IF EXISTS "customers_insert_all" ON customers;
DROP POLICY IF EXISTS "customers_update_auth" ON customers;
DROP POLICY IF EXISTS "customers_delete_auth" ON customers;
DROP POLICY IF EXISTS "orders_select_auth" ON orders;
DROP POLICY IF EXISTS "orders_insert_all" ON orders;
DROP POLICY IF EXISTS "orders_update_auth" ON orders;
DROP POLICY IF EXISTS "orders_delete_auth" ON orders;
DROP POLICY IF EXISTS "order_items_select_auth" ON order_items;
DROP POLICY IF EXISTS "order_items_insert_all" ON order_items;
DROP POLICY IF EXISTS "order_items_update_auth" ON order_items;
DROP POLICY IF EXISTS "order_items_delete_auth" ON order_items;
DROP POLICY IF EXISTS "stock_history_select_auth" ON stock_history;
DROP POLICY IF EXISTS "stock_history_insert_auth" ON stock_history;

-- Categories: Public read, Admin write
CREATE POLICY "categories_select_all" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_insert_auth" ON categories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "categories_update_auth" ON categories FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "categories_delete_auth" ON categories FOR DELETE USING (auth.uid() IS NOT NULL);

-- Products: Public read (active or if admin), Admin write
CREATE POLICY "products_select_all" ON products FOR SELECT USING (is_active = true OR auth.uid() IS NOT NULL);
CREATE POLICY "products_insert_auth" ON products FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "products_update_auth" ON products FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "products_delete_auth" ON products FOR DELETE USING (auth.uid() IS NOT NULL);

-- Customers: Public insert (for creating orders), Admin read/update/delete
CREATE POLICY "customers_select_auth" ON customers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "customers_insert_all" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "customers_update_auth" ON customers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "customers_delete_auth" ON customers FOR DELETE USING (auth.uid() IS NOT NULL);

-- Orders: Public insert (for creating orders), Admin read/update/delete
CREATE POLICY "orders_select_auth" ON orders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "orders_insert_all" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_update_auth" ON orders FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "orders_delete_auth" ON orders FOR DELETE USING (auth.uid() IS NOT NULL);

-- Order Items: Public insert, Admin read/update/delete
CREATE POLICY "order_items_select_auth" ON order_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "order_items_insert_all" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_update_auth" ON order_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "order_items_delete_auth" ON order_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- Stock History: Admin only
CREATE POLICY "stock_history_select_auth" ON stock_history FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "stock_history_insert_auth" ON stock_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- Auto-update Timestamps / تحديث التواريخ تلقائياً
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Seed Data: Categories / بيانات أولية: الفئات
-- =====================================================
INSERT INTO categories (name, name_ar, name_fr, slug, description, is_active) VALUES
('Doors', 'أبواب', 'Portes', 'doors', 'High quality entrance and interior doors', true),
('Windows', 'نوافذ', 'Fenêtres', 'windows', 'Modern windows with thermal insulation', true),
('Sliding Systems', 'أنظمة منزلقة', 'Systèmes Coulissants', 'sliding-systems', 'Sliding doors and windows', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  name_fr = EXCLUDED.name_fr;

-- =====================================================
-- Seed Data: Sample Products / بيانات أولية: منتجات
-- =====================================================
INSERT INTO products (name, name_ar, name_fr, description, description_ar, description_fr, category_id, price, stock_quantity, low_stock_threshold, material, specifications, images, is_active, is_featured)
SELECT 
  'Premium Aluminum Door',
  'باب ألمنيوم فاخر',
  'Porte Aluminium Premium',
  'Premium aluminum entrance door with secure glazing and modern finish.',
  'باب مدخل من الألمنيوم الفاخر مع زجاج آمن وتشطيب عصري.',
  'Porte d''entrée en aluminium premium avec vitrage sécurisé et finition moderne.',
  c.id,
  185000,
  25,
  5,
  'Aluminium',
  '{"dimensions": "220 x 100 cm", "insulation": "Thermal", "colors": ["Black", "White", "Gray"]}'::jsonb,
  ARRAY['/images/products/aluminum-door.jpg'],
  true,
  true
FROM categories c WHERE c.slug = 'doors'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, name_ar, name_fr, description, description_ar, description_fr, category_id, price, stock_quantity, low_stock_threshold, material, specifications, images, is_active, is_featured)
SELECT 
  'PVC Double Glazing Window',
  'نافذة PVC زجاج مزدوج',
  'Fenêtre PVC Double Vitrage',
  'PVC window with double glazing for optimal insulation.',
  'نافذة PVC مع زجاج مزدوج لعزل مثالي.',
  'Fenêtre PVC avec double vitrage pour une isolation optimale.',
  c.id,
  45000,
  50,
  10,
  'PVC',
  '{"dimensions": "120 x 100 cm", "insulation": "Double glazing", "colors": ["White", "Beige"]}'::jsonb,
  ARRAY['/images/products/pvc-window.jpg'],
  true,
  true
FROM categories c WHERE c.slug = 'windows'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, name_ar, name_fr, description, description_ar, description_fr, category_id, price, stock_quantity, low_stock_threshold, material, specifications, images, is_active, is_featured)
SELECT 
  'Solid Wood Door',
  'باب خشب صلب',
  'Porte Bois Massif',
  'Solid wood door with elegant traditional finish.',
  'باب من الخشب الصلب بتشطيب تقليدي أنيق.',
  'Porte en bois massif avec finition traditionnelle élégante.',
  c.id,
  250000,
  15,
  3,
  'Solid Wood',
  '{"dimensions": "220 x 90 cm", "insulation": "Standard", "colors": ["Oak", "Walnut", "Mahogany"]}'::jsonb,
  ARRAY['/images/products/wooden-door.jpg'],
  true,
  false
FROM categories c WHERE c.slug = 'doors'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, name_ar, name_fr, description, description_ar, description_fr, category_id, price, stock_quantity, low_stock_threshold, material, specifications, images, is_active, is_featured)
SELECT 
  'Sliding Glass Door',
  'باب زجاجي منزلق',
  'Baie Vitrée Coulissante',
  'Large sliding glass door for maximum natural light.',
  'باب زجاجي منزلق كبير لأقصى قدر من الإضاءة الطبيعية.',
  'Grande baie vitrée coulissante pour un maximum de luminosité.',
  c.id,
  320000,
  8,
  2,
  'Aluminium & Glass',
  '{"dimensions": "300 x 220 cm", "insulation": "Triple glazing", "colors": ["Black", "Anthracite"]}'::jsonb,
  ARRAY['/images/products/sliding-door.jpg'],
  true,
  true
FROM categories c WHERE c.slug = 'sliding-systems'
ON CONFLICT DO NOTHING;

-- Low stock product for testing alerts
INSERT INTO products (name, name_ar, name_fr, description, description_ar, description_fr, category_id, price, stock_quantity, low_stock_threshold, material, is_active)
SELECT 
  'Security Steel Door',
  'باب حديد أمني',
  'Porte Sécurité Acier',
  'High security steel door.',
  'باب حديد عالي الأمان.',
  'Porte en acier haute sécurité.',
  c.id,
  280000,
  3,
  5,
  'Steel',
  true
FROM categories c WHERE c.slug = 'doors'
ON CONFLICT DO NOTHING;

-- Out of stock product for testing
INSERT INTO products (name, name_ar, name_fr, description, description_ar, description_fr, category_id, price, stock_quantity, low_stock_threshold, material, is_active)
SELECT 
  'Luxury French Window',
  'نافذة فرنسية فاخرة',
  'Fenêtre Française Luxe',
  'Luxury French style window.',
  'نافذة فاخرة على الطراز الفرنسي.',
  'Fenêtre de luxe style français.',
  c.id,
  95000,
  0,
  5,
  'Wood & Glass',
  true
FROM categories c WHERE c.slug = 'windows'
ON CONFLICT DO NOTHING;

-- =====================================================
-- Success Message
-- =====================================================
SELECT 'Database setup completed successfully!' as message;
