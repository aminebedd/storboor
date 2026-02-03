"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { companyInfo } from "@/lib/company-config";
import { Building2, Phone, Lock, Palette, Check } from "lucide-react";

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState("blue");

  const handleSave = async (section: string) => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSavedSection(section);
    setTimeout(() => setSavedSection(null), 3000);
  };

  const colorOptions = [
    { name: "Blue", value: "blue", class: "bg-blue-500" },
    { name: "Green", value: "green", class: "bg-green-500" },
    { name: "Orange", value: "orange", class: "bg-orange-500" },
    { name: "Red", value: "red", class: "bg-red-500" },
    { name: "Purple", value: "purple", class: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your company settings and preferences</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-2">
            <Phone className="h-4 w-4" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-2">
            <Lock className="h-4 w-4" />
            Password
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Company Info Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update your company details and branding information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave("company");
                }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" defaultValue={companyInfo.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input id="tagline" defaultValue={companyInfo.tagline} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="about">About the Company</Label>
                  <Textarea
                    id="about"
                    rows={4}
                    defaultValue="Premium doors and windows for modern homes. Quality craftsmanship since 2008."
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  {savedSection === "company" && (
                    <span className="flex items-center gap-2 text-sm text-accent">
                      <Check className="h-4 w-4" /> Saved successfully
                    </span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Info Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Update your contact details and working hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave("contact");
                }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" defaultValue={companyInfo.phone} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue={companyInfo.email} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input id="address" defaultValue={companyInfo.address} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City, State, ZIP</Label>
                  <Input id="city" defaultValue={companyInfo.city} />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="weekdays">Weekday Hours</Label>
                    <Input id="weekdays" defaultValue="8:00 AM - 6:00 PM" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saturday">Saturday Hours</Label>
                    <Input id="saturday" defaultValue="9:00 AM - 4:00 PM" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sunday">Sunday Hours</Label>
                    <Input id="sunday" defaultValue="Closed" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  {savedSection === "contact" && (
                    <span className="flex items-center gap-2 text-sm text-accent">
                      <Check className="h-4 w-4" /> Saved successfully
                    </span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your admin account password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave("password");
                }}
                className="max-w-md space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Updating..." : "Update Password"}
                  </Button>
                  {savedSection === "password" && (
                    <span className="flex items-center gap-2 text-sm text-accent">
                      <Check className="h-4 w-4" /> Password updated
                    </span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>
                Customize the appearance of your admin dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave("appearance");
                }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <Label>Accent Color</Label>
                  <div className="flex flex-wrap gap-3">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setSelectedColor(color.value)}
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${color.class} transition-all ${
                          selectedColor === color.value
                            ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                            : "opacity-70 hover:opacity-100"
                        }`}
                        title={color.name}
                      >
                        {selectedColor === color.value && (
                          <Check className="h-5 w-5 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  {savedSection === "appearance" && (
                    <span className="flex items-center gap-2 text-sm text-accent">
                      <Check className="h-4 w-4" /> Theme updated
                    </span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
