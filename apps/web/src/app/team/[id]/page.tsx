import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Mail, MapPin, ArrowLeft, MessageCircle } from "lucide-react";
import { getConsultant } from "@/lib/api/users";
import { ApiRequestError } from "@/lib/api/client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const c = await getConsultant(id);
    const fullName =
      c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : c.name;
    return {
      title: `${fullName} | Realty Tunax Ekibi`,
      description: c.bio ?? `${fullName} — Realty Tunax Gayrimenkul Danışmanı, Antalya.`,
    };
  } catch {
    return { title: "Danışman | Realty Tunax" };
  }
}

export default async function ConsultantDetailPage({ params }: Props) {
  const { id } = await params;

  let consultant;
  try {
    consultant = await getConsultant(id);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) notFound();
    notFound();
  }

  const fullName =
    consultant.firstName && consultant.lastName
      ? `${consultant.firstName} ${consultant.lastName}`
      : consultant.name;

  return (
    <div className="mx-auto max-w-2xl py-4">
      {/* Breadcrumb */}
      <Link
        href="/team"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
      >
        <ArrowLeft size={14} />
        Ekibimize Dön
      </Link>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {/* Profile header */}
        <div className="flex flex-col items-center gap-5 bg-zinc-50 px-8 py-10 sm:flex-row sm:items-start">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-zinc-200 ring-4 ring-white shadow">
            {consultant.profilePhotoUrl ? (
              <Image
                src={consultant.profilePhotoUrl}
                alt={fullName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-zinc-400">
                {(fullName[0] ?? "?").toUpperCase()}
              </div>
            )}
          </div>

          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-zinc-900">{fullName}</h1>
            <p className="mt-1 text-sm font-medium text-amber-600">
              Gayrimenkul Danışmanı · Realty Tunax
            </p>
            <p className="mt-1 flex items-center justify-center gap-1 text-xs text-zinc-400 sm:justify-start">
              <MapPin size={11} />
              Antalya, Türkiye
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="divide-y divide-zinc-100 px-8 py-6 space-y-6">
          {consultant.bio && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Hakkında
              </h2>
              <p className="text-sm leading-relaxed text-zinc-600">
                {consultant.bio}
              </p>
            </div>
          )}

          <div className="pt-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              İletişim
            </h2>
            <ul className="space-y-3">
              {consultant.phoneNumber && (
                <li className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600">
                    <Phone size={14} />
                  </span>
                  <a
                    href={`tel:${consultant.phoneNumber.replace(/\s/g, "")}`}
                    className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                  >
                    {consultant.phoneNumber}
                  </a>
                </li>
              )}
              {consultant.phoneNumber && (
                <li className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600">
                    <MessageCircle size={14} />
                  </span>
                  <a
                    href={`https://wa.me/${consultant.phoneNumber.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                  >
                    WhatsApp ile Yaz
                  </a>
                </li>
              )}
              <li className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Mail size={14} />
                </span>
                <a
                  href={`mailto:${consultant.email}`}
                  className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                >
                  {consultant.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="border-t border-zinc-100 bg-zinc-50 px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-400">
            İlanlarımıza göz atmak için:
          </p>
          <Link
            href="/listings"
            className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
          >
            Tüm İlanları Görüntüle →
          </Link>
        </div>
      </div>
    </div>
  );
}
