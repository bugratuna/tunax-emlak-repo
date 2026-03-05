"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api/client";

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          message: form.message.trim(),
        }),
      });
      setSuccess(true);
    } catch {
      setError("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-green-200 bg-green-50 p-10 text-center">
        <div className="text-4xl">✅</div>
        <h3 className="mt-4 text-lg font-semibold text-green-800">
          Mesajınız İletildi
        </h3>
        <p className="mt-2 text-sm text-green-700">
          En kısa sürede sizinle iletişime geçeceğiz. Teşekkür ederiz!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Adınız Soyadınız <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Ahmet Yılmaz"
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          E-posta <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="ahmet@example.com"
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Telefon (isteğe bağlı)
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+90 532 000 00 00"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Mesajınız <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={5}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Konyaaltı bölgesinde 3+1 daire arıyorum, bütçem ₺3.000.000..."
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-60 transition-colors"
      >
        {loading ? "Gönderiliyor..." : "Mesaj Gönder"}
      </button>

      <p className="text-xs text-zinc-400 text-center">
        Bilgileriniz üçüncü şahıslarla paylaşılmaz.
      </p>
    </form>
  );
}
