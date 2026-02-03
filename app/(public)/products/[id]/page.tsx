"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, Check, Package, AlertTriangle, Minus } from "lucide-react";
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
  dimensions: string | null;
  insulation: string | null;
  colors: string[] | null;
  images: string[] | null;
  is_featured: boolean;
  category_id: string;
  category: Category | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProductDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { t, locale, isRTL } = useTranslation();

  // Fetch product details
  const { data: productData, isLoading: productLoading, error: productError } = useSWR<{
    product: Product;
  }>(`/api/products/${id}`, fetcher);

  // Fetch related products (same category)
  const { data: relatedData } = useSWR<{ success: boolean; data: Product[] }>(
    productData?.product?.category_id
      ? `/api/products?category=${productData.product.category_id}&limit=3`
      : null,
    fetcher
  );

  const product = productData?.product;
  const relatedProducts = (relatedData?.data || []).filter((p) => p.id !== id).slice(0, 3);

  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  // Loading state
  if (productLoading) {
    return (
      <div className="flex flex-col">
        <section className="border-b border-border bg-card py-4">
          <div className="container mx-auto px-4">
            <Skeleton className="h-5 w-32" />
          </div>
        </section>
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-10 lg:grid-cols-2">
              <Skeleton className="aspect-square rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Error state
  if (productError || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-2xl font-bold">{t("common.productNotFound")}</h1>
        <p className="mt-2 text-muted-foreground">{t("common.productNotFoundDesc")}</p>
        <Link href="/products">
          <Button className="mt-4">{t("common.backToProducts")}</Button>
        </Link>
      </div>
    );
  }

  // Get localized content
  const productName = locale === "ar" ? product.name_ar : product.name_fr;
  const productDescription = locale === "ar" ? product.description_ar : product.description_fr;
  const categoryName = locale === "ar" ? product.category?.name_ar : product.category?.name_fr;

  // Stock status helpers
  const isOutOfStock = product.stock_quantity === 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold;

  const getStockDisplay = () => {
    if (isOutOfStock) {
      return (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-red-800">
          <Minus className="h-5 w-5" />
          <div>
            <p className="font-semibold">{t("inventory.outOfStock")}</p>
            <p className="text-sm">{t("inventory.outOfStockAlert")}</p>
          </div>
        </div>
      );
    }
    if (isLowStock) {
      return (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-3 text-yellow-800">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="font-semibold">{t("inventory.lowStock")}</p>
            <p className="text-sm">
              {t("inventory.onlyXLeft").replace("{count}", String(product.stock_quantity))}
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-green-800">
        <Package className="h-5 w-5" />
        <div>
          <p className="font-semibold">{t("inventory.inStock")}</p>
          <p className="text-sm">
            {product.stock_quantity} {t("inventory.unitsAvailable")}
          </p>
        </div>
      </div>
    );
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return t("productDetails.contactForPricing");
    return `${price.toLocaleString()} ${t("currency.symbol")}`;
  };

  const images = product.images || ["/placeholder.svg"];

  return (
    <div className="flex flex-col">
      {/* Breadcrumb */}
      <section className="border-b border-border bg-card py-4">
        <div className="container mx-auto px-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowIcon className="h-4 w-4" />
            {t("common.backToProducts")}
          </Link>
        </div>
      </section>

      {/* Product Details */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                <Image
                  src={images[0] || "/placeholder.svg"}
                  alt={productName}
                  fill
                  className="object-cover"
                  priority
                />
                {isOutOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Badge variant="destructive" className="text-lg px-4 py-2">
                      {t("inventory.outOfStock")}
                    </Badge>
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.slice(0, 4).map((image, i) => (
                    <div
                      key={i}
                      className="relative aspect-square overflow-hidden rounded-md bg-muted opacity-70 transition-opacity hover:opacity-100"
                    >
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`${productName} view ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{categoryName}</Badge>
                {product.material && (
                  <span className="text-sm text-muted-foreground">{product.material}</span>
                )}
                {product.is_featured && (
                  <Badge className="bg-accent text-accent-foreground">Featured</Badge>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl text-balance">
                {productName}
              </h1>

              {product.price ? (
                <p className="mt-4 text-3xl font-bold text-accent">
                  {formatPrice(product.price)}
                </p>
              ) : (
                <p className="mt-4 text-lg text-muted-foreground">
                  {t("productDetails.contactForPricing")}
                </p>
              )}

              {/* Stock Status */}
              <div className="mt-6">{getStockDisplay()}</div>

              <p className="mt-6 leading-relaxed text-muted-foreground">
                {productDescription}
              </p>

              {/* Specifications */}
              <div className="mt-8 space-y-4 rounded-lg bg-secondary p-6">
                <h3 className="font-semibold">{t("productDetails.technicalSpecs")}</h3>
                <div className="space-y-3">
                  {product.dimensions && (
                    <div className="flex items-start justify-between border-b border-border pb-3">
                      <span className="text-sm text-muted-foreground">
                        {t("productDetails.dimensions")}
                      </span>
                      <span className="text-sm font-medium">{product.dimensions}</span>
                    </div>
                  )}
                  {product.colors && product.colors.length > 0 && (
                    <div className="flex items-start justify-between border-b border-border pb-3">
                      <span className="text-sm text-muted-foreground">
                        {t("productDetails.availableColors")}
                      </span>
                      <div className="flex flex-wrap justify-end gap-1">
                        {product.colors.map((color) => (
                          <Badge key={color} variant="outline" className="text-xs">
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.insulation && (
                    <div className="flex items-start justify-between border-b border-border pb-3">
                      <span className="text-sm text-muted-foreground">
                        {t("productDetails.insulation")}
                      </span>
                      <span className="max-w-[60%] text-end text-sm font-medium">
                        {product.insulation}
                      </span>
                    </div>
                  )}
                  {product.material && (
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t("productDetails.material")}
                      </span>
                      <span className="text-sm font-medium">{product.material}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent" />
                  <span>{t("productDetails.professionalInstallation")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent" />
                  <span>{t("productDetails.warranty")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent" />
                  <span>{t("productDetails.customSizes")}</span>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {isOutOfStock ? (
                  <Button size="lg" className="flex-1" disabled>
                    {t("inventory.outOfStock")}
                  </Button>
                ) : (
                  <Link href={`/quote?product=${product.id}`} className="flex-1">
                    <Button size="lg" className="w-full">
                      {t("common.requestQuote")}
                    </Button>
                  </Link>
                )}
                <Link href="/contact" className="flex-1">
                  <Button size="lg" variant="outline" className="w-full bg-transparent">
                    {t("productDetails.askQuestion")}
                  </Button>
                </Link>
              </div>

              {isOutOfStock && (
                <p className="mt-4 text-sm text-muted-foreground text-center">
                  {t("inventory.notifyWhenAvailable")}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-border bg-secondary py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold tracking-tight">
              {t("productDetails.relatedProducts")}
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((relatedProduct) => {
                const relName = locale === "ar" ? relatedProduct.name_ar : relatedProduct.name_fr;
                const relImages = relatedProduct.images || [];
                return (
                  <Link key={relatedProduct.id} href={`/products/${relatedProduct.id}`}>
                    <Card className="group overflow-hidden border border-border transition-all hover:shadow-md">
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        <Image
                          src={relImages[0] || "/placeholder.svg"}
                          alt={relName}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {relatedProduct.stock_quantity === 0 && (
                          <Badge variant="destructive" className="absolute top-2 right-2">
                            {t("inventory.outOfStock")}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-accent">
                          {relatedProduct.material}
                        </p>
                        <h3 className="mt-1 font-semibold">{relName}</h3>
                        {relatedProduct.price && (
                          <p className="mt-2 font-bold">{formatPrice(relatedProduct.price)}</p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
