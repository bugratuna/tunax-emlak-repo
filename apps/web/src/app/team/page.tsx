import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, Users, Crown } from "lucide-react";
import { listTeam } from "@/lib/api/users";
import type { ConsultantPublicProfile } from "@/lib/types";

export const metadata: Metadata = {
  title: "Ekibimiz | Realty Tunax",
  description:
    "Realty Tunax'ın uzman gayrimenkul danışmanları. Antalya'da güvenilir, deneyimli ekibimizle tanışın.",
};

export const revalidate = 300;

// ── Leadership title set (canonical) ──────────────────────────────────────────

const LEADERSHIP_TITLES = new Set([
  "Ofis Ortağı",
  "Kurucu Ortak",
  "Genel Müdür",
  "Partner",
  "Yönetici",
  "Ofis Sahibi",
  "Booker",
]);

function isLeadership(c: ConsultantPublicProfile): boolean {
  if (c.title && LEADERSHIP_TITLES.has(c.title)) return true;
  // ADMIN users without a title also appear in leadership by default
  if (c.role === "ADMIN" && !c.title) return true;
  return false;
}

// ── Card ──────────────────────────────────────────────────────────────────────

function ConsultantCard({
  consultant,
  highlight = false,
}: {
  consultant: ConsultantPublicProfile;
  highlight?: boolean;
}) {
  const fullName =
    consultant.firstName && consultant.lastName
      ? `${consultant.firstName} ${consultant.lastName}`
      : consultant.name;

  const titleLabel =
    consultant.title ?? (consultant.role === "ADMIN" ? "Yönetici" : "Gayrimenkul Danışmanı");

  return (
    <Link
      href={`/team/${consultant.id}`}
      className={`group flex flex-col items-center rounded-2xl border p-6 text-center shadow-sm transition-all hover:shadow-md ${
        highlight
          ? "border-amber-200 bg-amber-50 hover:border-amber-300"
          : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
      <div
        className={`relative mb-4 h-24 w-24 overflow-hidden rounded-full ring-4 transition-all ${
          highlight
            ? "bg-amber-100 ring-amber-100 group-hover:ring-amber-200"
            : "bg-zinc-100 ring-zinc-50 group-hover:ring-amber-100"
        }`}
      >
        {consultant.profilePhotoUrl ? (
          <Image
            src={consultant.profilePhotoUrl}
            alt={fullName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-zinc-400">
            {(fullName[0] ?? "?").toUpperCase()}
          </div>
        )}
      </div>

      <h3
        className={`text-base font-semibold transition-colors group-hover:text-amber-600 ${
          highlight ? "text-amber-900" : "text-zinc-900"
        }`}
      >
        {fullName}
      </h3>
      <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-amber-600">
        {titleLabel}
      </p>

      {consultant.bio && (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-500">
          {consultant.bio}
        </p>
      )}

      <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-zinc-400">
        {consultant.phoneNumber && (
          <span className="flex items-center gap-1">
            <Phone size={11} />
            {consultant.phoneNumber}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Mail size={11} />
          {consultant.email}
        </span>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TeamPage() {
  let all: ConsultantPublicProfile[] = [];
  try {
    all = await listTeam();
  } catch {
    // Non-critical — render empty state below
  }

  const leaders = all.filter(isLeadership);
  const agents = all.filter((c) => !isLeadership(c));

  return (
    <div className="py-4">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-700 mb-4">
          <Users size={13} />
          Çalışanlarımız
        </div>
        <h1 className="text-3xl font-bold text-zinc-900">
          Uzman Danışman Ekibimiz
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-500">
          Antalya gayrimenkul piyasasına hâkim, deneyimli danışmanlarımız her
          adımda yanınızda. Doğru yatırım için doğru insanlarla çalışın.
        </p>
      </div>

      {/* Leadership section */}
      {leaders.length > 0 && (
        <section className="mb-14">
          <div className="mb-5 flex items-center gap-2">
            <Crown size={16} className="text-amber-500" />
            <h2 className="text-lg font-bold text-zinc-900">
              Liderlik & Ofis Sahipleri
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {leaders.map((c) => (
              <ConsultantCard key={c.id} consultant={c} highlight />
            ))}
          </div>
        </section>
      )}

      {/* Consultants section */}
      {agents.length > 0 ? (
        <section>
          {leaders.length > 0 && (
            <div className="mb-5 flex items-center gap-2">
              <Users size={16} className="text-zinc-400" />
              <h2 className="text-lg font-bold text-zinc-900">
                Çalışanlarımız
              </h2>
            </div>
          )}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((c) => (
              <ConsultantCard key={c.id} consultant={c} />
            ))}
          </div>
        </section>
      ) : (
        all.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 py-20 text-center text-zinc-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Henüz aktif danışman bulunmuyor.</p>
          </div>
        )
      )}

      {/* CTA */}
      <div className="mt-16 rounded-2xl bg-zinc-900 px-8 py-10 text-center text-white">
        <h2 className="text-xl font-bold">Bir Danışmanla Görüşmek İster misiniz?</h2>
        <p className="mt-2 text-sm text-zinc-300">
          İlanlar hakkında bilgi almak veya randevu oluşturmak için bize ulaşın.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-block rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-400 transition-colors"
        >
          İletişime Geç
        </Link>
      </div>
    </div>
  );
}
