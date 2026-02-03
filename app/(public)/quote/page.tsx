"use client";

/**
 * Quote Request Page
 * Allows customers to request quotes for products
 * Uses real product data from Supabase
 */

import React from "react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Product {
  id: string;
  name_fr: string;
  name_ar: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function QuoteForm() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");
  const { t, locale, isRTL } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(productId || "");
  const [error, setError] = useState<string | null>(null);

  // Fetch products from Supabase
  const { data: productsData, isLoading: productsLoading } = useSWR<{
    success: boolean;
    data: Product[];
  }>("/api/products", fetcher);

  const products = productsData?.data || [];

  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  useEffect(() => {
    if (productId) {
      setSelectedProduct(productId);
    }
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    try {
      // Submit quote request to API
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.get("fullName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          product_id: selectedProduct !== "custom" ? selectedProduct : null,
          dimensions: formData.get("dimensions"),
          quantity: Number(formData.get("quantity")) || 1,
          notes: formData.get("notes"),
          is_custom_request: selectedProduct === "custom",
        }),
      });

      if (!response.ok) {
        throw new Error(t("quote.submitError"));
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("quote.submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
            <h2 className="mt-6 text-2xl font-bold">{t("quote.quoteSubmitted")}</h2>
            <p className="mt-4 text-muted-foreground">{t("quote.quoteSubmittedDescription")}</p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button onClick={() => setIsSubmitted(false)}>{t("quote.requestAnother")}</Button>
              <Link href="/products">
                <Button variant="outline" className="bg-transparent">{t("quote.browseProducts")}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowIcon className="h-4 w-4" />
            {t("common.backToProducts")}
          </Link>

          <h2 className="mt-8 text-2xl font-bold">{t("quote.formTitle")}</h2>
          <p className="mt-2 text-muted-foreground">{t("quote.formDescription")}</p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t("quote.personalInfo")}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("quote.fullName")} *</Label>
                  <Input id="fullName" name="fullName" placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("contact.phone")} *</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="+213 555 000 000" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("contact.email")} *</Label>
                <Input id="email" name="email" type="email" placeholder="john@example.com" required />
              </div>
            </div>

            {/* Product Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t("quote.productInfo")}</h3>
              <div className="space-y-2">
                <Label htmlFor="productType">{t("quote.productType")} *</Label>
                {productsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={selectedProduct} onValueChange={setSelectedProduct} required>
                    <SelectTrigger>
                      <SelectValue placeholder={t("quote.selectProduct")} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {locale === "ar" ? product.name_ar : product.name_fr}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">{t("quote.customRequest")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dimensions">{t("quote.dimensions")}</Label>
                  <Input id="dimensions" name="dimensions" placeholder={t("quote.dimensionsPlaceholder")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">{t("quote.quantity")} *</Label>
                  <Input id="quantity" name="quantity" type="number" min="1" defaultValue="1" required />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t("quote.additionalInfo")}</h3>
              <div className="space-y-2">
                <Label htmlFor="notes">{t("quote.additionalNotes")}</Label>
                <Textarea id="notes" name="notes" placeholder={t("quote.additionalNotesPlaceholder")} rows={5} />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.submitting")}
                  </>
                ) : (
                  t("quote.submitQuoteRequest")
                )}
              </Button>
              <p className="mt-4 text-center text-sm text-muted-foreground">{t("quote.formDisclaimer")}</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function QuotePage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{t("quote.pageTitle")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">{t("quote.pageDescription")}</p>
        </div>
      </section>

      <Suspense fallback={<div className="py-20 text-center">{t("common.loading")}</div>}>
        <QuoteForm />
      </Suspense>
    </div>
  );
}
