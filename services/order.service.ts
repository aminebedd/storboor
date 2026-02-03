/**
 * Order Service for Supabase
 * Handles all order-related database operations
 */

import { createClient } from "@/lib/supabase/server";
import type { 
  Order, 
  OrderFilters, 
  CreateOrderInput, 
  PaginatedResponse 
} from "@/types";

// Database types
interface DbOrder {
  id: string;
  customer_id: string | null;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_company: string | null;
  customer_address: string | null;
  customer_city: string | null;
  customer_notes: string | null;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  total_price: number | null;
  created_at: string;
  updated_at: string;
  order_items?: DbOrderItem[];
}

interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price_at_order: number | null;
  created_at: string;
  products?: {
    id: string;
    name: string;
    name_fr: string;
    name_ar: string;
    price: number | null;
    stock_quantity: number;
  };
}

interface DbProduct {
  id: string;
  name: string;
  name_fr: string;
  name_ar: string;
  price: number | null;
  stock_quantity: number;
}

// Transform database order to API order
function transformOrder(db: DbOrder): Order {
  return {
    id: db.id,
    customerId: db.customer_id || "",
    customerFirstName: db.customer_first_name,
    customerLastName: db.customer_last_name,
    customerEmail: db.customer_email,
    customerPhone: db.customer_phone || "",
    customerCompany: db.customer_company || undefined,
    customerAddress: db.customer_address || undefined,
    customerCity: db.customer_city || undefined,
    customerNotes: db.customer_notes || undefined,
    status: db.status,
    totalPrice: db.total_price,
    items: (db.order_items || []).map((item) => ({
      id: item.id,
      orderId: item.order_id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      priceAtOrder: item.price_at_order,
      subtotal: item.price_at_order ? item.price_at_order * item.quantity : null,
    })),
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

/**
 * Get orders with filtering and pagination
 */
export async function getOrders(
  filters: OrderFilters = {},
  page = 1,
  pageSize = 10
): Promise<PaginatedResponse<Order>> {
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        *,
        products (id, name, name_fr, name_ar, price, stock_quantity)
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters.status && filters.status !== "pending") {
    query = query.eq("status", filters.status);
  } else if (filters.status === "pending") {
    query = query.eq("status", "pending");
  }

  if (filters.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }

  if (filters.search) {
    query = query.or(
      `customer_first_name.ilike.%${filters.search}%,customer_last_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`
    );
  }

  if (filters.dateFrom) {
    query = query.gte("created_at", filters.dateFrom.toISOString());
  }

  if (filters.dateTo) {
    query = query.lte("created_at", filters.dateTo.toISOString());
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error("Error fetching orders:", error);
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  return {
    items: (data || []).map((order) => transformOrder(order as DbOrder)),
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Get a single order by ID
 */
export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        *,
        products (id, name, name_fr, name_ar, price, stock_quantity)
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error fetching order:", error);
    return null;
  }

  return transformOrder(data as DbOrder);
}

/**
 * Create a new order
 */
export async function createOrder(input: CreateOrderInput): Promise<{
  success: boolean;
  order?: Order;
  error?: string;
  insufficientItems?: { productId: string; productName: string; available: number; requested: number }[];
}> {
  const supabase = await createClient();

  // Get products to verify stock and get prices
  const productIds = input.items.map((item) => item.productId);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, name_fr, price, stock_quantity")
    .in("id", productIds);

  if (productsError || !products) {
    return { success: false, error: "Failed to fetch products" };
  }

  // Check stock availability
  const insufficientItems: { productId: string; productName: string; available: number; requested: number }[] = [];
  
  for (const item of input.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return { success: false, error: `Product ${item.productId} not found` };
    }
    if (product.stock_quantity < item.quantity) {
      insufficientItems.push({
        productId: product.id,
        productName: product.name_fr || product.name,
        available: product.stock_quantity,
        requested: item.quantity,
      });
    }
  }

  if (insufficientItems.length > 0) {
    return {
      success: false,
      error: "Insufficient stock for some items",
      insufficientItems,
    };
  }

  // Calculate total price
  let totalPrice = 0;
  const orderItems: { product_id: string; product_name: string; quantity: number; price_at_order: number | null }[] = [];

  for (const item of input.items) {
    const product = products.find((p) => p.id === item.productId) as DbProduct;
    const price = product.price;
    totalPrice += (price || 0) * item.quantity;
    orderItems.push({
      product_id: product.id,
      product_name: product.name_fr || product.name,
      quantity: item.quantity,
      price_at_order: price,
    });
  }

  // Check if customer exists, create if not
  let customerId: string | null = null;
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("email", input.customerEmail)
    .single();

  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from("customers")
      .insert({
        first_name: input.customerFirstName,
        last_name: input.customerLastName,
        email: input.customerEmail,
        phone: input.customerPhone,
        company: input.customerCompany || null,
        address: input.customerAddress || null,
        city: input.customerCity || null,
      })
      .select("id")
      .single();

    if (!customerError && newCustomer) {
      customerId = newCustomer.id;
    }
  }

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: customerId,
      customer_first_name: input.customerFirstName,
      customer_last_name: input.customerLastName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      customer_company: input.customerCompany || null,
      customer_address: input.customerAddress || null,
      customer_city: input.customerCity || null,
      customer_notes: input.customerNotes || null,
      status: "pending",
      total_price: totalPrice,
    })
    .select()
    .single();

  if (orderError || !order) {
    console.error("Error creating order:", orderError);
    return { success: false, error: orderError?.message || "Failed to create order" };
  }

  // Create order items
  const itemsToInsert = orderItems.map((item) => ({
    order_id: order.id,
    ...item,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert);

  if (itemsError) {
    console.error("Error creating order items:", itemsError);
    // Delete the order if items failed
    await supabase.from("orders").delete().eq("id", order.id);
    return { success: false, error: "Failed to create order items" };
  }

  // Fetch the complete order
  const completeOrder = await getOrderById(order.id);

  return {
    success: true,
    order: completeOrder || undefined,
  };
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled"
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Approve order and deduct stock
 */
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

  // Get current stock for all products
  const productIds = order.items.map((item) => item.productId);
  const { data: products } = await supabase
    .from("products")
    .select("id, stock_quantity")
    .in("id", productIds);

  if (!products) {
    return { success: false, error: "Failed to fetch products" };
  }

  // Check stock availability
  for (const item of order.items) {
    const product = products.find((p) => p.id === item.productId);
    if (product && item.quantity > product.stock_quantity) {
      return {
        success: false,
        error: `Insufficient stock for ${item.productName}`,
      };
    }
  }

  // Deduct stock for each item
  for (const item of order.items) {
    const product = products.find((p) => p.id === item.productId);
    if (product) {
      const newStock = product.stock_quantity - item.quantity;

      await supabase
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", item.productId);

      await supabase.from("stock_history").insert({
        product_id: item.productId,
        change_type: "order_approved",
        quantity_change: -item.quantity,
        previous_quantity: product.stock_quantity,
        new_quantity: newStock,
        order_id: orderId,
        notes: `Order ${orderId} approved`,
      });
    }
  }

  // Update order status
  return updateOrderStatus(orderId, "approved");
}

/**
 * Reject order
 */
export async function rejectOrder(
  orderId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({
      status: "rejected",
      customer_notes: reason || "Order rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
