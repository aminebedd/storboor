"use client";

/**
 * Admin Dashboard Page
 * لوحة تحكم المدير
 * 
 * Displays real-time statistics from Supabase database
 * Uses fetch API for client-side data fetching
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ORDER_STATUS_COLORS } from "@/lib/constants";
import {
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  XCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useTranslation } from "@/lib/i18n";

// ==========================================
// TYPES
// ==========================================

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  completedOrders: number;
  rejectedOrders: number;
  totalRevenue: number;
  recentOrders: RecentOrder[];
  lowStockItems: LowStockItem[];
  ordersByMonth: MonthlyOrderData[];
  productsByCategory: CategoryProductCount[];
}

interface RecentOrder {
  id: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  status: string;
  total_price: number | null;
  created_at: string;
  items_count: number;
}

interface LowStockItem {
  id: string;
  name: string;
  name_ar: string;
  name_fr: string;
  stock_quantity: number;
  low_stock_threshold: number;
}

interface MonthlyOrderData {
  month: string;
  orders: number;
  revenue: number;
}

interface CategoryProductCount {
  category: string;
  count: number;
}

// ==========================================
// CONSTANTS
// ==========================================

const CHART_COLORS = [
  "hsl(210, 80%, 50%)",
  "hsl(180, 60%, 45%)",
  "hsl(45, 90%, 50%)",
  "hsl(15, 80%, 55%)",
];

// ==========================================
// FETCHER FUNCTION
// ==========================================

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch data");
  }
  return res.json();
};

// ==========================================
// LOADING SKELETON COMPONENT
// ==========================================

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==========================================
// ERROR STATE COMPONENT
// ==========================================

function DashboardError({ error, onRetry }: { error: string; onRetry: () => void }) {
  const { t, locale } = useTranslation();
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {locale === "ar" ? "لوحة التحكم" : "Tableau de bord"}
        </h1>
      </div>
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <XCircle className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="font-semibold text-lg">
                {locale === "ar" ? "خطأ في التحميل" : "Erreur de chargement"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                {error}
              </p>
            </div>
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              {locale === "ar" ? "إعادة المحاولة" : "Réessayer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==========================================
// EMPTY STATE COMPONENT
// ==========================================

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-center text-muted-foreground py-8 text-sm">
      {message}
    </p>
  );
}

// ==========================================
// MAIN DASHBOARD COMPONENT
// ==========================================

export default function AdminDashboardPage() {
  const { t, locale } = useTranslation();
  
  // Use SWR for data fetching with caching
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: DashboardStats }>(
    "/api/admin/dashboard",
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // Refresh every minute
      dedupingInterval: 30000,
    }
  );

  const stats = data?.data;

  // Format price with currency
  const formatPrice = useCallback((price: number | null) => {
    if (price === null || price === 0) {
      return locale === "ar" ? "طلب عرض سعر" : "Sur devis";
    }
    return `${price.toLocaleString(locale === "ar" ? "ar-DZ" : "fr-FR")} ${locale === "ar" ? "د.ج" : "DA"}`;
  }, [locale]);

  // Format date
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      locale === "ar" ? "ar-DZ" : "fr-FR",
      { day: "numeric", month: "short", year: "numeric" }
    );
  }, [locale]);

  // Get status translation
  const getStatusLabel = useCallback((status: string) => {
    const statusMap: Record<string, string> = {
      pending: locale === "ar" ? "قيد الانتظار" : "En attente",
      approved: locale === "ar" ? "موافق عليه" : "Approuvée",
      rejected: locale === "ar" ? "مرفوض" : "Refusée",
      completed: locale === "ar" ? "مكتمل" : "Terminée",
      cancelled: locale === "ar" ? "ملغي" : "Annulée",
    };
    return statusMap[status] || status;
  }, [locale]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    mutate();
  }, [mutate]);

  // Loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (error) {
    return <DashboardError error={error.message} onRetry={handleRefresh} />;
  }

  // No data state
  if (!stats) {
    return <DashboardError error="No data available" onRetry={handleRefresh} />;
  }

  // Stat cards configuration
  const statCards = [
    {
      title: locale === "ar" ? "إجمالي الطلبات" : "Total Commandes",
      value: stats.totalOrders,
      icon: ShoppingCart,
      description: locale === "ar" ? "جميع الطلبات" : "Toutes les commandes",
      color: "text-muted-foreground",
      highlight: false,
    },
    {
      title: locale === "ar" ? "طلبات معلقة" : "En Attente",
      value: stats.pendingOrders,
      icon: Clock,
      description: locale === "ar" ? "تحتاج معالجة" : "À traiter",
      highlight: stats.pendingOrders > 0,
      color: stats.pendingOrders > 0 ? "text-yellow-600" : "text-muted-foreground",
    },
    {
      title: locale === "ar" ? "طلبات مكتملة" : "Terminées",
      value: stats.approvedOrders + stats.completedOrders,
      icon: CheckCircle,
      description: locale === "ar" ? "تمت الموافقة والإكمال" : "Approuvées et terminées",
      color: "text-green-600",
      highlight: false,
    },
    {
      title: locale === "ar" ? "المنتجات النشطة" : "Produits Actifs",
      value: stats.activeProducts,
      icon: Package,
      description: locale === "ar" ? "في الكتالوج" : "Dans le catalogue",
      color: "text-muted-foreground",
      highlight: false,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">
            {locale === "ar" ? "لوحة التحكم" : "Tableau de bord"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar" 
              ? "نظرة عامة على أعمالك" 
              : "Vue d'ensemble de votre activité"}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
          {locale === "ar" ? "تحديث" : "Actualiser"}
        </Button>
      </div>

      {/* Stock Alert */}
      {(stats.lowStockProducts > 0 || stats.outOfStockProducts > 0) && (
        <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                    {locale === "ar" ? "تنبيه المخزون" : "Alerte Stock"}
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    {stats.outOfStockProducts > 0 && (
                      <span className="font-medium">
                        {stats.outOfStockProducts} {locale === "ar" ? "منتج غير متوفر" : "produit(s) en rupture"}
                      </span>
                    )}
                    {stats.outOfStockProducts > 0 && stats.lowStockProducts > 0 && " | "}
                    {stats.lowStockProducts > 0 && (
                      <span>
                        {stats.lowStockProducts} {locale === "ar" ? "منتج بمخزون منخفض" : "produit(s) stock faible"}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild className="bg-white dark:bg-transparent">
                <Link href="/admin/products">
                  {locale === "ar" ? "عرض المنتجات" : "Voir les produits"}
                  <ArrowRight className="ml-2 h-4 w-4 rtl:rotate-180 rtl:mr-2 rtl:ml-0" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.title} 
            className={stat.highlight ? "border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/10" : ""}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-medium">
              {locale === "ar" ? "إجمالي الإيرادات" : "Chiffre d'affaires"}
            </CardTitle>
            <CardDescription>
              {locale === "ar" ? "من الطلبات المعتمدة والمكتملة" : "Des commandes validées"}
            </CardDescription>
          </div>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {formatPrice(stats.totalRevenue)}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders by Month Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === "ar" ? "الطلبات حسب الشهر" : "Commandes par mois"}
            </CardTitle>
            <CardDescription>
              {locale === "ar" ? "آخر 6 أشهر" : "Les 6 derniers mois"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.ordersByMonth && stats.ordersByMonth.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.ordersByMonth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="month" 
                      className="text-xs"
                      tick={{ fill: "currentColor" }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: "currentColor" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [value, locale === "ar" ? "طلبات" : "Commandes"]}
                    />
                    <Bar 
                      dataKey="orders" 
                      fill="hsl(210, 80%, 50%)" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message={locale === "ar" ? "لا توجد بيانات" : "Aucune donnée"} />
            )}
          </CardContent>
        </Card>

        {/* Products by Category Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === "ar" ? "المنتجات حسب الفئة" : "Produits par catégorie"}
            </CardTitle>
            <CardDescription>
              {locale === "ar" ? "توزيع المنتجات" : "Répartition des produits"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.productsByCategory && stats.productsByCategory.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.productsByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="category"
                      label={({ category, count }) => `${category}: ${count}`}
                    >
                      {stats.productsByCategory.map((entry, index) => (
                        <Cell 
                          key={`cell-${entry.category}`} 
                          fill={CHART_COLORS[index % CHART_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message={locale === "ar" ? "لا توجد منتجات" : "Aucun produit"} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {locale === "ar" ? "أحدث الطلبات" : "Commandes récentes"}
              </CardTitle>
              <CardDescription>
                {locale === "ar" ? "آخر 5 طلبات" : "Les 5 dernières commandes"}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/orders">
                {locale === "ar" ? "عرض الكل" : "Voir tout"}
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentOrders && stats.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {order.customer_first_name} {order.customer_last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.items_count} {locale === "ar" ? "منتج" : "article(s)"} | {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-medium">
                        {formatPrice(order.total_price)}
                      </span>
                      <Badge 
                        className={ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] || "bg-gray-100 text-gray-800"}
                      >
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                message={locale === "ar" ? "لا توجد طلبات حتى الآن" : "Aucune commande pour le moment"} 
              />
            )}
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {locale === "ar" ? "منتجات بمخزون منخفض" : "Stock faible"}
              </CardTitle>
              <CardDescription>
                {locale === "ar" ? "تحتاج انتباه" : "Nécessitent attention"}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/products">
                {locale === "ar" ? "عرض الكل" : "Voir tout"}
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.lowStockItems && stats.lowStockItems.length > 0 ? (
              <div className="space-y-4">
                {stats.lowStockItems.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {locale === "ar" ? product.name_ar : product.name_fr}
                      </p>
                    </div>
                    <Badge
                      variant={product.stock_quantity === 0 ? "destructive" : "secondary"}
                      className={
                        product.stock_quantity === 0
                          ? ""
                          : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                      }
                    >
                      {product.stock_quantity === 0
                        ? (locale === "ar" ? "غير متوفر" : "Rupture")
                        : `${product.stock_quantity} ${locale === "ar" ? "وحدة" : "unités"}`}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                message={locale === "ar" ? "جميع المنتجات متوفرة بكميات كافية" : "Tous les produits sont bien approvisionnés"} 
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
