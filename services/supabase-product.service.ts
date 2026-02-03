import { createClient } from "@/lib/supabase/server";
import type { Product, Category, ApiResponse, PaginatedResponse } from "@/types";

/* ===============================
   Database Types (MATCH SQL)
================================ */

interface DbCategory {
  id: string;
  name_fr: string;
  name_ar: string;
  slug: string;
  description: string | null;
  image: string | null;
  is_active: boolean;
}



export interface UpdateProductInput {
  nameFr?: string;
  nameAr?: string;
  descriptionFr?: string;
  descriptionAr?: string;
  categoryId?: string;
  price?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  material?: string;
  dimensions?: string;
  insulation?: string;
  colors?: string[];
  images?: string[];
}


interface DbProduct {
  id: string;
  name_fr: string;
  name_ar: string;
  description_fr: string | null;
  description_ar: string | null;
  category_id: string;
  price: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  material: string | null;
  specifications: {
    dimensions?: string;
    insulation?: string;
    colors?: string[];
  } | null;
  images: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories: DbCategory;
}

/* ===============================
   Helpers
================================ */

function transformProduct(
  db: DbProduct,
  locale: "fr" | "ar" = "fr"
): Product {
  return {
    id: db.id,
    name: locale === "ar" ? db.name_ar : db.name_fr,
    nameFr: db.name_fr,
    nameAr: db.name_ar,

    description:
      locale === "ar"
        ? db.description_ar || ""
        : db.description_fr || "",
    descriptionFr: db.description_fr || "",
    descriptionAr: db.description_ar || "",

    categoryId: db.category_id,

    material: db.material || "",
    price: db.price,
    stockQuantity: db.stock_quantity,
    lowStockThreshold: db.low_stock_threshold,

    specifications: {
      dimensions: db.specifications?.dimensions,
      insulation: db.specifications?.insulation,
      colors: db.specifications?.colors ?? [],
    },

    images: db.images ?? ["/images/products/default.jpg"],

    isActive: db.is_active,
    isFeatured: false, // ← أو من DB لو موجود

    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}


/* ===============================
   Get Products (with filters)
================================ */

export async function getProducts(options?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  locale?: "fr" | "ar";
}): Promise<PaginatedResponse<Product>> {
  const supabase = await createClient();

  const {
    category,
    search,
    page = 1,
    limit = 12,
    locale = "fr",
  } = options || {};

  let query = supabase
    .from("products")
    .select("*, categories(*)", { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .single();

    if (cat) query = query.eq("category_id", cat.id);
  }

  if (search) {
    query = query.or(
      `name_fr.ilike.%${search}%,name_ar.ilike.%${search}%`
    );
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error(error);
    return {
      items: [],
      total: 0,
      page,
      pageSize: limit,
      totalPages: 0,
    };
  }

  return {
    items: (data || []).map((p) =>
      transformProduct(p as DbProduct, locale)
    ),
    total: count || 0,
    page,
    pageSize: limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/* ===============================
   Get Single Product
================================ */

export async function getProductById(
  id: string,
  locale: "fr" | "ar" = "fr"
): Promise<ApiResponse<Product>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*, categories(*)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return { success: false, error: "Product not found" };
  }
  
  return {
    success: true,
    data: transformProduct(data as DbProduct, locale),
  };
}

/* ===============================
   Create Product
================================ */

export async function createProduct(input: {
  nameFr: string;
  nameAr: string;
  descriptionFr?: string;
  descriptionAr?: string;
  categoryId: string;
  price?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  material?: string;
  dimensions?: string;
  insulation?: string;
  colors?: string[];
  images?: string[];
}): Promise<ApiResponse<Product>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .insert({
      name_fr: input.nameFr,
      name_ar: input.nameAr,
      description_fr: input.descriptionFr,
      description_ar: input.descriptionAr,
      category_id: input.categoryId,
      price: input.price,
      stock_quantity: input.stockQuantity ?? 0,
      low_stock_threshold: input.lowStockThreshold ?? 10,
      material: input.material,
      specifications: {
        dimensions: input.dimensions,
        insulation: input.insulation,
        colors: input.colors,
      },
      images: input.images,
      is_active: true,
    })
    .select("*, categories(*)")
    .single();

  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: transformProduct(data as DbProduct),
  };
}

/* ===============================
   Update Stock
================================ */

export async function updateStock(
  productId: string,
  quantity: number,
  type: "add" | "remove" | "adjust"
): Promise<void> {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("products")
    .select("stock_quantity")
    .eq("id", productId)
    .single();

  if (!current) return;

  const newQty =
    type === "add"
      ? current.stock_quantity + quantity
      : type === "remove"
      ? Math.max(0, current.stock_quantity - quantity)
      : quantity;

  await supabase.from("products").update({
    stock_quantity: newQty,
  }).eq("id", productId);

  await supabase.from("stock_history").insert({
    product_id: productId,
    change_type: type,
    quantity_change: newQty - current.stock_quantity,
    previous_quantity: current.stock_quantity,
    new_quantity: newQty,
    notes: "Stock update",
  });
}



export async function updateProduct(input: Partial<UpdateProductInput> & { id: string }): Promise<Product | null> {
  const supabase = await createClient();
  const { id, ...rest } = input;

  const { data, error } = await supabase
    .from('products')
    .update({
      ...rest,
      updated_at: new Date().toISOString() // تحديث تاريخ آخر تعديل
    })
    .eq('id', id)
    .select('*, categories(*)')
    .single();

  if (error || !data) {
    console.error('Error updating product:', error);
    return null;
  }

  return transformProduct(data as DbProduct);
}


export async function deactivateProduct(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error || !data) {
    console.error('Error deactivating product:', error);
    return false;
  }

  return true;
}
