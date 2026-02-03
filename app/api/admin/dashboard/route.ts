"use server";

/**
 * Dashboard API Route
 * Provides dashboard statistics via REST API
 * 
 * This route is protected and requires authentication
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

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
      return NextResponse.json(
        { success: false, error: `Failed to fetch products: ${productsResult.error.message}` },
        { status: 500 }
      );
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

    // Calculate total revenue
    const totalRevenue = orders
      .filter((o) => o.status === "approved" || o.status === "completed")
      .reduce((sum, o) => sum + (o.total_price || 0), 0);

    // Format recent orders
    const formattedRecentOrders = recentOrders.map((order: any) => ({
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
    const formattedLowStockItems = lowStockItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      name_ar: item.name_ar,
      name_fr: item.name_fr,
      stock_quantity: item.stock_quantity,
      low_stock_threshold: item.low_stock_threshold || 10,
    }));

    // Calculate orders by month (last 6 months)
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    const currentDate = new Date();
    const ordersByMonth = [];

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

      ordersByMonth.push({
        month: monthName,
        orders: monthOrders.length,
        revenue,
      });
    }

    // Calculate products by category
    const categoryMap = new Map<string, { name: string; count: number }>();
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { name: cat.name_fr || cat.name, count: 0 });
    });
    products.forEach((p) => {
      if (p.is_active && p.category_id) {
        const category = categoryMap.get(p.category_id);
        if (category) {
          category.count++;
        }
      }
    });
    const productsByCategory = Array.from(categoryMap.values())
      .filter((cat) => cat.count > 0)
      .map((cat) => ({
        category: cat.name,
        count: cat.count,
      }));

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
