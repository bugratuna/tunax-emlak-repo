"use client";

import { useState } from "react";
import { createLead } from "@/lib/api/leads";
import { ApiErrorMessage } from "@/components/api-error-message";
import { ApiRequestError } from "@/lib/api/client";
import type { LeadChannel } from "@/lib/types";

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

const CHANNEL_LABELS: Record<LeadChannel, string> = {
  FORM: "Form",
  WHATSAPP: "WhatsApp",
  CALL: "Telefon",
};

export function LeadInquiryForm({ listingId }: { listingId: string }) {
  const [channel, setChannel] = useState<LeadChannel>("FORM");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Ad Soyad zorunludur.";
    if (!phone.trim()) e.phone = "Telefon numarası zorunludur.";
    else if (!E164_REGEX.test(phone.trim()))
      e.phone = "Telefon numarası E.164 formatında olmalıdır (örn. +905551234567).";
    if (!consent) e.consent = "Devam etmek için onay vermeniz gerekmektedir.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await createLead({
        idempotencyKey: `lead-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        listingId,
        channel,
        name: name.trim(),
        phone: phone.trim(),
        message: message.trim() || undefined,
        preferredTime: preferredTime.trim() || undefined,
        consentGiven: true,
      });
      setSuccess(true);
      setName(""); setPhone(""); setMessage(""); setPreferredTime("");
      setConsent(false); setChannel("FORM");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const msg = Array.isArray(err.body.message)
          ? err.body.message.join(", ")
          : err.body.message;
        setApiError(msg);
      } else {
        setApiError("Sunucuya ulaşılamıyor.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-6 text-center">
        <p className="font-medium text-green-800">Mesajınız iletildi!</p>
        <p className="mt-1 text-sm text-green-600">
          En kısa sürede sizinle iletişime geçeceğiz.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-sm text-green-700 underline"
        >
          Yeni mesaj gönder
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Kanal */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          İletişim yöntemi
        </label>
        <div className="flex gap-2">
          {(["FORM", "WHATSAPP", "CALL"] as LeadChannel[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                channel === c
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {CHANNEL_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Ad Soyad */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Ad Soyad <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      {/* Telefon */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Telefon (E.164) <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          placeholder="+905551234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
      </div>

      {/* Mesaj */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Mesaj
        </label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="İhtiyaçlarınızı veya sorularınızı belirtin…"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>

      {/* Tercih edilen iletişim saati */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Tercih edilen iletişim saati
        </label>
        <input
          type="text"
          placeholder="örn. Salı sabahı 10:00"
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>

      {/* Onay */}
      <label className="flex items-start gap-2 text-sm text-zinc-600">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 rounded border-zinc-300"
        />
        <span>
          İletişim bilgilerimin bu talep kapsamında işlenmesine onay veriyorum.
          <span className="text-red-500"> *</span>
        </span>
      </label>
      {errors.consent && (
        <p className="text-xs text-red-600">{errors.consent}</p>
      )}

      {apiError && <ApiErrorMessage error={apiError} />}

      <button
        type="submit"
        disabled={loading || !consent}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {loading ? "Gönderiliyor…" : "Mesaj Gönder"}
      </button>
    </form>
  );
}
