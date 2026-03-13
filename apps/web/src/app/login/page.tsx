"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiRequestError } from "@/lib/api/client";
import { decodePayload } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Show success banner when redirected from /register
  const registered =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("registered") === "1";

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

      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");

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
        const rawMsg = err.body?.message;
        const msgStr = Array.isArray(rawMsg) ? rawMsg.join(", ") : (rawMsg ?? "E-posta veya şifre hatalı.");
        setError(msgStr);
      } else {
        setError("Sunucuya ulaşılamıyor. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-10 shadow-sm">
          {/* Logo + heading */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <Image
              src="/brand/logo.png"
              alt="Realty Tunax"
              width={0}
              height={0}
              sizes="100vw"
              style={{ height: "3rem", width: "auto", objectFit: "contain" }}
            />
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                Realty Tunax&apos;a Giriş
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Antalya&apos;nın güvenilir gayrimenkul platformu
              </p>
            </div>
          </div>

          {/* Registration success banner */}
          {registered && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Kaydınız alınmıştır. Yönetici onayından sonra giriş yapabilirsiniz.
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                E-posta
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Şifre
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Hesabınız yok mu?{" "}
            <Link
              href="/register"
              className="font-medium text-amber-600 hover:text-amber-500"
            >
              Danışman olarak kayıt ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
