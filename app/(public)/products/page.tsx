"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowRight, ArrowLeft, Package, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Category {
  id: string;
  name_fr: string;
  name_ar: string;
  slug: string;
}

interface Product {
  id: string;
  name_fr: string;
  name_ar: string;
  description_fr: string | null;
  description_ar: string | null;
  price: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  material: string | null;
  images: string[] | null;
  category: Category | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProductsPage() {
  const { t, locale, isRTL } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: productsData, isLoading: productsLoading } = useSWR<{
    success: boolean;
    data: Product[];
  }>("/api/products", fetcher);

  const { data: categoriesData, isLoading: categoriesLoading } = useSWR<{
    success: boolean;
    data: Category[];
  }>("/api/categories", fetcher);

  const products = productsData?.data || [];
  const categoriesFromDb = categoriesData?.data || [];

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const categories = [
    { id: "all", slug: "all", name: t("products.allProducts") },
    ...categoriesFromDb.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: locale === "ar" ? cat.name_ar : cat.name_fr,
    })),
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "all" ||
        product.category?.id === activeCategory ||
        product.category?.slug === activeCategory;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        product.name_fr.toLowerCase().includes(searchLower) ||
        product.name_ar.includes(searchQuery) ||
        (product.material && product.material.toLowerCase().includes(searchLower)) ||
        (product.description_fr &&
          product.description_fr.toLowerCase().includes(searchLower));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, products]);

  const formatPrice = (price: number | null) => {
    if (price === null) return t("common.requestPrice");
    return `${price.toLocaleString()} ${t("currency.symbol")}`;
  };

  const isLoading = productsLoading || categoriesLoading;

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            {t("products.pageTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
            {t("products.pageDescription")}
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="border-b border-border bg-card py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
            <div className="relative w-full max-w-sm">
              <Search
                className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${
                  isRTL ? "right-3" : "left-3"
                }`}
              />
              <Input
                type="text"
                placeholder={t("common.searchProducts")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={isRTL ? "pr-10" : "pl-10"}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden border border-border bg-card">
                  <Skeleton className="aspect-square" />
                  <CardContent className="p-5">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="mt-2 h-5 w-full" />
                    <Skeleton className="mt-2 h-4 w-3/4" />
                    <Skeleton className="mt-4 h-6 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg text-muted-foreground">
                {t("products.noProductsFound")}
              </p>
              <Button
                variant="outline"
                className="mt-4 bg-transparent"
                onClick={() => {
                  setActiveCategory("all");
                  setSearchQuery("");
                }}
              >
                {t("common.clearFilters")}
              </Button>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm text-muted-foreground">
                {t("common.showing")} {filteredProducts.length}{" "}
                {filteredProducts.length !== 1
                  ? t("common.products_plural")
                  : t("common.product")}
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => {
                  const productName =
                    locale === "ar" ? product.name_ar : product.name_fr;
                  const productDescription =
                    locale === "ar" ? product.description_ar : product.description_fr;
                  const isOutOfStock = product.stock_quantity === 0;
                  const isLowStock =
                    product.stock_quantity > 0 &&
                    product.stock_quantity <= product.low_stock_threshold;
                  const categoryName =
                    locale === "ar"
                      ? product.category?.name_ar
                      : product.category?.name_fr;

                  return (
                    <Link key={product.id} href={`/products/${product.id}`}>
                      <Card className="group h-full overflow-hidden border border-border bg-card transition-all hover:shadow-lg">
                        <div className="relative aspect-square overflow-hidden bg-muted">
                          <Image
                            src={product.images?.[0] || "/placeholder.svg"}
                            alt={productName}
                            fill
                            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                              isOutOfStock ? "opacity-50" : ""
                            }`}
                          />
                          {/* Stock Status Badge */}
                          {isOutOfStock && (
                            <Badge
                              variant="destructive"
                              className="absolute top-2 right-2"
                            >
                              {t("inventory.outOfStock")}
                            </Badge>
                          )}
                          {isLowStock && !isOutOfStock && (
                            <Badge className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              {t("inventory.lowStock")}
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium uppercase tracking-wider text-accent">
                              {product.material}
                            </p>
                            <p className="text-xs text-muted-foreground">{categoryName}</p>
                          </div>
                          <h3 className="mt-2 line-clamp-1 font-semibold text-foreground">
                            {productName}
                          </h3>
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {productDescription}
                          </p>
                          <div className="mt-4 flex items-center justify-between">
                            <div>
                              {product.price ? (
                                <p className="text-lg font-bold">
                                  {formatPrice(product.price)}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  {t("common.requestPrice")}
                                </p>
                              )}
                              {/* Stock indicator */}
                              {!isOutOfStock && (
                                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                  <Package className="h-3 w-3" />
                                  {product.stock_quantity} {t("inventory.unitsAvailable")}
                                </p>
                              )}
                            </div>
                            <span className="flex items-center gap-1 text-sm font-medium text-accent">
                              {t("common.details")} <ArrowIcon className="h-4 w-4" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">{t("products.cantFindTitle")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {t("products.cantFindDescription")}
          </p>
          <Link href="/quote">
            <Button size="lg" className="mt-6">
              {t("products.requestCustomQuote")}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
