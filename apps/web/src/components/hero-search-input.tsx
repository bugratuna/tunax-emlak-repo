"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { NeighborhoodCombobox } from "@/components/neighborhood-combobox";
import { NEIGHBORHOODS } from "@/lib/geo/antalya";

/** Returns the district for a given neighborhood, or null if not found. */
function findDistrict(neighborhood: string): string | null {
  for (const [district, neighborhoods] of Object.entries(NEIGHBORHOODS)) {
    if (
      neighborhoods.some(
        (n) => n.toLowerCase() === neighborhood.toLowerCase(),
      )
    ) {
      return district;
    }
  }
  return null;
}

export function HeroSearchInput() {
  const router = useRouter();
  const [neighborhood, setNeighborhood] = useState("");
  const [isValid, setIsValid] = useState(false);

  function handleSearch() {
    if (!isValid || !neighborhood) return;
    const district = findDistrict(neighborhood);
    const params = new URLSearchParams();
    params.set("neighborhood", neighborhood);
    if (district) params.set("district", district);
    router.push(`/listings?${params.toString()}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && isValid) handleSearch();
  }

  return (
    <div
      className="relative flex w-full max-w-lg flex-col gap-2 sm:flex-row"
      onKeyDown={handleKeyDown}
    >
      <div className="flex-1">
        <NeighborhoodCombobox
          value={neighborhood}
          onChange={setNeighborhood}
          onValidChange={setIsValid}
          placeholder="Mahalle seçin… (örn: Lara, Konyaaltı)"
        />
      </div>
      <button
        type="button"
        disabled={!isValid}
        onClick={handleSearch}
        title={isValid ? undefined : "Lütfen listeden bir mahalle seçin"}
        className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Search size={15} />
        Ara
      </button>
    </div>
  );
}
