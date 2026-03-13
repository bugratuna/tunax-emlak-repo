"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "grid" | "list";

export function ViewToggle({ current }: { current: ViewMode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setView(mode: ViewMode) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("viewMode", mode);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
      <button
        onClick={() => setView("grid")}
        aria-label="Kare görünüm"
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
          current === "grid"
            ? "bg-zinc-900 text-white"
            : "text-zinc-500 hover:text-zinc-800"
        }`}
      >
        <LayoutGrid size={14} />
        Kare
      </button>
      <button
        onClick={() => setView("list")}
        aria-label="Liste görünüm"
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
          current === "list"
            ? "bg-zinc-900 text-white"
            : "text-zinc-500 hover:text-zinc-800"
        }`}
      >
        <List size={14} />
        Liste
      </button>
    </div>
  );
}
