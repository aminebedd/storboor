-- Additional Seed Data for Products
-- Note: Categories are already created in 001_create_tables.sql

-- Get category IDs and insert products
DO $$
DECLARE
  doors_id UUID;
  windows_id UUID;
  sliding_id UUID;
BEGIN
  SELECT id INTO doors_id FROM categories WHERE slug = 'doors';
  SELECT id INTO windows_id FROM categories WHERE slug = 'windows';
  SELECT id INTO sliding_id FROM categories WHERE slug = 'sliding-systems';

  -- Only insert if products table is empty
  IF NOT EXISTS (SELECT 1 FROM products LIMIT 1) THEN
    -- Doors
    INSERT INTO products (name_fr, name_ar, description_fr, description_ar, category_id, price, stock_quantity, low_stock_threshold, material, dimensions, insulation, colors, images) VALUES
    (
      'Porte d''Entrée Aluminium Premium',
      'باب دخول ألومنيوم فاخر',
      'Porte d''entrée en aluminium de haute qualité avec serrure multipoints et isolation thermique supérieure.',
      'باب دخول من الألومنيوم عالي الجودة مع قفل متعدد النقاط وعزل حراري فائق.',
      doors_id,
      125000,
      15,
      5,
      'Aluminium',
      '215 x 90 cm',
      'Thermique',
      ARRAY['Noir', 'Blanc', 'Gris Anthracite'],
      ARRAY['/images/products/aluminum-door.jpg']
    ),
    (
      'Porte Intérieure Bois Massif',
      'باب داخلي خشب صلب',
      'Porte intérieure en bois massif avec finition élégante et charnières invisibles.',
      'باب داخلي من الخشب الصلب مع تشطيب أنيق ومفصلات مخفية.',
      doors_id,
      45000,
      25,
      8,
      'Bois Massif',
      '204 x 83 cm',
      'Standard',
      ARRAY['Chêne', 'Noyer', 'Blanc'],
      ARRAY['/images/products/wooden-door.jpg']
    ),
    (
      'Porte Blindée Sécurité',
      'باب مصفح أمان',
      'Porte blindée avec certification de sécurité, idéale pour les entrées principales.',
      'باب مصفح بشهادة أمان، مثالي للمداخل الرئيسية.',
      doors_id,
      185000,
      8,
      3,
      'Acier + Aluminium',
      '215 x 90 cm',
      'Renforcée',
      ARRAY['Noir', 'Marron'],
      ARRAY['/images/products/aluminum-door.jpg']
    ),
    
    -- Windows
    (
      'Fenêtre PVC Double Vitrage',
      'نافذة PVC زجاج مزدوج',
      'Fenêtre PVC avec double vitrage pour une isolation thermique et acoustique optimale.',
      'نافذة PVC مع زجاج مزدوج لعزل حراري وصوتي مثالي.',
      windows_id,
      35000,
      40,
      10,
      'PVC',
      '120 x 100 cm',
      'Double Vitrage',
      ARRAY['Blanc', 'Gris'],
      ARRAY['/images/products/pvc-window.jpg']
    ),
    (
      'Fenêtre Aluminium Oscillo-Battante',
      'نافذة ألومنيوم قابلة للإمالة والفتح',
      'Fenêtre aluminium avec système oscillo-battant pour une ventilation contrôlée.',
      'نافذة ألومنيوم مع نظام قابل للإمالة والفتح للتهوية المتحكم بها.',
      windows_id,
      48000,
      30,
      8,
      'Aluminium',
      '140 x 120 cm',
      'Triple Vitrage',
      ARRAY['Noir', 'Blanc', 'Anthracite'],
      ARRAY['/images/products/pvc-window.jpg']
    ),
    (
      'Fenêtre Fixe Panoramique',
      'نافذة ثابتة بانورامية',
      'Grande fenêtre fixe pour une vue panoramique et un maximum de lumière naturelle.',
      'نافذة ثابتة كبيرة لإطلالة بانورامية وأقصى قدر من الإضاءة الطبيعية.',
      windows_id,
      65000,
      12,
      4,
      'Aluminium',
      '200 x 150 cm',
      'Triple Vitrage',
      ARRAY['Noir', 'Gris'],
      ARRAY['/images/products/pvc-window.jpg']
    ),
    
    -- Sliding Systems
    (
      'Baie Vitrée Coulissante',
      'باب زجاجي منزلق',
      'Grande baie vitrée coulissante avec rail encastré pour une ouverture fluide.',
      'باب زجاجي منزلق كبير مع سكة مدمجة لفتح سلس.',
      sliding_id,
      195000,
      10,
      3,
      'Aluminium',
      '300 x 215 cm',
      'Double Vitrage',
      ARRAY['Noir', 'Blanc'],
      ARRAY['/images/products/sliding-door.jpg']
    ),
    (
      'Porte Coulissante Levante',
      'باب منزلق رافع',
      'Système de porte coulissante levante pour grandes ouvertures avec isolation maximale.',
      'نظام باب منزلق رافع للفتحات الكبيرة مع عزل أقصى.',
      sliding_id,
      280000,
      5,
      2,
      'Aluminium Premium',
      '400 x 230 cm',
      'Triple Vitrage',
      ARRAY['Anthracite', 'Bronze'],
      ARRAY['/images/products/sliding-door.jpg']
    ),
    (
      'Fenêtre Coulissante',
      'نافذة منزلقة',
      'Fenêtre coulissante compacte idéale pour les espaces réduits.',
      'نافذة منزلقة مدمجة مثالية للمساحات الصغيرة.',
      sliding_id,
      42000,
      20,
      6,
      'PVC',
      '150 x 100 cm',
      'Double Vitrage',
      ARRAY['Blanc', 'Gris'],
      ARRAY['/images/products/sliding-door.jpg']
    );
  END IF;
END $$;
