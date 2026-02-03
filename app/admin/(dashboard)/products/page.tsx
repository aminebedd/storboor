"use client";

/**
 * Admin Products Page
 * صفحة إدارة المنتجات
 * 
 * All data is fetched from Supabase database via API routes
 */

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import type { Product, Category } from "@/types/database";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  AlertTriangle,
  Minus,
  RefreshCw,
  XCircle,
} from "lucide-react";

// Types
interface ProductWithCategory extends Product {
  categories: Category | null;
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export default function AdminProductsPage() {
  const { t, locale } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  
  // Stock adjustment dialog
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null);
  const [newStockQuantity, setNewStockQuantity] = useState(0);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductWithCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch products from API
  const { data: productsData, error: productsError, isLoading: productsLoading, mutate: mutateProducts } = useSWR<ProductWithCategory[]>(
    "/api/products?includeInactive=true",
    fetcher,
    { revalidateOnFocus: false }
  );

  // Fetch categories from API
  const { data: categoriesData } = useSWR<Category[]>(
    "/api/categories",
    fetcher,
    { revalidateOnFocus: false }
  );

  const products = productsData || [];
  const categories = categoriesData || [];

  // Filter products
  const filteredProducts = products.filter((p) => {
    // Search filter
    const searchMatch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name_fr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name_ar.includes(searchQuery) ||
      (p.material?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    // Category filter
    const categoryMatch = categoryFilter === "all" || p.category_id === categoryFilter;
    
    // Stock filter
    let stockMatch = true;
    if (stockFilter === "low") {
      stockMatch = p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold;
    } else if (stockFilter === "out") {
      stockMatch = p.stock_quantity === 0;
    } else if (stockFilter === "available") {
      stockMatch = p.stock_quantity > p.low_stock_threshold;
    }

    return searchMatch && categoryMatch && stockMatch;
  });

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "-";
    const category = categories.find((c) => c.id === categoryId);
    return locale === "ar" ? category?.name_ar : category?.name_fr || category?.name || categoryId;
  };

  const handleOpenStockDialog = (product: ProductWithCategory) => {
    setSelectedProduct(product);
    setNewStockQuantity(product.stock_quantity);
    setStockDialogOpen(true);
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct) return;
    setIsUpdatingStock(true);

