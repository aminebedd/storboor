/**
 * Core TypeScript interfaces for the DoorWin Pro application.
 * These types are designed to map directly to database entities.
 */

// ==========================================
// PRODUCT & CATEGORY TYPES
// ==========================================

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSpecifications {
  dimensions?: string;
  insulation?: string;
  colors?: string[];
  material?: string;
  weight?: string;
  warranty?: string;
}

export interface Product {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  description: string;
  descriptionAr: string;
  descriptionFr: string;
  categoryId: string;
  material: string;
  price: number | null; // null means "Request Quote"
  stockQuantity: number;
  lowStockThreshold: number;
  specifications: ProductSpecifications;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithCategory extends Product {
  category: Category;
}

// ==========================================
// CUSTOMER TYPES
// ==========================================

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  city?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// ORDER TYPES
// ==========================================

export type OrderStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  priceAtOrder: number | null;
  subtotal: number | null;
}

export interface OrderItemWithProduct extends OrderItem {
  product: Product;
}

export interface Order {
  id: string;
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  customerAddress?: string;
  customerCity?: string;
  customerNotes?: string;
  status: OrderStatus;
  totalPrice: number | null;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderWithDetails extends Order {
  customer: Customer;
  itemsWithProducts: OrderItemWithProduct[];
}

// ==========================================
// QUOTE REQUEST TYPES
// ==========================================

export interface QuoteRequest {
  id: string;
  customerId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  projectType: 'residential' | 'commercial' | 'renovation';
  message: string;
  productIds: string[];
  status: 'pending' | 'contacted' | 'quoted' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==========================================
// FILTER & QUERY TYPES
// ==========================================

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface OrderFilters {
  status?: OrderStatus;
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// ==========================================
// FORM INPUT TYPES
// ==========================================

export interface CreateProductInput {
  name: string;
  nameAr: string;
  nameFr: string;
  description: string;
  descriptionAr: string;
  descriptionFr: string;
  categoryId: string;
  material: string;
  price: number | null;
  stockQuantity: number;
  lowStockThreshold?: number;
  specifications?: ProductSpecifications;
  images?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}

export interface CreateOrderInput {
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  customerAddress?: string;
  customerCity?: string;
  customerNotes?: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatus;
}

// ==========================================
// DASHBOARD STATISTICS TYPES
// ==========================================

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  totalRevenue: number;
  totalCustomers: number;
}

export interface OrdersByMonth {
  month: string;
  orders: number;
  revenue: number;
}

export interface ProductsByCategory {
  categoryId: string;
  categoryName: string;
  count: number;
}
