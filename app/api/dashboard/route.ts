/**
 * Dashboard API Route
 * 
 * GET /api/dashboard - Get dashboard statistics and data
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDashboardStats,
  getOrdersByMonth,
  getProductsByCategory,
  getLowStockAlerts,
} from '@/services/dashboard.service';
import { getRecentOrders } from '@/services/order.service';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const [stats, ordersByMonth, productsByCategory, lowStockAlerts, recentOrders] = await Promise.all([
      getDashboardStats(),
      getOrdersByMonth(),
      getProductsByCategory(),
      getLowStockAlerts(),
      getRecentOrders(5),
    ]);

    return NextResponse.json<ApiResponse<{
      stats: typeof stats;
      ordersByMonth: typeof ordersByMonth;
      productsByCategory: typeof productsByCategory;
      lowStockAlerts: typeof lowStockAlerts;
      recentOrders: typeof recentOrders;
    }>>({
      success: true,
      data: {
        stats,
        ordersByMonth,
        productsByCategory,
        lowStockAlerts,
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
