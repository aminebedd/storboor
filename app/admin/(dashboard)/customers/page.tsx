"use client";

/**
 * Admin Customers Page
 * صفحة إدارة العملاء
 * 
 * All data is fetched from Supabase database via API routes
 */

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/lib/i18n";
import type { Customer, Order } from "@/types/database";
import { Search, Mail, Phone, Building2, MapPin, RefreshCw, XCircle, Users, Eye } from "lucide-react";

// Types
interface CustomerWithStats extends Customer {
  order_count: number;
  total_spent: number;
  last_order_date: string | null;
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export default function AdminCustomersPage() {
  const { locale } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [ordersDialogOpen, setOrdersDialogOpen] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Fetch customers from API
  const { data: customersData, error, isLoading, mutate } = useSWR<{ data: CustomerWithStats[] }>(
    "/api/admin/customers",
    fetcher,
    { revalidateOnFocus: false }
  );

  const customers = customersData?.data || [];

  // Filter customers
  const filteredCustomers = customers.filter((c) =>
    c.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.company?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  // View customer orders
  const handleViewOrders = async (customer: CustomerWithStats) => {
    setSelectedCustomer(customer);
    setLoadingOrders(true);
    setOrdersDialogOpen(true);

    try {
      const res = await fetch(`/api/admin/orders?customerId=${customer.id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerOrders(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Format price
  const formatPrice = (price: number | null) => {
    if (!price) return "-";
    return `${price.toLocaleString()} ${locale === "ar" ? "د.ج" : "DA"}`;
  };

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(locale === "ar" ? "ar" : "fr");
  };

  // Loading state
  if (isLoading) {
    return <CustomersPageSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">
          {locale === "ar" ? "خطأ في تحميل العملاء" : "Erreur de chargement"}
        </p>
        <Button onClick={() => mutate()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          {locale === "ar" ? "إعادة المحاولة" : "Réessayer"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === "ar" ? "العملاء" : "Clients"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar" ? "قاعدة بيانات العملاء" : "Base de données clients"}
          </p>
        </div>
        <Button onClick={() => mutate()} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          {locale === "ar" ? "تحديث" : "Actualiser"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "إجمالي العملاء" : "Total clients"}
                </p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-500/10 p-3">
                <Building2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "شركات" : "Entreprises"}
                </p>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.company).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-500/10 p-3">
                <MapPin className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "مدن" : "Villes"}
                </p>
                <p className="text-2xl font-bold">
                  {new Set(customers.map(c => c.city).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>
              {locale === "ar" ? "جميع العملاء" : "Tous les clients"} ({filteredCustomers.length})
            </CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={locale === "ar" ? "بحث..." : "Rechercher..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{locale === "ar" ? "العميل" : "Client"}</TableHead>
                  <TableHead>{locale === "ar" ? "الاتصال" : "Contact"}</TableHead>
                  <TableHead>{locale === "ar" ? "الشركة" : "Entreprise"}</TableHead>
                  <TableHead>{locale === "ar" ? "الطلبات" : "Commandes"}</TableHead>
                  <TableHead>{locale === "ar" ? "إجمالي المشتريات" : "Total achats"}</TableHead>
                  <TableHead className="text-right">{locale === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {customer.first_name[0]}{customer.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium">
                            {customer.first_name} {customer.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {customer.city || "-"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.company ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {customer.company}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {customer.order_count || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(customer.total_spent)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewOrders(customer)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {locale === "ar" ? "الطلبات" : "Commandes"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredCustomers.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                {locale === "ar" ? "لا يوجد عملاء" : "Aucun client trouvé"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Orders Dialog */}
      <Dialog open={ordersDialogOpen} onOpenChange={setOrdersDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {locale === "ar" ? "طلبات" : "Commandes de"} {selectedCustomer?.first_name} {selectedCustomer?.last_name}
            </DialogTitle>
            <DialogDescription>
              {selectedCustomer?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {loadingOrders ? (
              <div className="space-y-4 py-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : customerOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "ar" ? "رقم الطلب" : "N° Commande"}</TableHead>
                    <TableHead>{locale === "ar" ? "التاريخ" : "Date"}</TableHead>
                    <TableHead>{locale === "ar" ? "الحالة" : "Statut"}</TableHead>
                    <TableHead>{locale === "ar" ? "المبلغ" : "Montant"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(order.total_price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                {locale === "ar" ? "لا توجد طلبات" : "Aucune commande"}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Loading Skeleton
function CustomersPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
