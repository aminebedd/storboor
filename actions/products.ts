"use server";

/**
 * Server Actions for Product Management
 * These actions handle all product-related operations with Supabase
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProductInsert, ProductUpdate } from "@/types/database";

// ==========================================
// GET PRODUCTS
// ==========================================

export async function getProducts(options?: {
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(`
      *,
      categories (
        id,
        name,
        name_ar,
        name_fr,
        slug
      )
    `)
    .order("created_at", { ascending: false });

  // Apply filters
  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }
  if (options?.search) {
    query = query.or(
      `name.ilike.%${options.search}%,name_ar.ilike.%${options.search}%,name_fr.ilike.%${options.search}%`
    );
  }
  if (options?.isActive !== undefined) {
    query = query.eq("is_active", options.isActive);
  }
  if (options?.isFeatured !== undefined) {
    query = query.eq("is_featured", options.isFeatured);
  }
  if (options?.inStock) {
    query = query.gt("stock_quantity", 0);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data, error: null };
}

// ==========================================
// GET SINGLE PRODUCT
// ==========================================

export async function getProduct(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (
        id,
        name,
        name_ar,
        name_fr,
        slug
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching product:", error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data, error: null };
}

// ==========================================
// CREATE PRODUCT
// ==========================================

export async function createProduct(product: ProductInsert) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized", data: null };
  }

  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  if (error) {
    console.error("Error creating product:", error);
    return { success: false, error: error.message, data: null };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");

  return { success: true, data, error: null };
}

// ==========================================
// UPDATE PRODUCT
// ==========================================

export async function updateProduct(id: string, updates: ProductUpdate) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized", data: null };
  }

  const { data, error } = await supabase
    .from("products")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating product:", error);
    return { success: false, error: error.message, data: null };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);

  return { success: true, data, error: null };
}

// ==========================================
// UPDATE PRODUCT STOCK
// Important: This is used for manual stock adjustments only.
// For order-related stock changes, use the order actions.
// ==========================================

export async function updateProductStock(
  productId: string,
  newQuantity: number,
  notes?: string
) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized", data: null };
  }

  // Get current product stock
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("stock_quantity")
    .eq("id", productId)
    .single();

  if (fetchError || !product) {
    return { success: false, error: "Product not found", data: null };
  }

  const previousQuantity = product.stock_quantity;
  const quantityChange = newQuantity - previousQuantity;

  // Update product stock
  const { error: updateError } = await supabase
    .from("products")
    .update({ 
      stock_quantity: newQuantity,
      updated_at: new Date().toISOString()
    })
    .eq("id", productId);

  if (updateError) {
    console.error("Error updating stock:", updateError);
    return { success: false, error: updateError.message, data: null };
  }

  // Record stock history
  await supabase.from("stock_history").insert({
    product_id: productId,
    change_type: "adjust",
    quantity_change: quantityChange,
    previous_quantity: previousQuantity,
    new_quantity: newQuantity,
    notes: notes || "Manual stock adjustment",
    created_by: user.id,
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");

  return { success: true, data: { newQuantity }, error: null };
}

// ==========================================
// DELETE PRODUCT (Soft delete - set inactive)
// ==========================================

export async function deleteProduct(id: string) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized", data: null };
  }

  // Soft delete - just mark as inactive
  const { error } = await supabase
    .from("products")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");

  return { success: true, error: null };
}

// ==========================================
// GET LOW STOCK PRODUCTS
// ==========================================

export async function getLowStockProducts() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .filter("stock_quantity", "lte", supabase.rpc("get_low_stock_threshold"))
    .order("stock_quantity", { ascending: true });

  // Fallback query if RPC doesn't exist
  const { data: fallbackData, error: fallbackError } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .lte("stock_quantity", 10)
    .order("stock_quantity", { ascending: true });

  if (error && fallbackError) {
    console.error("Error fetching low stock products:", error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data: data || fallbackData, error: null };
}
