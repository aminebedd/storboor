"use client";

/**
 * Add New Product Page
 * Creates products directly in Supabase database
 */

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";
import { ArrowLeft, ArrowRight, Upload, X, Plus, ImageIcon, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name_fr: string;
  name_ar: string;
  slug: string;
}

interface ProductFormData {
  name_fr: string;
  name_ar: string;
  category_id: string;
  material: string;
  price: string;
  description_fr: string;
  description_ar: string;
  dimensions: string;
  colors: string[];
  insulation: string;
  stock_quantity: string;
  low_stock_threshold: string;
  is_active: boolean;
  images: string[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AddProductPage() {
  const router = useRouter();
  const { t, locale, isRTL } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [colorInput, setColorInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  // Fetch categories from Supabase
  const { data: categoriesData, isLoading: categoriesLoading } = useSWR<{
    success: boolean;
    data: Category[];
  }>("/api/categories", fetcher);

  const categories = categoriesData?.data || [];

  const [formData, setFormData] = useState<ProductFormData>({
    name_fr: "",
    name_ar: "",
    category_id: "",
    material: "",
    price: "",
    description_fr: "",
    description_ar: "",
    dimensions: "",
    colors: [],
    insulation: "",
    stock_quantity: "0",
    low_stock_threshold: "10",
    is_active: true,
    images: [],
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddColor = () => {
    if (colorInput.trim() && !formData.colors.includes(colorInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        colors: [...prev.colors, colorInput.trim()],
      }));
      setColorInput("");
    }
  };

  const handleRemoveColor = (color: string) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => c !== color),
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // In production, upload to Supabase Storage or another service
      // For now, we'll use placeholder URLs
      const newImages = Array.from(files).map(
        (_, index) => `/images/products/product-${Date.now()}-${index}.jpg`
      );
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate required fields
    if (!formData.name_fr || !formData.name_ar || !formData.category_id) {
      setError(t("adminProducts.requiredFieldsError"));
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name_fr: formData.name_fr,
          name_ar: formData.name_ar,
          description_fr: formData.description_fr || null,
          description_ar: formData.description_ar || null,
          category_id: formData.category_id,
          price: formData.price ? Number(formData.price) : null,
          stock_quantity: Number(formData.stock_quantity) || 0,
          low_stock_threshold: Number(formData.low_stock_threshold) || 10,
          material: formData.material || null,
          dimensions: formData.dimensions || null,
          insulation: formData.insulation || null,
          colors: formData.colors,
          images: formData.images,
          is_active: formData.is_active,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || t("adminProducts.createError"));
      }

      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("adminProducts.createError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowIcon className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("adminProducts.addProduct")}</h1>
          <p className="text-muted-foreground">{t("adminProducts.addProductDesc")}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t("adminProducts.basicInfo")}</CardTitle>
                <CardDescription>{t("adminProducts.basicInfoDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name_fr">{t("adminProducts.nameFr")} *</Label>
                    <Input
                      id="name_fr"
                      name="name_fr"
                      placeholder="e.g., Porte d'entrée en aluminium"
                      value={formData.name_fr}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name_ar">{t("adminProducts.nameAr")} *</Label>
                    <Input
                      id="name_ar"
                      name="name_ar"
                      placeholder="e.g., باب مدخل من الألمنيوم"
                      value={formData.name_ar}
                      onChange={handleInputChange}
                      dir="rtl"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="description_fr">{t("adminProducts.descFr")}</Label>
                    <Textarea
                      id="description_fr"
                      name="description_fr"
                      placeholder="Description en français..."
                      value={formData.description_fr}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_ar">{t("adminProducts.descAr")}</Label>
                    <Textarea
                      id="description_ar"
                      name="description_ar"
                      placeholder="الوصف بالعربية..."
                      value={formData.description_ar}
                      onChange={handleInputChange}
                      rows={3}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category_id">{t("adminProducts.category")} *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => handleSelectChange("category_id", value)}
                      disabled={categoriesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("adminProducts.selectCategory")} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {locale === "ar" ? cat.name_ar : cat.name_fr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="material">{t("adminProducts.material")}</Label>
                    <Input
                      id="material"
                      name="material"
                      placeholder="e.g., Aluminum, PVC, Wood"
                      value={formData.material}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>{t("adminProducts.specifications")}</CardTitle>
                <CardDescription>{t("adminProducts.specificationsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dimensions">{t("adminProducts.dimensions")}</Label>
                    <Input
                      id="dimensions"
                      name="dimensions"
                      placeholder="e.g., 210cm x 100cm"
                      value={formData.dimensions}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insulation">{t("adminProducts.insulation")}</Label>
                    <Input
                      id="insulation"
                      name="insulation"
                      placeholder="e.g., Thermal break technology"
                      value={formData.insulation}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("adminProducts.colors")}</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("adminProducts.addColor")}
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddColor();
                        }
                      }}
                    />
                    <Button type="button" variant="secondary" onClick={handleAddColor}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.colors.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {formData.colors.map((color) => (
                        <span
                          key={color}
                          className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm"
                        >
                          {color}
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(color)}
                            className="ml-1 rounded-full p-0.5 hover:bg-muted"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>{t("adminProducts.images")}</CardTitle>
                <CardDescription>{t("adminProducts.imagesDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {formData.images.map((image, index) => (
                    <div
                      key={index}
                      className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                    >
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`Product image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute right-2 top-2 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          {t("adminProducts.mainImage")}
                        </span>
                      )}
                    </div>
                  ))}
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-muted-foreground/50 hover:bg-muted">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">{t("adminProducts.uploadImage")}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                {formData.images.length === 0 && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed p-4">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{t("adminProducts.noImages")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>{t("adminProducts.statusPricing")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("adminProducts.productStatus")}</Label>
                    <p className="text-sm text-muted-foreground">{t("adminProducts.productStatusDesc")}</p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_active: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="price">{t("adminProducts.price")} ({t("currency.symbol")})</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="0"
                    value={formData.price}
                    onChange={handleInputChange}
                  />
                  <p className="text-sm text-muted-foreground">{t("adminProducts.priceNote")}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">{t("adminProducts.stockQuantity")}</Label>
                  <Input
                    id="stock_quantity"
                    name="stock_quantity"
                    type="number"
                    placeholder="0"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="low_stock_threshold">{t("adminProducts.lowStockThreshold")}</Label>
                  <Input
                    id="low_stock_threshold"
                    name="low_stock_threshold"
                    type="number"
                    placeholder="10"
                    value={formData.low_stock_threshold}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t("adminProducts.preview")}</CardTitle>
                <CardDescription>{t("adminProducts.previewDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border bg-card">
                  <div className="relative aspect-[4/3] bg-muted">
                    {formData.images[0] ? (
                      <Image
                        src={formData.images[0] || "/placeholder.svg"}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {formData.material || t("adminProducts.material")}
                    </p>
                    <h3 className="mt-1 font-semibold">
                      {locale === "ar" 
                        ? (formData.name_ar || t("adminProducts.productName"))
                        : (formData.name_fr || t("adminProducts.productName"))}
                    </h3>
                    <p className="mt-2 font-semibold text-accent">
                      {formData.price
                        ? `${Number(formData.price).toLocaleString()} ${t("currency.symbol")}`
                        : t("common.requestPrice")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3">
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.saving")}
                      </>
                    ) : (
                      t("adminProducts.saveProduct")
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => router.push("/admin/products")}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
