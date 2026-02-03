/**
 * Approve Order API Route
 * 
 * PATCH /api/orders/[id]/approve - Approve an order and reduce inventory
 * 
 * Business Logic:
 * - Only pending orders can be approved
 * - Stock is reduced when order is approved
 * - If insufficient stock, approval fails
 */

import { NextRequest, NextResponse } from 'next/server';
import { approveOrder } from '@/services/order.service';
import type { ApiResponse, Order } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await approveOrder(id);

    if (!result.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse<Order>>({
      success: true,
      data: result.order,
      message: 'Order approved successfully. Inventory has been updated.',
    });
  } catch (error) {
    console.error('Error approving order:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Failed to approve order' },
      { status: 500 }
    );
  }
}
