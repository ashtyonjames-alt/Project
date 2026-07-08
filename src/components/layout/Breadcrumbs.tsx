"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const labels: Record<string, string> = {
  citizen: "Citizen Portal",
  lookup: "ID Lookup",
  register: "Register",
  documents: "My Documents",
  news: "News & Laws",
  laws: "Legislation",
  services: "Services",
  "tax-filing": "Tax Filing",
  permits: "Permits",
  voting: "Voting",
  about: "About",
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = [{ label: "Home", href: "/" }];

  segments.forEach((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = labels[seg] ?? seg;
    crumbs.push({ label, href });
  });

  return (
    <nav className="bg-su-gray-50 border-b border-su-gray-100 px-4 py-2">
      <ol className="max-w-7xl mx-auto flex items-center gap-1 text-xs text-su-gray-500 flex-wrap">
        {crumbs.map((crumb, i) => (
          <li key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <span>›</span>}
            {i < crumbs.length - 1 ? (
              <Link href={crumb.href} className="hover:text-su-blue transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-su-gray-700 font-medium">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
