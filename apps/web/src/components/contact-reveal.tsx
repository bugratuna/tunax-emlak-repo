"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { getListingContact } from "@/lib/api/listings";

interface ContactRevealProps {
  listingId: string;
  consultantName: string;
}

export function ContactReveal({ listingId, consultantName }: ContactRevealProps) {
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  async function reveal() {
    if (revealed) return;
    setLoading(true);
    try {
      const data = await getListingContact(listingId);
      setPhone(data.phone);
      setRevealed(true);
    } catch {
      setPhone(null);
      setRevealed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Danışman
      </h2>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
          {consultantName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-800">
            {consultantName}
          </p>
          <p className="text-xs text-zinc-400">Gayrimenkul Danışmanı</p>
        </div>
      </div>

      <div className="mt-4">
        {revealed ? (
          phone ? (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100 transition-colors"
            >
              <Phone size={15} />
              {phone}
            </a>
          ) : (
            <p className="text-xs text-zinc-400">Telefon numarası mevcut değil.</p>
          )
        ) : (
          <button
            onClick={reveal}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-60"
          >
            <Phone size={15} />
            {loading ? "Yükleniyor…" : "Telefon Numarasını Gör"}
          </button>
        )}
      </div>
    </div>
  );
}
