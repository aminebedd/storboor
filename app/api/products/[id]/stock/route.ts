/**
 * Product Stock API Route
 * 
 * PATCH /api/products/[id]/stock - Update product stock quantity
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateProductStock } from '@/services/product.service';
import type { ApiResponse, Product } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (typeof body.quantity !== 'number' || body.quantity < 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid quantity. Must be a non-negative number.' },
        { status: 400 }
      );
    }

    const product = await updateProductStock(id, body.quantity);

    if (!product) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      data: product,
      message: 'Stock updated successfully',
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Failed to update stock' },
      { status: 500 }
    );
  }
}
