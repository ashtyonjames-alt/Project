import Link from "next/link";
import Emblem from "@/components/shared/Emblem";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-su-gray-50">
      <div className="text-center max-w-md">
        <Emblem size={80} className="mx-auto mb-6 opacity-40" />
        <h1 className="text-6xl font-bold text-su-navy mb-2">404</h1>
        <h2 className="text-xl font-semibold text-su-gray-700 mb-3">Page Not Found</h2>
        <p className="text-su-gray-500 mb-8">
          The page you are looking for could not be found. It may have been moved, removed, or the address entered was incorrect.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-su-blue text-white px-5 py-2.5 rounded font-medium hover:bg-su-blue-light transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
