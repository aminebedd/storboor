"use client";

import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { companyInfo } from "@/lib/company-config";
import { MapPin, Phone, Mail, Clock, CheckCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function ContactPage() {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col">
        <section className="bg-primary py-16 text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{t("contact.pageTitle")}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">{t("contact.pageDescription")}</p>
          </div>
        </section>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                <CheckCircle className="h-8 w-8 text-accent" />
              </div>
              <h2 className="mt-6 text-2xl font-bold">{t("contact.messageSent")}</h2>
              <p className="mt-4 text-muted-foreground">{t("contact.messageSentDescription")}</p>
              <Button className="mt-8" onClick={() => setIsSubmitted(false)}>
                {t("contact.sendAnother")}
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{t("contact.pageTitle")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">{t("contact.pageDescription")}</p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold">{t("contact.sendMessageTitle")}</h2>
              <p className="mt-2 text-muted-foreground">{t("contact.sendMessageDescription")}</p>
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t("contact.firstName")}</Label>
                    <Input id="firstName" placeholder="John" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t("contact.lastName")}</Label>
                    <Input id="lastName" placeholder="Doe" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("contact.email")}</Label>
                  <Input id="email" type="email" placeholder="john@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("contact.phone")}</Label>
                  <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">{t("contact.subject")}</Label>
                  <Input id="subject" placeholder={t("contact.subjectPlaceholder")} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t("contact.message")}</Label>
                  <Textarea id="message" placeholder={t("contact.messagePlaceholder")} rows={5} required />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t("common.sending") : t("common.sendMessage")}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold">{t("contact.contactInfoTitle")}</h2>
                <p className="mt-2 text-muted-foreground">{t("contact.contactInfoDescription")}</p>
              </div>

              <div className="space-y-6">
                <Card className="border-0 bg-secondary shadow-sm">
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                      <MapPin className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{t("contact.address")}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {companyInfo.address}
                        <br />
                        {companyInfo.city}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-secondary shadow-sm">
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                      <Phone className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{t("contact.phone")}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{companyInfo.phone}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-secondary shadow-sm">
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                      <Mail className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{t("contact.email")}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{companyInfo.email}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-secondary shadow-sm">
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                      <Clock className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{t("contact.workingHours")}</h3>
                      <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                        <p>{companyInfo.hours.weekdays}</p>
                        <p>{companyInfo.hours.saturday}</p>
                        <p>{companyInfo.hours.sunday}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="border-t border-border">
        <div className="h-[400px] w-full bg-muted">
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">Google Maps Integration</p>
              <p className="text-sm text-muted-foreground">
                {companyInfo.address}, {companyInfo.city}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
