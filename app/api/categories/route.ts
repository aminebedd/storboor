/**
 * Categories API Route (Supabase)
 * All data comes from the database
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const includeCount = searchParams.get("includeCount") === "true";
    const includeInactive = searchParams.get("includeInactive") === "true";

    let query = supabase.from("categories").select("*");

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    query = query.order("name_fr");

    const { data: categories, error } = await query;

    if (error) throw error;

    // If includeCount is true, count products for each category
    if (includeCount && categories) {
      const { data: products } = await supabase
        .from("products")
        .select("category_id")
        .eq("is_active", true);

      const categoriesWithCount = categories.map((cat) => ({
        ...cat,
        product_count: (products || []).filter((p) => p.category_id === cat.id).length,
      }));

      return NextResponse.json(categoriesWithCount);
    }

    return NextResponse.json(categories || []);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.name || !body.name_fr || !body.name_ar || !body.slug) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: category, error } = await supabase
      .from("categories")
      .insert({
        name: body.name,
        name_fr: body.name_fr,
        name_ar: body.name_ar,
        slug: body.slug,
        description: body.description || null,
        image: body.image || null,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, data: category },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create category" },
      { status: 500 }
    );
  }
}
