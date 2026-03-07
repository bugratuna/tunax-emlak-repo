"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/** Matches RT-XXXXXX listing number patterns (1–6 digits). */
const LISTING_NUMBER_RE = /^RT-\d{1,6}$/i;

export function HeroSearchInput() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function navigate(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    // Listing number exact match → uppercase before sending so backend UPPER compare works
    const param = LISTING_NUMBER_RE.test(trimmed)
      ? trimmed.toUpperCase()
      : trimmed;
    router.push(`/listings?search=${encodeURIComponent(param)}`);
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    navigate(value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") navigate(value);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex w-full max-w-lg items-stretch overflow-hidden rounded-xl bg-white shadow-lg"
    >
      <div className="flex flex-1 items-center gap-2 px-4 py-3">
        <Search size={16} className="shrink-0 text-zinc-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="İlan No, başlık veya konum… (örn: RT-000124)"
          className="flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <button
        type="submit"
        disabled={!value.trim()}
        className="shrink-0 bg-amber-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Ara
      </button>
    </form>
  );
}
