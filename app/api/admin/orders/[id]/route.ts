import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/orders/[id]
 * Get single order details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

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
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/orders/[id]
 * Update order status (approve, reject, complete, cancel)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (id, stock_quantity, name)
        )
      `)
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Handle different actions
    switch (action) {
      case "approve":
        return handleApprove(supabase, order, user.id);
      case "reject":
        return handleReject(supabase, order, reason);
      case "complete":
        return handleComplete(supabase, order);
      case "cancel":
        return handleCancel(supabase, order, user.id);
      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function handleApprove(supabase: any, order: any, userId: string) {
  if (order.status !== "pending") {
    return NextResponse.json(
      { success: false, error: `Order is already ${order.status}` },
      { status: 400 }
    );
  }

  // Validate stock availability
  for (const item of order.order_items) {
    const product = item.products;
    if (product.stock_quantity < item.quantity) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Required: ${item.quantity}` 
        },
        { status: 400 }
      );
    }
  }

  // Reduce stock for each item
  for (const item of order.order_items) {
    const product = item.products;
    const newQuantity = product.stock_quantity - item.quantity;

    await supabase
      .from("products")
      .update({ 
        stock_quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq("id", product.id);

    // Record stock history
    await supabase.from("stock_history").insert({
      product_id: product.id,
      change_type: "order_approved",
      quantity_change: -item.quantity,
      previous_quantity: product.stock_quantity,
      new_quantity: newQuantity,
      order_id: order.id,
      notes: `Stock reduced for approved order #${order.id.slice(0, 8)}`,
      created_by: userId,
    });
  }

  // Update order status
  const { data, error } = await supabase
    .from("orders")
    .update({ 
      status: "approved",
      updated_at: new Date().toISOString()
    })
    .eq("id", order.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

async function handleReject(supabase: any, order: any, reason?: string) {
  if (order.status !== "pending") {
    return NextResponse.json(
      { success: false, error: `Order is already ${order.status}` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ 
      status: "rejected",
      customer_notes: reason ? `Rejection reason: ${reason}` : undefined,
      updated_at: new Date().toISOString()
    })
    .eq("id", order.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

async function handleComplete(supabase: any, order: any) {
  if (order.status !== "approved") {
    return NextResponse.json(
      { success: false, error: "Only approved orders can be completed" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ 
      status: "completed",
      updated_at: new Date().toISOString()
    })
    .eq("id", order.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

async function handleCancel(supabase: any, order: any, userId: string) {
  if (order.status === "cancelled") {
    return NextResponse.json(
      { success: false, error: "Order is already cancelled" },
      { status: 400 }
    );
  }

  // If order was approved, restore stock
  if (order.status === "approved") {
    for (const item of order.order_items) {
      const product = item.products;
      const newQuantity = product.stock_quantity + item.quantity;

      await supabase
        .from("products")
        .update({ 
          stock_quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq("id", product.id);

      await supabase.from("stock_history").insert({
        product_id: product.id,
        change_type: "order_cancelled",
        quantity_change: item.quantity,
        previous_quantity: product.stock_quantity,
        new_quantity: newQuantity,
        order_id: order.id,
        notes: `Stock restored for cancelled order #${order.id.slice(0, 8)}`,
        created_by: userId,
      });
    }
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ 
      status: "cancelled",
      updated_at: new Date().toISOString()
    })
    .eq("id", order.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}
