/**
 * Orders API Route
 * 
 * GET /api/orders - List all orders with optional filtering
 * POST /api/orders - Create a new order
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder } from '@/services/order.service';
import type { OrderFilters, CreateOrderInput, ApiResponse, Order } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters for filtering
    const filters: OrderFilters = {};
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as OrderFilters['status'];
    }
    if (searchParams.get('customerId')) {
      filters.customerId = searchParams.get('customerId')!;
    }
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!;
    }
    if (searchParams.get('dateFrom')) {
      filters.dateFrom = new Date(searchParams.get('dateFrom')!);
    }
    if (searchParams.get('dateTo')) {
      filters.dateTo = new Date(searchParams.get('dateTo')!);
    }

    const page = parseInt(searchParams.get('page') ?? '1');
    const pageSize = parseInt(searchParams.get('pageSize') ?? '10');

    const result = await getOrders(filters, page, pageSize);

    return NextResponse.json<ApiResponse<typeof result>>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderInput = await request.json();

    // Validate required fields
    if (!body.customerFirstName || !body.customerLastName || !body.customerEmail || !body.customerPhone) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Missing required customer information' },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    const result = await createOrder(body);

    if (!result.success) {
      return NextResponse.json<ApiResponse<null>>(
        { 
          success: false, 
          error: result.error,
          data: result.insufficientItems as any,
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse<Order>>(
      { success: true, data: result.order, message: 'Order created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
