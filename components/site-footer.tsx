"use client";

import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { companyInfo } from "@/lib/company-config";
import { useTranslation } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useTranslation();

  const footerLinks = {
    company: [
      { name: t("footer.aboutUs"), href: "/about" },
      { name: t("footer.ourTeam"), href: "/about#team" },
      { name: t("footer.careers"), href: "/contact" },
    ],
    products: [
      { name: t("footer.aluminumDoors"), href: "/products?category=doors" },
      { name: t("footer.pvcWindows"), href: "/products?category=windows" },
      { name: t("footer.slidingSystems"), href: "/products?category=sliding" },
    ],
    support: [
      { name: t("common.contactUs"), href: "/contact" },
      { name: t("common.requestQuote"), href: "/quote" },
      { name: t("footer.faq"), href: "/contact" },
    ],
  };

  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary-foreground">
                <span className="text-sm font-bold text-primary">D</span>
              </div>
              <span className="text-lg font-semibold tracking-tight">{companyInfo.name}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-primary-foreground/70">
              {t("footer.footerDescription")} {companyInfo.founded}.
            </p>
            <div className="mt-6 flex gap-4">
              <a
                href={companyInfo.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href={companyInfo.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={companyInfo.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href={companyInfo.social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">{t("footer.company")}</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">{t("footer.products")}</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.products.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">{t("contact.contactInfoTitle")}</h3>
            <ul className="mt-4 space-y-3 text-sm text-primary-foreground/70">
              <li>{companyInfo.address}</li>
              <li>{companyInfo.city}</li>
              <li>{companyInfo.phone}</li>
              <li>{companyInfo.email}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-primary-foreground/10 pt-8">
          <p className="text-center text-sm text-primary-foreground/60">
            &copy; {new Date().getFullYear()} {companyInfo.name}. {t("common.allRightsReserved")}.
          </p>
        </div>
      </div>
    </footer>
  );
}
