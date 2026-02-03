/**
 * Company Configuration
 * 
 * Static company information used across the site.
 * This replaces the mock data from lib/data.ts
 */

export const companyInfo = {
  name: "DoorWin Pro",
  slogan: "Premium Doors & Windows",
  founded: 2010,
  employees: 50,
  projectsCompleted: 5000,
  address: "Zone Industrielle, Lot 45",
  city: "Alger, Algérie",
  phone: "+213 555 123 456",
  email: "contact@doorwinpro.dz",
  hours: {
    weekdays: "Lundi - Vendredi: 8h00 - 18h00",
    saturday: "Samedi: 9h00 - 14h00",
    sunday: "Dimanche: Fermé",
  },
  social: {
    facebook: "https://facebook.com/doorwinpro",
    instagram: "https://instagram.com/doorwinpro",
    linkedin: "https://linkedin.com/company/doorwinpro",
    twitter: "https://twitter.com/doorwinpro",
  },
};

export type CompanyInfo = typeof companyInfo;
