"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserCircle2 } from "lucide-react";
import { registerUser } from "@/lib/api/users";
import { ApiRequestError } from "@/lib/api/client";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrors((prev) => ({ ...prev, photo: "Yalnızca jpg, png veya webp yükleyebilirsiniz." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: "Fotoğraf 5 MB'dan büyük olamaz." }));
      return;
    }
    setErrors((prev) => ({ ...prev, photo: "" }));
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Ad zorunludur.";
    if (!form.lastName.trim()) e.lastName = "Soyad zorunludur.";
    if (!form.email.trim()) e.email = "E-posta zorunludur.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Geçerli bir e-posta girin.";
    if (!form.phoneNumber.trim()) e.phoneNumber = "Telefon numarası zorunludur.";
    if (!form.password) e.password = "Şifre zorunludur.";
    else if (form.password.length < 8) e.password = "Şifre en az 8 karakter olmalıdır.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await registerUser({ ...form, profilePhoto: photoFile });
      router.push("/login?registered=1");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const msg = Array.isArray(err.body?.message)
          ? err.body.message.join(", ")
          : (err.body?.message ?? "Kayıt başarısız.");
        if (err.status === 409) {
          setErrors((prev) => ({ ...prev, email: "Bu e-posta zaten kayıtlı." }));
        } else {
          setServerError(msg);
        }
      } else {
        setServerError("Sunucuya ulaşılamıyor. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-10 shadow-sm">
          {/* Header */}
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
              <h1 className="text-xl font-bold text-zinc-900">Danışman Kaydı</h1>
              <p className="mt-1 text-sm text-zinc-500">
                Kaydınız yönetici onayına gönderilir. Onaylandıktan sonra giriş yapabilirsiniz.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Profile photo */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-zinc-300 bg-zinc-50 hover:border-amber-400 hover:bg-amber-50 transition-colors"
              >
                {photoPreview ? (
                  /* blob URL from URL.createObjectURL — next/image does not support blob URLs */
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={photoPreview}
                    alt="Profil önizleme"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle2 className="m-auto h-10 w-10 text-zinc-400" />
                )}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-amber-600 hover:text-amber-500 font-medium"
              >
                {photoPreview ? "Fotoğrafı Değiştir" : "Profil Fotoğrafı Ekle"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
              {errors.photo && (
                <p className="text-xs text-red-600">{errors.photo}</p>
              )}
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Ad <span className="text-red-500">*</span>
                </label>
                <input
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={handleChange}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition ${
                    errors.firstName ? "border-red-400" : "border-zinc-300"
                  }`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={handleChange}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition ${
                    errors.lastName ? "border-red-400" : "border-zinc-300"
                  }`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                E-posta <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition ${
                  errors.email ? "border-red-400" : "border-zinc-300"
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Telefon <span className="text-red-500">*</span>
              </label>
              <input
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="0532 123 45 67"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition ${
                  errors.phoneNumber ? "border-red-400" : "border-zinc-300"
                }`}
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Şifre <span className="text-red-500">*</span>
              </label>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition ${
                  errors.password ? "border-red-400" : "border-zinc-300"
                }`}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
              <p className="mt-1 text-xs text-zinc-400">En az 8 karakter</p>
            </div>

            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Kaydediliyor…" : "Kayıt Ol"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Zaten hesabınız var mı?{" "}
            <Link
              href="/login"
              className="font-medium text-amber-600 hover:text-amber-500"
            >
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
