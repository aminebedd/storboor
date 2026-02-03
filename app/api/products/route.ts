/**
 * Products API Route (Supabase)
 * 
 * GET /api/products - List all products with optional filtering
 * POST /api/products - Create a new product (requires auth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Build query
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name_fr, name_ar, slug)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    // Apply filters
    const categorySlug = searchParams.get('category');
    if (categorySlug && categorySlug !== 'all') {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();
      
      if (categoryData) {
        query = query.eq('category_id', categoryData.id);
      }
    }
    
    const search = searchParams.get('search');
    if (search) {
      query = query.or(`name_fr.ilike.%${search}%,name_ar.ilike.%${search}%,description_fr.ilike.%${search}%,description_ar.ilike.%${search}%`);
    }
    
    const inStock = searchParams.get('inStock');
    if (inStock === 'true') {
      query = query.gt('stock_quantity', 0);
    }

    const { data: products, error } = await query;

    if (error) throw error;

    return NextResponse.json<ApiResponse<typeof products>>({
      success: true,
      data: products || [],
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Failed to fetch products' },
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
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name_fr || !body.name_ar || !body.category_id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name_fr: body.name_fr,
        name_ar: body.name_ar,
        description_fr: body.description_fr || null,
        description_ar: body.description_ar || null,
        category_id: body.category_id,
        price: body.price || null,
        stock_quantity: body.stock_quantity || 0,
        low_stock_threshold: body.low_stock_threshold || 10,
        material: body.material || null,
        dimensions: body.dimensions || null,
        insulation: body.insulation || null,
        colors: body.colors || [],
        images: body.images || [],
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json<ApiResponse<typeof product>>(
      { success: true, data: product, message: 'Product created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
