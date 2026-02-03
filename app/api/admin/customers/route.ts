import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/customers
 * Fetches all customers with order statistics from Supabase
 */
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

    // Fetch customers
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (customersError) {
      return NextResponse.json(
        { success: false, error: customersError.message },
        { status: 500 }
      );
    }

    // Fetch orders to calculate stats per customer
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("customer_id, customer_email, total_price, created_at, status");

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
    }

    // Calculate stats for each customer
    const customersWithStats = (customers || []).map((customer) => {
      const customerOrders = (orders || []).filter(
        (o) => o.customer_id === customer.id || o.customer_email === customer.email
      );

      const completedOrders = customerOrders.filter(
        (o) => o.status === "completed" || o.status === "approved"
      );

      const totalSpent = completedOrders.reduce(
        (sum, o) => sum + (o.total_price || 0),
        0
      );

      const lastOrder = customerOrders.length > 0
        ? customerOrders.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]?.created_at
        : null;

      return {
        ...customer,
        order_count: customerOrders.length,
        total_spent: totalSpent,
        last_order_date: lastOrder,
      };
    });

    return NextResponse.json({
      success: true,
      data: customersWithStats,
    });
  } catch (error) {
    console.error("Customers API error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
