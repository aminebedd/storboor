/**
 * Product by ID API Route
 * 
 * GET /api/products/[id] - Get a single product
 * PATCH /api/products/[id] - Update a product
 * DELETE /api/products/[id] - Deactivate a product (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getProductById,
  updateProduct,
  deactivateProduct,
} from '@/services/supabase-product.service';
import type { UpdateProductInput, ApiResponse, ProductWithCategory } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<ProductWithCategory>>({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: Partial<UpdateProductInput> = await request.json();

    const product = await updateProduct({ ...body, id });

    if (!product) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<typeof product>>({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deactivateProduct(id);

    if (!success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: 'Product deactivated successfully',
    });
  } catch (error) {
    console.error('Error deactivating product:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Failed to deactivate product' },
      { status: 500 }
    );
  }
}
