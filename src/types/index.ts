export interface Citizen {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  district: string;
  status: "active" | "inactive" | "pending";
  registrationDate: string;
}

export interface NewsArticle {
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: "announcement" | "policy" | "international" | "domestic";
  publishedAt: string;
  author: string;
}

export interface Law {
  id: string;
  title: string;
  shortTitle: string;
  summary: string;
  fullText: string;
  category: "constitutional" | "civil" | "criminal" | "administrative" | "economic";
  status: "active" | "repealed" | "amended" | "proposed";
  enactedDate: string;
  lastAmended?: string;
}

export interface GovernmentService {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  category: "finance" | "civic" | "legal" | "social";
}

export interface Leader {
  name: string;
  title: string;
  role: string;
  bio: string;
  termStart: string;
  termEnd?: string;
}

export interface Document {
  id: string;
  type: "passport" | "id-card" | "birth-certificate" | "tax-record" | "permit";
  title: string;
  issuedDate: string;
  expiryDate?: string;
  status: "valid" | "expired" | "pending";
}

export interface NavigationItem {
  label: string;
  href: string;
  children?: NavigationItem[];
}
