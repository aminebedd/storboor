"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DoorOpen,
  Layers,
  Wrench,
  HeadphonesIcon,
  ArrowRight,
  ArrowLeft,
  Quote,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

// Testimonials data (in production, this would come from database)
const testimonials = [
  {
    id: 1,
    contentAr:
      "أبواب ذات جودة ممتازة وخدمة تركيب احترافية. كان الفريق دقيقًا في المواعيد والعمل كان لا تشوبه شائبة. أوصي بهم بشدة!",
    contentFr:
      "Portes de qualité excellente et service d'installation professionnel. L'équipe était ponctuelle et le travail impeccable. Hautement recommandé!",
    avatar: "A",
    name: "Ahmed Benali",
    role: "Propriétaire / صاحب منزل",
  },
  {
    id: 2,
    contentAr:
      "نعمل مع DoorWin Pro في مشاريع البناء الخاصة بنا منذ 3 سنوات. شريك موثوق بجودة ثابتة.",
    contentFr:
      "Nous travaillons avec DoorWin Pro pour nos projets de construction depuis 3 ans. Partenaire fiable avec une qualité constante.",
    avatar: "F",
    name: "Fatima Mansouri",
    role: "Architecte / مهندسة معمارية",
  },
  {
    id: 3,
    contentAr:
      "حولت نوافذ PVC كفاءة منزلنا في استهلاك الطاقة. فرق ملحوظ في فواتير التدفئة وتقليل الضوضاء.",
    contentFr:
      "Les fenêtres PVC ont transformé l'efficacité énergétique de notre maison. Différence notable sur les factures de chauffage et réduction du bruit.",
    avatar: "K",
    name: "Karim Hadj",
    role: "Constructeur / بنّاء",
  },
];

interface Product {
  id: string;
  name_fr: string;
  name_ar: string;
  description_fr: string | null;
  description_ar: string | null;
  price: number | null;
  stock_quantity: number;
  material: string | null;
  images: string[] | null;
  category: {
    id: string;
    name_fr: string;
    name_ar: string;
    slug: string;
  } | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HomePage() {
  const { t, locale, isRTL } = useTranslation();
  const { data: productsData, isLoading } = useSWR<{ success: boolean; data: Product[] }>(
    "/api/products",
    fetcher
  );

  const products = productsData?.data || [];
  const featuredProducts = products.slice(0, 4);

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const services = [
    {
      icon: DoorOpen,
      title: t("services.customDoors"),
      description: t("services.customDoorsDesc"),
    },
    {
      icon: Layers,
      title: t("services.premiumWindows"),
      description: t("services.premiumWindowsDesc"),
    },
    {
      icon: Wrench,
      title: t("services.installation"),
      description: t("services.installationDesc"),
    },
    {
      icon: HeadphonesIcon,
      title: t("services.support"),
      description: t("services.supportDesc"),
    },
  ];

  const whyChooseUs = [
    {
      number: "01",
      title: t("whyChooseUs.quality"),
      description: t("whyChooseUs.qualityDesc"),
    },
    {
      number: "02",
      title: t("whyChooseUs.experience"),
      description: t("whyChooseUs.experienceDesc"),
    },
    {
      number: "03",
      title: t("whyChooseUs.warranty"),
      description: t("whyChooseUs.warrantyDesc"),
    },
    {
      number: "04",
      title: t("whyChooseUs.pricing"),
      description: t("whyChooseUs.pricingDesc"),
    },
  ];

  const formatPrice = (price: number | null) => {
    if (price === null) return t("common.requestPrice");
    return `${price.toLocaleString()} ${t("currency.symbol")}`;
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-primary">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-doors.jpg"
            alt="Modern home with premium doors and windows"
            fill
            className="object-cover opacity-30"
            priority
          />
        </div>
        <div className="container relative z-10 mx-auto px-4 py-20 text-center">
          <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
            {t("home.heroTitle")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-primary-foreground/80 md:text-xl">
            {t("home.heroDescription")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/quote">
              <Button size="lg" variant="secondary" className="min-w-[180px]">
                {t("common.requestQuote")}
              </Button>
            </Link>
            <Link href="/products">
              <Button
                size="lg"
                variant="outline"
                className="min-w-[180px] border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                {t("common.viewProducts")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              {t("home.servicesTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              {t("home.servicesDescription")}
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card
                  key={service.title}
                  className="border-0 bg-card shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                      <Icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{service.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="bg-secondary py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                {t("home.featuredProductsTitle")}
              </h2>
              <p className="mt-4 text-muted-foreground">
                {t("home.featuredProductsDescription")}
              </p>
            </div>
            <Link href="/products" className="hidden md:block">
              <Button variant="outline" className="gap-2 bg-transparent">
                {t("common.viewAll")} <ArrowIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden border-0 bg-card shadow-sm">
                    <Skeleton className="aspect-square" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="mt-2 h-5 w-full" />
                      <Skeleton className="mt-2 h-4 w-3/4" />
                      <Skeleton className="mt-3 h-6 w-24" />
                    </CardContent>
                  </Card>
                ))
              : featuredProducts.map((product) => {
                  const productName =
                    locale === "ar" ? product.name_ar : product.name_fr;
                  const productDescription =
                    locale === "ar"
                      ? product.description_ar
                      : product.description_fr;
                  const isOutOfStock = product.stock_quantity === 0;

                  return (
                    <Link key={product.id} href={`/products/${product.id}`}>
                      <Card className="group overflow-hidden border-0 bg-card shadow-sm transition-all hover:shadow-md">
                        <div className="relative aspect-square overflow-hidden bg-muted">
                          <Image
                            src={product.images?.[0] || "/placeholder.svg"}
                            alt={productName}
                            fill
                            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                              isOutOfStock ? "opacity-50" : ""
                            }`}
                          />
                          {isOutOfStock && (
                            <Badge
                              variant="destructive"
                              className="absolute top-2 right-2"
                            >
                              {t("inventory.outOfStock")}
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <p className="text-xs font-medium uppercase tracking-wider text-accent">
                            {product.material}
                          </p>
                          <h3 className="mt-1 font-semibold text-foreground line-clamp-1">
                            {productName}
                          </h3>
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {productDescription}
                          </p>
                          <p className="mt-3 text-lg font-bold">
                            {formatPrice(product.price)}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/products">
              <Button variant="outline" className="gap-2 bg-transparent">
                {t("common.viewAllProducts")} <ArrowIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              {t("home.whyChooseUsTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              {t("home.whyChooseUsDescription")}
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {whyChooseUs.map((item) => (
              <div key={item.number} className="relative">
                <span className="text-6xl font-bold text-border">{item.number}</span>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              {t("home.testimonialsTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/70">
              {t("home.testimonialsDescription")}
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => {
              const content =
                locale === "ar" ? testimonial.contentAr : testimonial.contentFr;

              return (
                <Card
                  key={testimonial.id}
                  className="border-0 bg-primary-foreground/10 text-primary-foreground"
                >
                  <CardContent className="p-6">
                    <Quote className="h-8 w-8 text-primary-foreground/30" />
                    <p className="mt-4 text-primary-foreground/90">{content}</p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20 text-sm font-semibold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-primary-foreground/70">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("home.ctaTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t("home.ctaDescription")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/quote">
              <Button size="lg" className="min-w-[180px]">
                {t("common.getFreeQuote")}
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="min-w-[180px] bg-transparent">
                {t("common.contactUs")}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
