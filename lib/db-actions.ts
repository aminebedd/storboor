"use server";

/**
 * Unified Database Actions for Supabase
 * All data comes from PostgreSQL via Supabase
 * جميع البيانات تأتي من قاعدة البيانات الحقيقية
 */

import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  Product,
  Customer,
  Order,
  OrderItem,
  ProductWithCategory,
  OrderWithItems,
  StockHistory,
} from "@/types/database";

// ==========================================
// CATEGORIES - الفئات
// ==========================================

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("[DB] Error fetching categories:", error);
    return [];
  }
  return data || [];
}

export async function getAllCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("[DB] Error fetching all categories:", error);
    return [];
  }
  return data || [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("[DB] Error fetching category:", error);
    return null;
  }
  return data;
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[DB] Error fetching category:", error);
    return null;
  }
  return data;
}

// ==========================================
// PRODUCTS - المنتجات
// ==========================================

export async function getProducts(options?: {
  categorySlug?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  limit?: number;
  search?: string;
}): Promise<ProductWithCategory[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from("products")
    .select(`
      *,
      categories (*)
    `)
    .order("created_at", { ascending: false });

  if (options?.isActive !== undefined) {
    query = query.eq("is_active", options.isActive);
  }

  if (options?.isFeatured) {
    query = query.eq("is_featured", true);
  }

  if (options?.categorySlug) {
    const category = await getCategoryBySlug(options.categorySlug);
    if (category) {
      query = query.eq("category_id", category.id);
    }
  }

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,name_ar.ilike.%${options.search}%,name_fr.ilike.%${options.search}%`);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[DB] Error fetching products:", error);
    return [];
  }
  return data || [];
}

export async function getProductById(id: string): Promise<ProductWithCategory | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("[DB] Error fetching product:", error);
    return null;
  }
  return data;
}

export async function getFeaturedProducts(limit = 6): Promise<ProductWithCategory[]> {
  return getProducts({ isActive: true, isFeatured: true, limit });
}

export async function getProductsByCategory(categorySlug: string): Promise<ProductWithCategory[]> {
  return getProducts({ categorySlug, isActive: true });
}

export async function getLowStockProducts(threshold?: number): Promise<Product[]> {
  const supabase = await createClient();
  
  // Get products where stock is below their threshold
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .or("stock_quantity.lte.low_stock_threshold");

  if (error) {
    console.error("[DB] Error fetching low stock products:", error);
    return [];
  }

  // Filter in JS since Supabase doesn't support column-to-column comparison easily
  return (data || []).filter(p => p.stock_quantity <= p.low_stock_threshold);
}

export async function getOutOfStockProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("stock_quantity", 0);

  if (error) {
    console.error("[DB] Error fetching out of stock products:", error);
    return [];
  }
  return data || [];
}

// ==========================================
// CUSTOMERS - العملاء
// ==========================================

export async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[DB] Error fetching customers:", error);
    return [];
  }
  return data || [];
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[DB] Error fetching customer:", error);
    return null;
  }
  return data;
}

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("email", email)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[DB] Error fetching customer:", error);
  }
  return data || null;
}

// ==========================================
// ORDERS - الطلبات
// ==========================================

export async function getOrders(options?: {
  status?: string;
  limit?: number;
  customerId?: string;
}): Promise<OrderWithItems[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (*)
      )
    `)
    .order("created_at", { ascending: false });

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options?.customerId) {
    query = query.eq("customer_id", options.customerId);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[DB] Error fetching orders:", error);
    return [];
  }
  return data || [];
}

export async function getOrderById(id: string): Promise<OrderWithItems | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (*)
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("[DB] Error fetching order:", error);
    return null;
  }
  return data;
}

export async function getRecentOrders(limit = 5): Promise<OrderWithItems[]> {
  return getOrders({ limit });
}

export async function getPendingOrdersCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) {
    console.error("[DB] Error counting pending orders:", error);
    return 0;
  }
  return count || 0;
}

// ==========================================
// DASHBOARD STATS - إحصائيات لوحة التحكم
// ==========================================

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  completedOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentOrders: OrderWithItems[];
  lowStockProducts: Product[];
  ordersByMonth: { month: string; count: number; revenue: number }[];
  productsByCategory: { category: string; count: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  // Parallel fetching for performance
  const [
    productsResult,
    ordersResult,
    customersResult,
    recentOrdersResult,
  ] = await Promise.all([
    supabase.from("products").select("id, stock_quantity, low_stock_threshold, is_active, category_id"),
    supabase.from("orders").select("id, status, total_price, created_at"),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("orders").select(`
      *,
      order_items (
        *,
        products (*)
      )
    `).order("created_at", { ascending: false }).limit(5),
  ]);

  const products = productsResult.data || [];
  const orders = ordersResult.data || [];
  const customersCount = customersResult.count || 0;
  const recentOrders = recentOrdersResult.data || [];

  // Calculate stats
  const activeProducts = products.filter(p => p.is_active);
  const lowStockProducts = activeProducts.filter(p => p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0);
  const outOfStockProducts = activeProducts.filter(p => p.stock_quantity === 0);

  const pendingOrders = orders.filter(o => o.status === "pending");
  const approvedOrders = orders.filter(o => o.status === "approved");
  const completedOrders = orders.filter(o => o.status === "completed");
  
  const totalRevenue = orders
    .filter(o => o.status === "completed" || o.status === "approved")
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  // Orders by month (last 6 months)
  const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
  const ordersByMonth: { month: string; count: number; revenue: number }[] = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const monthStart = new Date(year, date.getMonth(), 1);
    const monthEnd = new Date(year, date.getMonth() + 1, 0);
    
    const monthOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate >= monthStart && orderDate <= monthEnd;
    });
    
    ordersByMonth.push({
      month,
      count: monthOrders.length,
      revenue: monthOrders.reduce((sum, o) => sum + (o.total_price || 0), 0),
    });
  }

  // Products by category
  const { data: categories } = await supabase.from("categories").select("id, name_fr");
  const productsByCategory = (categories || []).map(cat => ({
    category: cat.name_fr,
    count: products.filter(p => p.category_id === cat.id && p.is_active).length,
  })).filter(c => c.count > 0);

  // Get full low stock product data
  const { data: lowStockData } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .gt("stock_quantity", 0)
    .order("stock_quantity");
  
  const lowStockFull = (lowStockData || []).filter(p => p.stock_quantity <= p.low_stock_threshold);

  return {
    totalProducts: products.length,
    activeProducts: activeProducts.length,
    totalOrders: orders.length,
    pendingOrders: pendingOrders.length,
    approvedOrders: approvedOrders.length,
    completedOrders: completedOrders.length,
    totalCustomers: customersCount,
    totalRevenue,
    lowStockCount: lowStockProducts.length,
    outOfStockCount: outOfStockProducts.length,
    recentOrders,
    lowStockProducts: lowStockFull,
    ordersByMonth,
    productsByCategory,
  };
}

