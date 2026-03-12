"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  getMe,
  updateMe,
  uploadProfilePhoto,
  type UpdateProfileDto,
} from "@/lib/api/users";
import type { UserProfile } from "@/lib/types";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state — no profilePhotoUrl field (managed separately via upload)
  const [form, setForm] = useState<UpdateProfileDto>({
    name: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    bio: "",
  });

  // Redirect unauthenticated users
  useEffect(() => {
    if (user === null && typeof window !== "undefined") {
      router.replace("/login");
    }
  }, [user, router]);

  // Fetch profile on mount
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getMe()
      .then((p) => {
        setProfile(p);
        setForm({
          name: p.name ?? "",
          firstName: p.firstName ?? "",
          lastName: p.lastName ?? "",
          phoneNumber: p.phoneNumber ?? "",
          bio: p.bio ?? "",
        });
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Profil yüklenemedi."),
      )
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await updateMe(form);
      setProfile(updated);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);

    setPhotoUploading(true);
    setError(null);
    try {
      const updated = await uploadProfilePhoto(file);
      setProfile(updated);
      // Keep the local preview for smooth UX; it will match the S3 URL shortly
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fotoğraf yüklenemedi.");
      setPhotoPreview(null);
    } finally {
      setPhotoUploading(false);
      // Reset file input so the same file can be picked again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!user) return null; // redirecting

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-sm text-zinc-500">
        Profil yükleniyor…
      </div>
    );
  }

  const currentPhotoUrl = photoPreview ?? profile?.profilePhotoUrl ?? null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Profilim</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Kişisel bilgilerinizi güncelleyin.
        </p>
      </div>

      {profile && (
        <div className="mb-4 text-xs text-zinc-400">
          {profile.email} · {profile.role}
        </div>
      )}

      {/* ── Profile photo uploader ─────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-5">
        {/* Photo circle — click to change */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={photoUploading}
          className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-200 bg-zinc-100 transition hover:border-zinc-400 disabled:opacity-60"
          aria-label="Profil fotoğrafını değiştir"
        >
          {profile?.profilePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile?.profilePhotoUrl ?? currentPhotoUrl}
              alt="Profil fotoğrafı"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-zinc-400 select-none">
              {(
                profile?.firstName?.[0] ??
                profile?.name?.[0] ??
                user.email[0]
              ).toUpperCase()}
            </span>
          )}
          {/* Hover overlay */}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera size={20} className="text-white" />
          </span>
          {photoUploading && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-800" />
            </span>
          )}
        </button>

        <div>
          <p className="text-sm font-medium text-zinc-800">Profil Fotoğrafı</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            JPEG, PNG veya WebP · Maks. 5 MB
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photoUploading}
            className="mt-2 text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-600 disabled:opacity-50"
          >
            {photoUploading ? "Yükleniyor…" : "Fotoğrafı değiştir"}
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-lg border border-zinc-200 bg-white p-6"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Ad
            </label>
            <input
              name="firstName"
              value={form.firstName ?? ""}
              onChange={handleChange}
              placeholder="Ad"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Soyad
            </label>
            <input
              name="lastName"
              value={form.lastName ?? ""}
              onChange={handleChange}
              placeholder="Soyad"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">
            Görünen Ad
          </label>
          <input
            name="name"
            value={form.name ?? ""}
            onChange={handleChange}
            placeholder="Görünen ad"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">
            Telefon
          </label>
          <input
            name="phoneNumber"
            type="tel"
            value={form.phoneNumber ?? ""}
            onChange={handleChange}
            placeholder="+90 5xx xxx xx xx"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">
            Biyografi
          </label>
          <textarea
            name="bio"
            value={form.bio ?? ""}
            onChange={handleChange}
            rows={4}
            placeholder="Kendinizi tanıtın…"
            className="w-full resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
        </div>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Profil güncellendi.
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
