"use server";

/**
 * Server Actions for Dashboard Statistics
 * Provides real-time statistics from Supabase
 * 
 * يوفر إحصائيات في الوقت الفعلي من Supabase
 */

import { createClient } from "@/lib/supabase/server";

// ==========================================
// TYPES / الأنواع
// ==========================================

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  completedOrders: number;
  rejectedOrders: number;
  totalRevenue: number;
  recentOrders: RecentOrder[];
  lowStockItems: LowStockItem[];
  ordersByMonth: MonthlyOrderData[];
  productsByCategory: CategoryProductCount[];
}

export interface RecentOrder {
  id: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  status: string;
  total_price: number | null;
  created_at: string;
  items_count: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  name_ar: string;
  name_fr: string;
  stock_quantity: number;
  low_stock_threshold: number;
}

export interface MonthlyOrderData {
  month: string;
  orders: number;
  revenue: number;
}

export interface CategoryProductCount {
  category: string;
  count: number;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardStats | null;
  error: string | null;
}

// ==========================================
// MAIN FUNCTION / الدالة الرئيسية
// ==========================================

export async function getDashboardStats(): Promise<DashboardResponse> {
  try {
    const supabase = await createClient();

    // Parallel fetch for better performance
    const [
      productsResult,
      ordersResult,
      recentOrdersResult,
      lowStockResult,
      categoriesResult
    ] = await Promise.all([
      // Get all products
      supabase
        .from("products")
        .select("id, stock_quantity, low_stock_threshold, is_active, category_id"),
      
      // Get all orders
      supabase
        .from("orders")
        .select("id, status, total_price, created_at"),
      
      // Get recent orders with item count
      supabase
        .from("orders")
        .select(`
          id,
          customer_first_name,
          customer_last_name,
          customer_email,
          status,
          total_price,
          created_at,
          order_items (id)
        `)
        .order("created_at", { ascending: false })
        .limit(5),
      
      // Get low stock items
      supabase
        .from("products")
        .select("id, name, name_ar, name_fr, stock_quantity, low_stock_threshold")
        .eq("is_active", true)
        .lte("stock_quantity", 10)
        .order("stock_quantity", { ascending: true })
        .limit(10),
      
      // Get categories for product distribution
      supabase
        .from("categories")
        .select("id, name, name_fr")
    ]);

    // Handle errors
    if (productsResult.error) {
      console.error("Products fetch error:", productsResult.error);
      throw new Error(`Failed to fetch products: ${productsResult.error.message}`);
    }

    if (ordersResult.error) {
      console.error("Orders fetch error:", ordersResult.error);
      throw new Error(`Failed to fetch orders: ${ordersResult.error.message}`);
    }

    const products = productsResult.data || [];
    const orders = ordersResult.data || [];
    const recentOrders = recentOrdersResult.data || [];
    const lowStockItems = lowStockResult.data || [];
    const categories = categoriesResult.data || [];

    // Calculate product statistics
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.is_active).length;
    const lowStockProducts = products.filter(
      (p) => p.is_active && p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 10)
    ).length;
    const outOfStockProducts = products.filter(
      (p) => p.is_active && p.stock_quantity === 0
    ).length;

    // Calculate order statistics
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const approvedOrders = orders.filter((o) => o.status === "approved").length;
    const completedOrders = orders.filter((o) => o.status === "completed").length;
    const rejectedOrders = orders.filter((o) => o.status === "rejected").length;

    // Calculate total revenue (from approved and completed orders only)
    const totalRevenue = orders
      .filter((o) => o.status === "approved" || o.status === "completed")
      .reduce((sum, o) => sum + (o.total_price || 0), 0);

    // Format recent orders
    const formattedRecentOrders: RecentOrder[] = recentOrders.map((order: any) => ({
      id: order.id,
      customer_first_name: order.customer_first_name,
      customer_last_name: order.customer_last_name,
      customer_email: order.customer_email,
      status: order.status,
      total_price: order.total_price,
      created_at: order.created_at,
      items_count: order.order_items?.length || 0,
    }));

    // Format low stock items
    const formattedLowStockItems: LowStockItem[] = lowStockItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      name_ar: item.name_ar,
      name_fr: item.name_fr,
      stock_quantity: item.stock_quantity,
      low_stock_threshold: item.low_stock_threshold || 10,
    }));

    // Calculate orders by month (last 6 months)
    const ordersByMonth = calculateOrdersByMonth(orders);

    // Calculate products by category
    const productsByCategory = calculateProductsByCategory(products, categories);

    return {
      success: true,
      data: {
        totalProducts,
        activeProducts,
        lowStockProducts,
        outOfStockProducts,
        totalOrders,
        pendingOrders,
        approvedOrders,
        completedOrders,
        rejectedOrders,
        totalRevenue,
        recentOrders: formattedRecentOrders,
        lowStockItems: formattedLowStockItems,
        ordersByMonth,
        productsByCategory,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ==========================================
// HELPER FUNCTIONS / الدوال المساعدة
// ==========================================

function calculateOrdersByMonth(orders: any[]): MonthlyOrderData[] {
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
  const currentDate = new Date();
  const result: MonthlyOrderData[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthName = months[date.getMonth()];

    const monthOrders = orders.filter((o) => {
      const orderDate = new Date(o.created_at);
      return (
        orderDate.getFullYear() === date.getFullYear() &&
        orderDate.getMonth() === date.getMonth()
      );
    });

    const revenue = monthOrders
      .filter((o) => o.status === "approved" || o.status === "completed")
      .reduce((sum, o) => sum + (o.total_price || 0), 0);

    result.push({
      month: monthName,
      orders: monthOrders.length,
      revenue,
    });
  }

  return result;
}

function calculateProductsByCategory(products: any[], categories: any[]): CategoryProductCount[] {
  const categoryMap = new Map<string, { name: string; count: number }>();

  // Initialize categories
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { name: cat.name_fr || cat.name, count: 0 });
  });

  // Count products per category
  products.forEach((p) => {
    if (p.is_active && p.category_id) {
      const category = categoryMap.get(p.category_id);
      if (category) {
        category.count++;
      }
    }
  });

  // Convert to array and filter out empty categories
  return Array.from(categoryMap.values())
    .filter((cat) => cat.count > 0)
    .map((cat) => ({
      category: cat.name,
      count: cat.count,
    }));
}

// ==========================================
// ADDITIONAL STATS FUNCTIONS
// ==========================================

/**
 * Get quick stats (for header badges, etc.)
 */
export async function getQuickStats(): Promise<{
  success: boolean;
  data: { pendingOrders: number; lowStockProducts: number } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const [ordersResult, productsResult] = await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .lte("stock_quantity", 10)
    ]);

    return {
      success: true,
      data: {
        pendingOrders: ordersResult.count || 0,
        lowStockProducts: productsResult.count || 0,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching quick stats:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get categories with product counts
 */
export async function getCategoriesWithCounts(): Promise<{
  success: boolean;
  data: any[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories")
      .select(`
        *,
        products (id)
      `)
      .eq("is_active", true);

    if (error) throw error;

    const categoriesWithCounts = data?.map((cat) => ({
      ...cat,
      productCount: cat.products?.length || 0,
    }));

    return { success: true, data: categoriesWithCounts, error: null };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error", 
      data: null 
    };
  }
}
