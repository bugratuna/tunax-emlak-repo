"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api/client";
import { decodePayload } from "@/lib/auth";
import { ApiRequestError } from "@/lib/api/client";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch<{ accessToken: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      login(res.accessToken);

      // Read the next= search param from the current URL without useSearchParams
      // (avoids the Suspense boundary requirement)
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");

      // Role-based default redirect when no explicit next param
      const payload = decodePayload(res.accessToken);
      const roleDefault =
        payload?.role === "ADMIN"
          ? "/admin/moderation"
          : payload?.role === "CONSULTANT"
            ? "/consultant/listings"
            : "/listings";

      router.push(next ?? roleDefault);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(
          err.status === 401
            ? "E-posta veya şifre hatalı."
            : Array.isArray(err.body.message)
              ? err.body.message.join(", ")
              : err.body.message,
        );
      } else {
        setError("Sunucuya ulaşılamıyor. API çalışıyor mu?");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Building2 size={28} className="text-zinc-900" />
          <h1 className="text-xl font-semibold text-zinc-900">AREP Girişi</h1>
          <p className="text-sm text-zinc-500">Antalya Emlak Platformu</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              E-posta
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@arep.dev"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Şifre
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
          </button>
        </form>

        {/* Dev credential hint */}
        <div className="mt-6 rounded-md border border-zinc-100 bg-zinc-50 p-3 text-xs text-zinc-500 space-y-1">
          <p className="font-medium text-zinc-600">Geliştirme ortamı hesapları:</p>
          <p>Admin: admin@arep.dev / Admin123!</p>
          <p>Danışman: consultant@arep.dev / consultant123</p>
        </div>
      </div>
    </div>
  );
}
