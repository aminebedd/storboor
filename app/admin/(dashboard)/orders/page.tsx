"use client";

/**
 * Admin Orders Page
 * Displays and manages orders from Supabase database
 * 
 * IMPORTANT BUSINESS LOGIC:
 * - Approve: Reduces stock for each item
 * - Reject: Stock is NOT affected
 * - Cancel (if approved): Restores stock
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  getOrders, 
  approveOrder, 
  rejectOrder, 
  completeOrder 
} from "@/actions/orders";
import { useTranslation } from "@/lib/i18n";
import { ORDER_STATUS_COLORS } from "@/lib/constants";
import type { OrderStatus } from "@/types";
import { 
  Search, Eye, Check, X, CheckCircle, AlertTriangle, 
  Package, RefreshCw, Loader2 
} from "lucide-react";

type OrderWithItems = {
  id: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_company: string | null;
  customer_city: string | null;
  customer_notes: string | null;
  status: OrderStatus;
  total_price: number | null;
  created_at: string;
  order_items: {
    id: string;
    product_name: string;
    quantity: number;
    price_at_order: number | null;
    products: {
      id: string;
      name: string;
      name_ar: string;
      name_fr: string;
      stock_quantity: number;
    };
  }[];
};

export default function AdminOrdersPage() {
  const { t, locale } = useTranslation();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Confirm dialogs
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [orderToAction, setOrderToAction] = useState<OrderWithItems | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch orders from Supabase
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const result = await getOrders({
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: searchQuery || undefined,
    });
    
    if (result.success && result.data) {
      setOrders(result.data as OrderWithItems[]);
    }
    setLoading(false);
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchOrders]);

  const handleViewDetails = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  /**
   * Initiate order approval - shows confirmation dialog
   */
  const handleApproveClick = (order: OrderWithItems) => {
    setOrderToAction(order);
    setActionError(null);
    setApproveDialogOpen(true);
  };

  /**
   * Confirm order approval - this will reduce stock
   */
  const handleConfirmApprove = async () => {
    if (!orderToAction) return;
    
    setIsProcessing(true);
    setActionError(null);

    const result = await approveOrder(orderToAction.id);

    if (result.success) {
      await fetchOrders();
      setApproveDialogOpen(false);
      if (isDetailOpen) setIsDetailOpen(false);
    } else {
      setActionError(result.error || t("notifications.errorOccurred"));
    }

    setIsProcessing(false);
  };

  /**
   * Initiate order rejection - shows confirmation dialog
   */
  const handleRejectClick = (order: OrderWithItems) => {
    setOrderToAction(order);
    setRejectionReason("");
    setActionError(null);
    setRejectDialogOpen(true);
  };

  /**
   * Confirm order rejection - stock is NOT affected
   */
  const handleConfirmReject = async () => {
    if (!orderToAction) return;

    setIsProcessing(true);
    setActionError(null);

    const result = await rejectOrder(orderToAction.id, rejectionReason || undefined);

    if (result.success) {
      await fetchOrders();
      setRejectDialogOpen(false);
      if (isDetailOpen) setIsDetailOpen(false);
    } else {
      setActionError(result.error || t("notifications.errorOccurred"));
    }

    setIsProcessing(false);
  };

  /**
   * Mark approved order as completed
   */
  const handleComplete = async (order: OrderWithItems) => {
    setIsProcessing(true);
    const result = await completeOrder(order.id);
    if (result.success) {
      await fetchOrders();
      if (isDetailOpen) setIsDetailOpen(false);
    }
    setIsProcessing(false);
  };

  const getStatusBadge = (status: OrderStatus) => {
    const colorClass = ORDER_STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
    const label = t(`orders.status${status.charAt(0).toUpperCase() + status.slice(1)}`);
    return <Badge className={colorClass}>{label}</Badge>;
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === 0) return t("orders.requestQuoteOrder");
    return `${price.toLocaleString()} ${t("currency.symbol")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === "ar" ? "ar-DZ" : "fr-FR");
  };

  // Loading skeleton
  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Card>
          <CardHeader className="pb-4">
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("adminOrders.title")}</h1>
          <p className="text-muted-foreground">{t("adminOrders.description")}</p>
        </div>
        <Button onClick={fetchOrders} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {t("common.refresh")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{t("adminOrders.allOrders")}</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder={t("adminOrders.filterStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("adminOrders.allStatus")}</SelectItem>
                  <SelectItem value="pending">{t("orders.statusPending")}</SelectItem>
                  <SelectItem value="approved">{t("orders.statusApproved")}</SelectItem>
                  <SelectItem value="rejected">{t("orders.statusRejected")}</SelectItem>
                  <SelectItem value="completed">{t("orders.statusCompleted")}</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-[250px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t("adminOrders.searchOrders")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">{t("admin.orderId")}</th>
                  <th className="pb-3 font-medium">{t("admin.customer")}</th>
                  <th className="pb-3 font-medium">{t("adminOrders.phone")}</th>
                  <th className="pb-3 font-medium">{t("orders.itemsOrdered")}</th>
                  <th className="pb-3 font-medium">{t("orders.orderTotal")}</th>
                  <th className="pb-3 font-medium">{t("admin.status")}</th>
                  <th className="pb-3 font-medium text-right">{t("admin.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border">
                    <td className="py-4 font-medium">{order.id.slice(0, 8)}...</td>
                    <td className="py-4">
                      {order.customer_first_name} {order.customer_last_name}
                      {order.customer_company && (
                        <span className="block text-xs text-muted-foreground">
                          {order.customer_company}
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">
                      {order.customer_phone || "-"}
                    </td>
                    <td className="py-4">
                      <span className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {order.order_items?.length || 0} items
                      </span>
                    </td>
                    <td className="py-4 font-medium">
                      {formatPrice(order.total_price)}
                    </td>
                    <td className="py-4">{getStatusBadge(order.status)}</td>
                    <td className="py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(order)}
                          title={t("common.details")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:bg-green-50 hover:text-green-700"
                              onClick={() => handleApproveClick(order)}
                              title={t("orders.approveOrder")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleRejectClick(order)}
                              title={t("orders.rejectOrder")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {order.status === "approved" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => handleComplete(order)}
                            title={t("orders.completeOrder")}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && !loading && (
              <p className="py-8 text-center text-muted-foreground">
                {t("adminOrders.noOrders")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("adminOrders.orderDetails")}</DialogTitle>
            <DialogDescription>
              {t("admin.orderId")}: {selectedOrder?.id.slice(0, 8)}...
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="space-y-3">
                <h3 className="font-semibold">{t("adminOrders.customerInfo")}</h3>
                <div className="grid gap-2 text-sm rounded-lg bg-muted/50 p-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("adminOrders.name")}</span>
                    <span>
                      {selectedOrder.customer_first_name} {selectedOrder.customer_last_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("contact.phone")}</span>
                    <span>{selectedOrder.customer_phone || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("contact.email")}</span>
                    <span>{selectedOrder.customer_email}</span>
                  </div>
                  {selectedOrder.customer_company && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Company</span>
                      <span>{selectedOrder.customer_company}</span>
                    </div>
                  )}
                  {selectedOrder.customer_city && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">City</span>
                      <span>{selectedOrder.customer_city}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <h3 className="font-semibold">{t("orders.itemsOrdered")}</h3>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {t("adminOrders.quantity")}: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatPrice(item.price_at_order ? item.price_at_order * item.quantity : null)}
                        </p>
                        {item.price_at_order && (
                          <p className="text-xs text-muted-foreground">
                            @ {formatPrice(item.price_at_order)} / unit
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t pt-3 font-semibold">
                  <span>{t("orders.orderTotal")}</span>
                  <span>{formatPrice(selectedOrder.total_price)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.customer_notes && (
                <div className="space-y-2">
                  <h3 className="font-semibold">{t("adminOrders.notes")}</h3>
                  <p className="text-sm text-muted-foreground rounded-lg bg-muted/50 p-3">
                    {selectedOrder.customer_notes}
                  </p>
                </div>
              )}

              {/* Status & Actions */}
              <div className="space-y-3">
                <h3 className="font-semibold">{t("adminOrders.orderStatus")}</h3>
                <div className="flex items-center gap-4">
                  {getStatusBadge(selectedOrder.status)}
                  <span className="text-sm text-muted-foreground">
                    {formatDate(selectedOrder.created_at)}
                  </span>
                </div>
                
                {selectedOrder.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setIsDetailOpen(false);
                        handleApproveClick(selectedOrder);
                      }}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {t("orders.approveOrder")}
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setIsDetailOpen(false);
                        handleRejectClick(selectedOrder);
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      {t("orders.rejectOrder")}
                    </Button>
                  </div>
                )}

                {selectedOrder.status === "approved" && (
                  <Button
                    className="w-full"
                    onClick={() => handleComplete(selectedOrder)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    {t("orders.completeOrder")}
                  </Button>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  {t("common.close")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              {t("orders.confirmApprove")}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{t("orders.confirmApproveMessage")}</p>
              {orderToAction && (
                <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                  <p className="font-medium">{t("orders.stockDeducted")}</p>
                  <ul className="mt-2 space-y-1">
                    {orderToAction.order_items?.map((item) => (
                      <li key={item.id}>
                        {item.product_name}: -{item.quantity} units
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {actionError && (
                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>{actionError}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                t("orders.approveOrder")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-600" />
              {t("orders.confirmReject")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-4">{t("orders.confirmRejectMessage")}</p>
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">{t("orders.rejectionReason")}</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder={t("orders.rejectionPlaceholder")}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                <p>{t("orders.stockNotAffected")}</p>
              </div>
              {actionError && (
                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>{actionError}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReject}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                t("orders.rejectOrder")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