    try {
      const response = await fetch(`/api/products/${selectedProduct.id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          stock_quantity: newStockQuantity,
          change_type: newStockQuantity > selectedProduct.stock_quantity ? "add" : "remove"
        }),
      });

      if (!response.ok) throw new Error("Failed to update stock");
      
      await mutateProducts();
      setStockDialogOpen(false);
    } catch (error) {
      console.error("Error updating stock:", error);
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const handleDeleteClick = (product: ProductWithCategory) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/products/${productToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete product");
      
      await mutateProducts();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStockBadge = (product: ProductWithCategory) => {
    if (product.stock_quantity === 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Minus className="h-3 w-3" />
          {locale === "ar" ? "غير متوفر" : "Rupture"}
        </Badge>
      );
    }
    if (product.stock_quantity <= product.low_stock_threshold) {
      return (
        <Badge className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          <AlertTriangle className="h-3 w-3" />
          {locale === "ar" ? "مخزون منخفض" : "Stock faible"}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Package className="h-3 w-3" />
        {product.stock_quantity} {locale === "ar" ? "وحدة" : "unités"}
      </Badge>
    );
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return locale === "ar" ? "طلب سعر" : "Sur devis";
    return `${price.toLocaleString()} ${locale === "ar" ? "د.ج" : "DA"}`;
  };

  // Loading state
  if (productsLoading) {
    return <ProductsPageSkeleton />;
  }

  // Error state
  if (productsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">
          {locale === "ar" ? "خطأ في تحميل المنتجات" : "Erreur de chargement"}
        </p>
        <Button onClick={() => mutateProducts()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          {locale === "ar" ? "إعادة المحاولة" : "Réessayer"}
        </Button>
      </div>
    );
  }

  // Count alerts
  const outOfStockCount = products.filter(p => p.stock_quantity === 0 && p.is_active).length;
  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold && p.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === "ar" ? "المنتجات" : "Produits"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar" ? "إدارة كتالوج المنتجات" : "Gérer le catalogue produits"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => mutateProducts()} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            {locale === "ar" ? "تحديث" : "Actualiser"}
          </Button>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              {locale === "ar" ? "إضافة منتج" : "Ajouter"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stock Alerts */}
      {(outOfStockCount > 0 || lowStockCount > 0) && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  {locale === "ar" ? "تنبيه المخزون" : "Alerte Stock"}
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {outOfStockCount > 0 && (
                    <span className="font-medium">
                      {outOfStockCount} {locale === "ar" ? "منتج غير متوفر" : "en rupture"}
                    </span>
                  )}
                  {outOfStockCount > 0 && lowStockCount > 0 && " | "}
                  {lowStockCount > 0 && (
                    <span>
                      {lowStockCount} {locale === "ar" ? "مخزون منخفض" : "stock faible"}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>
              {locale === "ar" ? "جميع المنتجات" : "Tous les produits"} ({filteredProducts.length})
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={locale === "ar" ? "بحث..." : "Rechercher..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder={locale === "ar" ? "الفئة" : "Catégorie"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{locale === "ar" ? "جميع الفئات" : "Toutes"}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {locale === "ar" ? cat.name_ar : cat.name_fr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder={locale === "ar" ? "المخزون" : "Stock"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{locale === "ar" ? "الكل" : "Tous"}</SelectItem>
                  <SelectItem value="available">{locale === "ar" ? "متوفر" : "Disponible"}</SelectItem>
                  <SelectItem value="low">{locale === "ar" ? "منخفض" : "Faible"}</SelectItem>
                  <SelectItem value="out">{locale === "ar" ? "غير متوفر" : "Rupture"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">{locale === "ar" ? "المنتج" : "Produit"}</th>
                  <th className="pb-3 font-medium">{locale === "ar" ? "الفئة" : "Catégorie"}</th>
                  <th className="pb-3 font-medium">{locale === "ar" ? "السعر" : "Prix"}</th>
                  <th className="pb-3 font-medium">{locale === "ar" ? "المخزون" : "Stock"}</th>
                  <th className="pb-3 font-medium">{locale === "ar" ? "الحالة" : "Statut"}</th>
                  <th className="pb-3 font-medium text-right">{locale === "ar" ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`border-b border-border ${!product.is_active ? "opacity-50" : ""}`}
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded bg-muted">
                          <Image
                            src={product.images?.[0] || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">
                            {locale === "ar" ? product.name_ar : product.name_fr}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {product.material || "-"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">{getCategoryName(product.category_id)}</td>
                    <td className="py-4 font-medium">{formatPrice(product.price)}</td>
                    <td className="py-4">
                      <button
                        onClick={() => handleOpenStockDialog(product)}
                        className="cursor-pointer hover:opacity-80"
                      >
                        {getStockBadge(product)}
                      </button>
                    </td>
                    <td className="py-4">
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active
                          ? (locale === "ar" ? "نشط" : "Actif")
                          : (locale === "ar" ? "غير نشط" : "Inactif")}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(product)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                {locale === "ar" ? "لا توجد منتجات" : "Aucun produit trouvé"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {locale === "ar" ? "تعديل المخزون" : "Ajuster le stock"}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct && (locale === "ar" ? selectedProduct.name_ar : selectedProduct.name_fr)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {locale === "ar" ? "المخزون الحالي" : "Stock actuel"}
              </span>
              <span className="font-medium">{selectedProduct?.stock_quantity}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-stock">
                {locale === "ar" ? "المخزون الجديد" : "Nouveau stock"}
              </Label>
              <Input
                id="new-stock"
                type="number"
                min="0"
                value={newStockQuantity}
                onChange={(e) => setNewStockQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>{locale === "ar" ? "حد التنبيه" : "Seuil d'alerte"}</Label>
              <p className="text-sm text-muted-foreground">
                {selectedProduct?.low_stock_threshold} {locale === "ar" ? "وحدة" : "unités"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockDialogOpen(false)}>
              {locale === "ar" ? "إلغاء" : "Annuler"}
            </Button>
            <Button onClick={handleUpdateStock} disabled={isUpdatingStock}>
              {isUpdatingStock 
                ? (locale === "ar" ? "جاري التحديث..." : "Mise à jour...")
                : (locale === "ar" ? "تحديث" : "Mettre à jour")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === "ar" ? "تأكيد الحذف" : "Confirmer la suppression"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {productToDelete && (locale === "ar" ? productToDelete.name_ar : productToDelete.name_fr)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {locale === "ar" ? "إلغاء" : "Annuler"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting 
                ? (locale === "ar" ? "جاري الحذف..." : "Suppression...")
                : (locale === "ar" ? "حذف" : "Supprimer")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Loading Skeleton
function ProductsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
