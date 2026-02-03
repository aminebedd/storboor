"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AuthErrorPage() {
  const { t, dir } = useTranslation();

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-muted/30 p-4"
      dir={dir}
    >
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>
            {dir === "rtl" ? "خطأ في المصادقة" : "Erreur d'authentification"}
          </CardTitle>
          <CardDescription>
            {dir === "rtl"
              ? "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى."
              : "Une erreur s'est produite lors de la connexion. Veuillez réessayer."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/admin/login">
              <ArrowLeft className="h-4 w-4 me-2" />
              {dir === "rtl" ? "العودة لتسجيل الدخول" : "Retour à la connexion"}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
