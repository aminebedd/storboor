/**
 * Order by ID API Route
 * 
 * GET /api/orders/[id] - Get a single order
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/services/order.service';
import type { ApiResponse, Order } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Order>>({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
