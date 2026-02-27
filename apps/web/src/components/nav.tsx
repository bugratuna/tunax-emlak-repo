import Link from "next/link";
import { Building2 } from "lucide-react";

export function Nav() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-4 py-3">
        <Link href="/listings" className="flex items-center gap-2 font-semibold text-zinc-900">
          <Building2 size={20} />
          AREP
        </Link>
        <nav className="flex items-center gap-6 text-sm text-zinc-600">
          <Link href="/listings" className="hover:text-zinc-900">
            Listings
          </Link>
          <Link href="/consultant/listings" className="hover:text-zinc-900">
            Consultant
          </Link>
          <Link href="/admin/moderation" className="hover:text-zinc-900">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
