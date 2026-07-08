"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/data/navigation";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-1">
        {navigation.map((item) => (
          <div key={item.href} className="relative group">
            <Link
              href={item.href}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded transition-colors",
                pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                  ? "text-su-blue bg-su-blue-pale"
                  : "text-su-gray-700 hover:text-su-blue hover:bg-su-gray-50"
              )}
            >
              {item.label}
              {item.children && <span className="ml-1 text-xs">▾</span>}
            </Link>
            {item.children && (
              <div className="absolute top-full left-0 hidden group-hover:block bg-white border border-su-gray-100 rounded-lg shadow-card-hover min-w-[180px] py-1 z-50">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className="block px-4 py-2 text-sm text-su-gray-700 hover:bg-su-blue-pale hover:text-su-blue"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Mobile hamburger */}
      <button
        className="md:hidden p-2 text-su-gray-700 hover:text-su-blue"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        <div className="w-6 h-0.5 bg-current mb-1.5" />
        <div className="w-6 h-0.5 bg-current mb-1.5" />
        <div className="w-6 h-0.5 bg-current" />
      </button>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-su-gray-100 shadow-card-hover z-50">
          {navigation.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                className="block px-4 py-3 text-sm font-medium text-su-gray-900 border-b border-su-gray-50 hover:bg-su-blue-pale hover:text-su-blue"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
              {item.children?.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block px-8 py-2.5 text-sm text-su-gray-500 border-b border-su-gray-50 hover:bg-su-blue-pale hover:text-su-blue"
                  onClick={() => setOpen(false)}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
