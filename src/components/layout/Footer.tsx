import Link from "next/link";
import Emblem from "@/components/shared/Emblem";
import { SITE_NAME, SITE_MOTTO, CONTACT } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-su-navy text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Column 1: Brand */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Emblem size={40} />
            <div>
              <div className="font-bold text-white">{SITE_NAME}</div>
              <div className="text-xs text-su-gold italic">{SITE_MOTTO}</div>
            </div>
          </div>
          <p className="text-blue-200 text-sm leading-relaxed">
            The official digital portal of the federal government of the Slavakian Union.
          </p>
        </div>

        {/* Column 2: Quick links */}
        <div>
          <h3 className="font-semibold text-su-gold mb-3 text-sm uppercase tracking-wide">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            {[
              { label: "Citizen Portal", href: "/citizen" },
              { label: "News & Laws", href: "/news" },
              { label: "Government Services", href: "/services" },
              { label: "About the Slavakian Union", href: "/about" },
              { label: "Legislation Browser", href: "/news/laws" },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-blue-200 hover:text-white transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Contact */}
        <div>
          <h3 className="font-semibold text-su-gold mb-3 text-sm uppercase tracking-wide">Contact</h3>
          <address className="not-italic text-sm text-blue-200 space-y-2">
            <p>{CONTACT.address}</p>
            <p>
              <a href={`tel:${CONTACT.phone}`} className="hover:text-white transition-colors">
                {CONTACT.phone}
              </a>
            </p>
            <p>
              <a href={`mailto:${CONTACT.email}`} className="hover:text-white transition-colors">
                {CONTACT.email}
              </a>
            </p>
          </address>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-blue-300">
            © {new Date().getFullYear()} Government of the {SITE_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-blue-300">
            This is a fictional government portal for creative purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
