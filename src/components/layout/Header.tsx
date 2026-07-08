import Link from "next/link";
import Emblem from "@/components/shared/Emblem";
import Navigation from "./Navigation";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export default function Header() {
  return (
    <header className="bg-white sticky top-0 z-40 shadow-sm">
      {/* Gold accent bar */}
      <div className="h-1 bg-su-gold" />

      {/* Main header bar */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between relative">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Emblem size={36} />
          <div className="leading-tight">
            <div className="font-bold text-su-navy text-base tracking-wide">{SITE_NAME}</div>
            <div className="text-xs text-su-gray-500 hidden sm:block">{SITE_TAGLINE}</div>
          </div>
        </Link>

        <Navigation />
      </div>

      {/* Bottom border */}
      <div className="h-px bg-su-gray-100" />
    </header>
  );
}
