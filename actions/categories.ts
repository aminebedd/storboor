"use server";

/**
 * Server Actions for Category Management
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data, error: null };
}

export async function getCategory(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching category:", error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data, error: null };
}

export async function createCategory(category: {
  name: string;
  name_ar: string;
  name_fr: string;
  slug: string;
  description?: string;
  image?: string;
}) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized", data: null };
  }

  const { data, error } = await supabase
    .from("categories")
    .insert(category)
    .select()
    .single();

  if (error) {
    console.error("Error creating category:", error);
    return { success: false, error: error.message, data: null };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/products");

  return { success: true, data, error: null };
}

export async function updateCategory(
  id: string,
  updates: {
    name?: string;
    name_ar?: string;
    name_fr?: string;
    slug?: string;
    description?: string;
    image?: string;
    is_active?: boolean;
  }
) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized", data: null };
  }

  const { data, error } = await supabase
    .from("categories")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating category:", error);
    return { success: false, error: error.message, data: null };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/products");

  return { success: true, data, error: null };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized", data: null };
  }

  // Soft delete
  const { error } = await supabase
    .from("categories")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/products");

  return { success: true, error: null };
}
