"use server";

/**
 * Server Actions for Order Management
 * 
 * IMPORTANT BUSINESS LOGIC:
 * - When a customer creates an order: status = 'pending', stock is NOT reduced
 * - When admin APPROVES an order: stock is reduced for each item
 * - When admin REJECTS an order: stock remains unchanged
 * - Orders cannot be created if requested quantity > available stock
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { OrderInsert, OrderItemInsert } from "@/types/database";

// ==========================================
// GET ALL ORDERS
// ==========================================

export async function getOrders(options?: {
  status?: string;
  search?: string;
  limit?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (
          id,
          name,
          name_ar,
          name_fr,
          images,
          stock_quantity
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options?.search) {
    query = query.or(
      `customer_first_name.ilike.%${options.search}%,customer_last_name.ilike.%${options.search}%,customer_email.ilike.%${options.search}%`
    );
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching orders:", error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data, error: null };
}

// ==========================================
// GET SINGLE ORDER
// ==========================================

export async function getOrder(id: string) {
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
    console.error("Error fetching order:", error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data, error: null };
}

// ==========================================
// CREATE ORDER
// 
// Business Logic:
// 1. Validate that all products have sufficient stock
// 2. Create order with status = 'pending'
// 3. Create order items
// 4. Stock is NOT reduced at this point (only on approval)
// ==========================================

export async function createOrder(
  orderData: Omit<OrderInsert, "id" | "created_at" | "updated_at">,
  items: { productId: string; quantity: number }[]
) {
  const supabase = await createClient();

  // Step 1: Validate stock availability for all items
  for (const item of items) {
    const { data: product, error } = await supabase
      .from("products")
      .select("id, name, name_ar, name_fr, stock_quantity, price, is_active")
      .eq("id", item.productId)
      .single();

    if (error || !product) {
      return { 
        success: false, 
        error: `Product not found: ${item.productId}`, 
        data: null 
      };
    }

    if (!product.is_active) {
      return { 
        success: false, 
        error: `Product is not available: ${product.name}`, 
        data: null 
      };
    }

    // Check stock availability
    if (product.stock_quantity < item.quantity) {
      return { 
        success: false, 
        error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`, 
        data: null 
      };
    }
  }

  // Step 2: Calculate total price
  let totalPrice = 0;
  const orderItems: Omit<OrderItemInsert, "order_id">[] = [];

  for (const item of items) {
    const { data: product } = await supabase
      .from("products")
      .select("name, price")
      .eq("id", item.productId)
      .single();

    if (product) {
      const itemPrice = product.price || 0;
      totalPrice += itemPrice * item.quantity;
      
      orderItems.push({
        product_id: item.productId,
        product_name: product.name,
        quantity: item.quantity,
        price_at_order: product.price,
      });
    }
  }

  // Step 3: Create the order with status = 'pending'
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      ...orderData,
      status: "pending", // Always start as pending
      total_price: totalPrice > 0 ? totalPrice : null,
    })
    .select()
    .single();

  if (orderError || !order) {
    console.error("Error creating order:", orderError);
    return { success: false, error: orderError?.message || "Failed to create order", data: null };
  }

  // Step 4: Create order items
  const orderItemsWithOrderId = orderItems.map((item) => ({
    ...item,
    order_id: order.id,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsWithOrderId);

  if (itemsError) {
    console.error("Error creating order items:", itemsError);
    // Rollback: delete the order
    await supabase.from("orders").delete().eq("id", order.id);
    return { success: false, error: itemsError.message, data: null };
  }

  revalidatePath("/admin/orders");

  return { success: true, data: order, error: null };
}

// ==========================================
// APPROVE ORDER
// 
// Business Logic:
// 1. Verify order exists and is pending
// 2. Re-validate stock availability
// 3. Reduce stock for each item
// 4. Record stock history
// 5. Update order status to 'approved'
// ==========================================

export async function approveOrder(orderId: string) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized", data: null };
  }

  // Step 1: Get order with items
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (id, stock_quantity, name)
      )
    `)
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: "Order not found", data: null };
  }

  if (order.status !== "pending") {
    return { success: false, error: `Order is already ${order.status}`, data: null };
  }

  // Step 2: Validate stock availability
  for (const item of order.order_items) {
    const product = item.products;
    if (product.stock_quantity < item.quantity) {
      return { 
        success: false, 
        error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Required: ${item.quantity}`, 
        data: null 
      };
    }
  }

  // Step 3: Reduce stock for each item and record history
  for (const item of order.order_items) {
    const product = item.products;
    const newQuantity = product.stock_quantity - item.quantity;

    // Update product stock
    const { error: stockError } = await supabase
      .from("products")
      .update({ 
        stock_quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq("id", product.id);

    if (stockError) {
      console.error("Error updating stock:", stockError);
      return { success: false, error: `Failed to update stock for ${product.name}`, data: null };
    }

    // Record stock history
    await supabase.from("stock_history").insert({
      product_id: product.id,
      change_type: "order_approved",
      quantity_change: -item.quantity,
      previous_quantity: product.stock_quantity,
      new_quantity: newQuantity,
      order_id: orderId,
      notes: `Stock reduced for approved order #${orderId.slice(0, 8)}`,
      created_by: user.id,
    });
  }

  // Step 4: Update order status
  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({ 
      status: "approved",
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating order status:", updateError);
    return { success: false, error: updateError.message, data: null };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/products");
  revalidatePath("/admin");

  return { success: true, data: updatedOrder, error: null };
}

// ==========================================
// REJECT ORDER
// 
// Business Logic:
// 1. Verify order exists and is pending
// 2. Update order status to 'rejected'
// 3. Stock is NOT modified
// ==========================================

export async function rejectOrder(orderId: string, reason?: string) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized", data: null };
  }

  // Get order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: "Order not found", data: null };
  }

  if (order.status !== "pending") {
    return { success: false, error: `Order is already ${order.status}`, data: null };
  }

  // Update order status to rejected
  // Note: Stock is NOT modified when rejecting
  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({ 
      status: "rejected",
      customer_notes: reason ? `Rejection reason: ${reason}` : undefined,
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId)
    .select()
    .single();

  if (updateError) {
    console.error("Error rejecting order:", updateError);
    return { success: false, error: updateError.message, data: null };
  }

  revalidatePath("/admin/orders");

  return { success: true, data: updatedOrder, error: null };
}

// ==========================================
// COMPLETE ORDER
// ==========================================

export async function completeOrder(orderId: string) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized", data: null };
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ 
      status: "completed",
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId)
    .eq("status", "approved") // Can only complete approved orders
    .select()
    .single();

  if (error) {
    console.error("Error completing order:", error);
    return { success: false, error: error.message, data: null };
  }

  revalidatePath("/admin/orders");

  return { success: true, data, error: null };
}

// ==========================================
// CANCEL ORDER
// 
// Business Logic:
// - If order was approved, restore stock
// - If order was pending, just cancel it
// ==========================================

export async function cancelOrder(orderId: string) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized", data: null };
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
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: "Order not found", data: null };
  }

  if (order.status === "cancelled") {
    return { success: false, error: "Order is already cancelled", data: null };
  }

  // If order was approved, restore stock
  if (order.status === "approved") {
    for (const item of order.order_items) {
      const product = item.products;
      const newQuantity = product.stock_quantity + item.quantity;

      // Restore product stock
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
        change_type: "order_cancelled",
        quantity_change: item.quantity,
        previous_quantity: product.stock_quantity,
        new_quantity: newQuantity,
        order_id: orderId,
        notes: `Stock restored for cancelled order #${orderId.slice(0, 8)}`,
        created_by: user.id,
      });
    }
  }

  // Update order status
  const { data, error } = await supabase
    .from("orders")
    .update({ 
      status: "cancelled",
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId)
    .select()
    .single();

  if (error) {
    console.error("Error cancelling order:", error);
    return { success: false, error: error.message, data: null };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/products");

  return { success: true, data, error: null };
}
