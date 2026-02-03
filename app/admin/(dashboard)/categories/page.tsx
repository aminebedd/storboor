"use client";

import React from "react"

/**
 * Admin Categories Page
 * صفحة إدارة الفئات
 * 
 * All data is fetched from Supabase database via API routes
 */

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { useTranslation } from "@/lib/i18n";
import type { Category } from "@/types/database";
import { Plus, Pencil, Trash2, Folder, RefreshCw, XCircle, Package } from "lucide-react";

// Types
interface CategoryWithCount extends Category {
  product_count: number;
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export default function AdminCategoriesPage() {
  const { locale } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithCount | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    name_fr: "",
    slug: "",
    description: "",
    is_active: true,
  });

  // Fetch categories from API
  const { data: categoriesData, error, isLoading, mutate } = useSWR<CategoryWithCount[]>(
    "/api/categories?includeCount=true",
    fetcher,
    { revalidateOnFocus: false }
  );

  const categories = categoriesData || [];

  // Handle edit
  const handleEdit = (category: CategoryWithCount) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      name_ar: category.name_ar,
      name_fr: category.name_fr,
      slug: category.slug,
      description: category.description || "",
      is_active: category.is_active,
    });
    setIsDialogOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      name_ar: "",
      name_fr: "",
      slug: "",
      description: "",
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (category: CategoryWithCount) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  // Handle save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = editingCategory 
        ? `/api/categories/${editingCategory.id}` 
        : "/api/categories";
      
      const method = editingCategory ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save category");

      await mutate();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete category");

      await mutate();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Loading state
  if (isLoading) {
    return <CategoriesPageSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">
          {locale === "ar" ? "خطأ في تحميل الفئات" : "Erreur de chargement"}
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
            {locale === "ar" ? "الفئات" : "Catégories"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar" ? "إدارة فئات المنتجات" : "Gérer les catégories"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => mutate()} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            {locale === "ar" ? "تحديث" : "Actualiser"}
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            {locale === "ar" ? "إضافة فئة" : "Ajouter"}
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id} className={!category.is_active ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Folder className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {locale === "ar" ? category.name_ar : category.name_fr}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">/{category.slug}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(category)}
                    className="text-destructive hover:text-destructive"
                    disabled={category.product_count > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {category.description || (locale === "ar" ? "لا يوجد وصف" : "Pas de description")}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{category.product_count}</span>
                  <span className="text-muted-foreground">
                    {locale === "ar" ? "منتج" : "produits"}
                  </span>
                </div>
                {!category.is_active && (
                  <span className="text-xs text-muted-foreground">
                    {locale === "ar" ? "غير نشط" : "Inactif"}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">
              {locale === "ar" ? "لا توجد فئات" : "Aucune catégorie"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {locale === "ar" ? "ابدأ بإضافة فئة جديدة" : "Commencez par ajouter une catégorie"}
            </p>
            <Button onClick={handleAddNew} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              {locale === "ar" ? "إضافة فئة" : "Ajouter une catégorie"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory 
                ? (locale === "ar" ? "تعديل الفئة" : "Modifier la catégorie")
                : (locale === "ar" ? "إضافة فئة جديدة" : "Nouvelle catégorie")}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? (locale === "ar" ? "تحديث تفاصيل الفئة" : "Mettre à jour les détails")
                : (locale === "ar" ? "أدخل تفاصيل الفئة الجديدة" : "Entrez les détails de la catégorie")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{locale === "ar" ? "الاسم (إنجليزي)" : "Nom (Anglais)"}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      name: e.target.value,
                      slug: formData.slug || generateSlug(e.target.value)
                    });
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_fr">{locale === "ar" ? "الاسم (فرنسي)" : "Nom (Français)"}</Label>
                <Input
                  id="name_fr"
                  value={formData.name_fr}
                  onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name_ar">{locale === "ar" ? "الاسم (عربي)" : "Nom (Arabe)"}</Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  dir="rtl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{locale === "ar" ? "الوصف" : "Description"}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">{locale === "ar" ? "نشط" : "Actif"}</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {locale === "ar" ? "إلغاء" : "Annuler"}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving 
                  ? (locale === "ar" ? "جاري الحفظ..." : "Enregistrement...")
                  : (editingCategory 
                      ? (locale === "ar" ? "تحديث" : "Mettre à jour")
                      : (locale === "ar" ? "إضافة" : "Ajouter"))}
              </Button>
            </DialogFooter>
          </form>
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
              {locale === "ar" 
                ? `هل أنت متأكد من حذف الفئة "${categoryToDelete?.name_ar}"؟`
                : `Voulez-vous vraiment supprimer la catégorie "${categoryToDelete?.name_fr}" ?`}
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
function CategoriesPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-20 mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
