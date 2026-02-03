/**
 * Reject Order API Route
 * 
 * PATCH /api/orders/[id]/reject - Reject an order
 * 
 * Business Logic:
 * - Only pending orders can be rejected
 * - Stock is NOT affected (was never reserved)
 */

import { NextRequest, NextResponse } from 'next/server';
import { rejectOrder } from '@/services/order.service';
import type { ApiResponse, Order } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    
    const result = await rejectOrder(id, body.reason);

    if (!result.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse<Order>>({
      success: true,
      data: result.order,
      message: 'Order rejected.',
    });
  } catch (error) {
    console.error('Error rejecting order:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Failed to reject order' },
      { status: 500 }
    );
  }
}
