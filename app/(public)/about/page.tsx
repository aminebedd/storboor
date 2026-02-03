"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { companyInfo } from "@/lib/company-config";
import { Award, Users, Calendar, Building2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const partners = ["Schüco", "Reynaers", "VEKA", "Kommerling", "Salamander", "Gealan"];

export default function AboutPage() {
  const { t } = useTranslation();

  const team = [
    {
      name: "James Mitchell",
      role: t("team.ceo"),
      image: "/images/team/team-1.jpg",
      bio: t("team.ceoBio"),
    },
    {
      name: "Sarah Williams",
      role: t("team.salesDirector"),
      image: "/images/team/team-2.jpg",
      bio: t("team.salesDirectorBio"),
    },
    {
      name: "Michael Rodriguez",
      role: t("team.technicalManager"),
      image: "/images/team/team-3.jpg",
      bio: t("team.technicalManagerBio"),
    },
    {
      name: "Emily Chen",
      role: t("team.designConsultant"),
      image: "/images/team/team-4.jpg",
      bio: t("team.designConsultantBio"),
    },
  ];

  const stats = [
    {
      icon: Calendar,
      value: `${new Date().getFullYear() - companyInfo.founded}+`,
      label: t("about.yearsExperience"),
    },
    { icon: Users, value: `${companyInfo.employees}+`, label: t("about.teamMembers") },
    {
      icon: Building2,
      value: `${(companyInfo.projectsCompleted / 1000).toFixed(0)}K+`,
      label: t("about.projectsCompleted"),
    },
    { icon: Award, value: "100%", label: t("about.qualityGuaranteed") },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{t("about.pageTitle")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
            {t("about.pageDescription")} {companyInfo.founded}
          </p>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t("about.ourStoryTitle")}</h2>
              <p className="mt-6 leading-relaxed text-muted-foreground">
                {t("about.ourStoryP1", { year: companyInfo.founded })}
              </p>
              <p className="mt-4 leading-relaxed text-muted-foreground">{t("about.ourStoryP2")}</p>
              <p className="mt-4 leading-relaxed text-muted-foreground">{t("about.ourStoryP3")}</p>
            </div>
            <div className="relative aspect-square overflow-hidden rounded-lg">
              <Image
                src="/images/about-workshop.jpg"
                alt="DoorWin Pro workshop and manufacturing facility"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <stat.icon className="h-6 w-6 text-accent" />
                </div>
                <p className="mt-4 text-4xl font-bold tracking-tight">{stat.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-0 bg-card shadow-sm">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold">{t("about.ourMission")}</h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">{t("about.ourMissionText")}</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card shadow-sm">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold">{t("about.ourVision")}</h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">{t("about.ourVisionText")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="bg-secondary py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t("about.meetTeamTitle")}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t("about.meetTeamDescription")}</p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <Card key={member.name} className="overflow-hidden border-0 bg-card shadow-sm">
                <div className="relative aspect-square overflow-hidden">
                  <Image src={member.image || "/placeholder.svg"} alt={member.name} fill className="object-cover" />
                </div>
                <CardContent className="p-5 text-center">
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="mt-1 text-sm text-accent">{member.role}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t("about.partnersTitle")}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t("about.partnersDescription")}</p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
            {partners.map((partner) => (
              <div
                key={partner}
                className="flex h-20 items-center justify-center rounded-lg bg-secondary px-6 text-lg font-semibold text-muted-foreground"
              >
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">{t("about.ctaTitle")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">{t("about.ctaDescription")}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/quote">
              <Button size="lg" variant="secondary" className="min-w-[180px]">
                {t("common.getQuote")}
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="min-w-[180px] border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                {t("common.contactUs")}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