// ==========================================
// STOCK MANAGEMENT - إدارة المخزون
// ==========================================

export async function updateProductStock(
  productId: string,
  newQuantity: number,
  changeType: "add" | "remove" | "adjust",
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get current product
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("stock_quantity")
    .eq("id", productId)
    .single();

  if (fetchError || !product) {
    return { success: false, error: "Product not found" };
  }

  const previousQuantity = product.stock_quantity;
  const quantityChange = newQuantity - previousQuantity;

  // Update product stock
  const { error: updateError } = await supabase
    .from("products")
    .update({ stock_quantity: newQuantity })
    .eq("id", productId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Record in stock history
  await supabase.from("stock_history").insert({
    product_id: productId,
    change_type: changeType,
    quantity_change: quantityChange,
    previous_quantity: previousQuantity,
    new_quantity: newQuantity,
    notes,
  });

  return { success: true };
}

// ==========================================
// ORDER ACTIONS - إجراءات الطلبات
// ==========================================

export async function approveOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get order with items
  const order = await getOrderById(orderId);
  if (!order) {
    return { success: false, error: "Order not found" };
  }

  if (order.status !== "pending") {
    return { success: false, error: "Order is not pending" };
  }

  // Check stock availability
  for (const item of order.order_items) {
    if (item.products && item.quantity > item.products.stock_quantity) {
      return { 
        success: false, 
        error: `Insufficient stock for ${item.product_name}` 
      };
    }
  }

  // Deduct stock for each item
  for (const item of order.order_items) {
    if (item.products) {
      const newStock = item.products.stock_quantity - item.quantity;
      
      await supabase
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", item.product_id);

      await supabase.from("stock_history").insert({
        product_id: item.product_id,
        change_type: "order_approved",
        quantity_change: -item.quantity,
        previous_quantity: item.products.stock_quantity,
        new_quantity: newStock,
        order_id: orderId,
        notes: `Order ${orderId} approved`,
      });
    }
  }

  // Update order status
  const { error } = await supabase
    .from("orders")
    .update({ status: "approved" })
    .eq("id", orderId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function rejectOrder(orderId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ 
      status: "rejected",
      customer_notes: reason || "Order rejected"
    })
    .eq("id", orderId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function completeOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ status: "completed" })
    .eq("id", orderId)
    .eq("status", "approved");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function cancelOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const order = await getOrderById(orderId);
  if (!order) {
    return { success: false, error: "Order not found" };
  }

  // If order was approved, restore stock
  if (order.status === "approved") {
    for (const item of order.order_items) {
      if (item.products) {
        const newStock = item.products.stock_quantity + item.quantity;
        
        await supabase
          .from("products")
          .update({ stock_quantity: newStock })
          .eq("id", item.product_id);

        await supabase.from("stock_history").insert({
          product_id: item.product_id,
          change_type: "order_cancelled",
          quantity_change: item.quantity,
          previous_quantity: item.products.stock_quantity,
          new_quantity: newStock,
          order_id: orderId,
          notes: `Order ${orderId} cancelled - stock restored`,
        });
      }
    }
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ==========================================
// CREATE/UPDATE OPERATIONS - إنشاء وتحديث
// ==========================================

export async function createProduct(data: {
  name: string;
  name_ar: string;
  name_fr: string;
  description?: string;
  description_ar?: string;
  description_fr?: string;
  category_id: string;
  material?: string;
  price?: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  specifications?: Record<string, unknown>;
  images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
}): Promise<{ success: boolean; data?: Product; error?: string }> {
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .insert(data)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: product };
}

export async function updateProduct(
  id: string, 
  data: Partial<Product>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update(data)
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function createCategory(data: {
  name: string;
  name_ar: string;
  name_fr: string;
  slug: string;
  description?: string;
  image?: string;
}): Promise<{ success: boolean; data?: Category; error?: string }> {
  const supabase = await createClient();

  const { data: category, error } = await supabase
    .from("categories")
    .insert(data)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: category };
}

export async function updateCategory(
  id: string, 
  data: Partial<Category>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .update(data)
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
