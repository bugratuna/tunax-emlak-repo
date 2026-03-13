"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const SORT_OPTIONS = [
  { value: "newest", label: "En Yeni" },
  { value: "oldest", label: "En Eski" },
  { value: "price_asc", label: "Fiyat ↑" },
  { value: "price_desc", label: "Fiyat ↓" },
] as const;

export function SortSelect({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    const val = e.target.value;
    if (val === "newest") params.delete("sortBy");
    else params.set("sortBy", val);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100 cursor-pointer"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
