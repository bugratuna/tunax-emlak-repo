"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const DISTRICTS = [
  "Muratpaşa", "Kepez", "Konyaaltı", "Döşemealtı", "Aksu",
  "Alanya", "Manavgat", "Serik", "Kemer", "Kumluca",
  "Finike", "Kaş", "Demre", "Elmalı", "Korkuteli",
  "Akseki", "Gündoğmuş", "İbradı", "Gazipaşa",
];

export function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push("?" + params.toString());
    },
    [router, searchParams],
  );

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Filtreler
        </h2>

        <div className="space-y-5 text-sm">
          {/* Kategori */}
          <fieldset>
            <legend className="mb-2 font-medium text-zinc-700">Kategori</legend>
            <div className="space-y-1">
              {[
                { value: "", label: "Tümü" },
                { value: "SALE", label: "Satılık" },
                { value: "RENT", label: "Kiralık" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 text-zinc-600 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="category"
                    value={opt.value}
                    checked={(searchParams.get("category") ?? "") === opt.value}
                    onChange={() => update("category", opt.value)}
                    className="border-zinc-300"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* İlçe */}
          <fieldset>
            <legend className="mb-2 font-medium text-zinc-700">İlçe</legend>
            <select
              value={searchParams.get("district") ?? ""}
              onChange={(e) => update("district", e.target.value)}
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="">Tüm ilçeler</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </fieldset>

          {/* Fiyat Aralığı */}
          <fieldset>
            <legend className="mb-2 font-medium text-zinc-700">
              Fiyat Aralığı (TRY)
            </legend>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={searchParams.get("minPrice") ?? ""}
                onChange={(e) => update("minPrice", e.target.value)}
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
              <span className="text-zinc-400">–</span>
              <input
                type="number"
                placeholder="Max"
                value={searchParams.get("maxPrice") ?? ""}
                onChange={(e) => update("maxPrice", e.target.value)}
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </fieldset>

          {/* Min Oda */}
          <fieldset>
            <legend className="mb-2 font-medium text-zinc-700">Min Oda Sayısı</legend>
            <input
              type="number"
              min={0}
              max={20}
              placeholder="Örn: 2"
              value={searchParams.get("rooms") ?? ""}
              onChange={(e) => update("rooms", e.target.value)}
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </fieldset>

          {/* Balkon */}
          <fieldset>
            <legend className="mb-2 font-medium text-zinc-700">Özellikler</legend>
            <label className="flex items-center gap-2 text-zinc-600 cursor-pointer">
              <input
                type="checkbox"
                checked={searchParams.get("balcony") === "true"}
                onChange={(e) =>
                  update("balcony", e.target.checked ? "true" : "")
                }
                className="rounded border-zinc-300"
              />
              Balkon
            </label>
          </fieldset>

          {/* Filtreleri sıfırla */}
          {searchParams.toString() !== "" && (
            <button
              type="button"
              onClick={() => router.push("?")}
              className="w-full rounded border border-zinc-200 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50"
            >
              Filtreleri sıfırla
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
