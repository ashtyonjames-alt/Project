import type { NavigationItem } from "@/types";

export const navigation: NavigationItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Citizen Portal",
    href: "/citizen",
    children: [
      { label: "ID Lookup", href: "/citizen/lookup" },
      { label: "Register", href: "/citizen/register" },
      { label: "My Documents", href: "/citizen/documents" },
    ],
  },
  {
    label: "News & Laws",
    href: "/news",
    children: [
      { label: "Latest News", href: "/news" },
      { label: "Legislation", href: "/news/laws" },
    ],
  },
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "Tax Filing", href: "/services/tax-filing" },
      { label: "Permits", href: "/services/permits" },
      { label: "Voting", href: "/services/voting" },
    ],
  },
  { label: "About", href: "/about" },
];
