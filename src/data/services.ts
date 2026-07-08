import type { GovernmentService } from "@/types";

export const services: GovernmentService[] = [
  { id: "tax-filing", name: "Tax Filing", description: "File your annual personal income tax return, view past filings, and calculate estimated tax liability.", icon: "💰", href: "/services/tax-filing", category: "finance" },
  { id: "permits", name: "Permit Applications", description: "Apply for building permits, business licences, event authorisations, and other official permits.", icon: "📋", href: "/services/permits", category: "legal" },
  { id: "voting", name: "Voting & Elections", description: "Check your electoral registration, find your polling station, and view upcoming election schedules.", icon: "🗳️", href: "/services/voting", category: "civic" },
  { id: "citizen-register", name: "Citizen Registration", description: "Register as a new citizen or update your personal information in the national citizen database.", icon: "🪪", href: "/citizen/register", category: "civic" },
  { id: "document-lookup", name: "Document Services", description: "Request official copies of your birth certificate, passport, and other government-issued documents.", icon: "📄", href: "/citizen/documents", category: "legal" },
  { id: "social-support", name: "Social Support", description: "Apply for housing assistance, unemployment benefits, and family welfare programmes.", icon: "🤝", href: "/services/social-support", category: "social" },
  { id: "health-registration", name: "Health Service Registration", description: "Register with the Slavakian National Health Service and find your nearest clinic or GP practice.", icon: "🏥", href: "/services/health", category: "social" },
  { id: "business-registration", name: "Business Registration", description: "Register a new business, update company details, or file annual returns with the Business Registry.", icon: "🏢", href: "/services/business", category: "finance" },
];
