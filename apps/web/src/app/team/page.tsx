import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, Users, Crown, ArrowRight } from "lucide-react";
import { listTeam } from "@/lib/api/users";
import type { ConsultantPublicProfile } from "@/lib/types";

export const metadata: Metadata = {
  title: "Ekibimiz | Realty Tunax",
  description:
    "Realty Tunax'ın uzman gayrimenkul danışmanları. Antalya'da güvenilir, deneyimli ekibimizle tanışın.",
  icons: {
    icon: "/brand/logo-icon.svg",
  },
};

export const revalidate = 300;

// ── Leadership title set (canonical) ──────────────────────────────────────────

const LEADERSHIP_TITLES = new Set([
  "Ofis Ortağı",
  "Kurucu Ortak",
  "Genel Müdür",
  "Partner",
  "Yönetici",
  "Ofis Sahibi (Booker)",
]);

function isLeadership(c: ConsultantPublicProfile): boolean {
  if (c.title && LEADERSHIP_TITLES.has(c.title)) return true;
  if (c.role === "ADMIN" && !c.title) return true;
  return false;
}

// ── Leadership Card (premium, rectangular portrait) ───────────────────────────

function LeadershipCard({ consultant }: { consultant: ConsultantPublicProfile }) {
  const fullName =
    consultant.firstName && consultant.lastName
      ? `${consultant.firstName} ${consultant.lastName}`
      : consultant.name;

  const titleLabel =
    consultant.title ?? (consultant.role === "ADMIN" ? "Yönetici" : "Ofis Ortağı");

  return (
    <Link
      href={`/team/${consultant.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      {/* Portrait photo — 4:3 rectangular */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-linear-to-br from-amber-50 to-amber-100">
        {consultant.profilePhotoUrl ? (
          <Image
            src={consultant.profilePhotoUrl}
            alt={fullName}
            fill
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-6xl font-bold text-amber-300">
              {(fullName[0] ?? "?").toUpperCase()}
            </span>
          </div>
        )}
        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/40 to-transparent" />
        {/* Title chip */}
        <div className="absolute bottom-3 left-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow">
            <Crown size={10} />
            {titleLabel}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-bold text-zinc-900 transition-colors group-hover:text-amber-700">
          {fullName}
        </h3>

        {consultant.bio && (
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            {consultant.bio}
          </p>
        )}

        <div className="mt-auto border-t border-zinc-100 pt-5 flex flex-wrap gap-4 text-xs text-zinc-400">
          {consultant.phoneNumber && (
            <span className="flex items-center gap-1.5">
              <Phone size={12} className="text-amber-500" />
              {consultant.phoneNumber}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Mail size={12} className="text-amber-500" />
            {consultant.email}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-600 opacity-0 transition-opacity group-hover:opacity-100">
          Profili Görüntüle <ArrowRight size={12} />
        </div>
      </div>
    </Link>
  );
}

// ── Consultant Card (compact, circular photo) ─────────────────────────────────

function ConsultantCard({ consultant }: { consultant: ConsultantPublicProfile }) {
  const fullName =
    consultant.firstName && consultant.lastName
      ? `${consultant.firstName} ${consultant.lastName}`
      : consultant.name;

  const titleLabel =
    consultant.title ?? (consultant.role === "ADMIN" ? "Yönetici" : "Gayrimenkul Danışmanı");

  return (
    <Link
      href={`/team/${consultant.id}`}
      className="group flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm transition-all hover:shadow-md hover:border-zinc-300"
    >
      {/* Circular avatar */}
      <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full bg-zinc-100 ring-4 ring-zinc-50 transition-all group-hover:ring-amber-100">
        {consultant.profilePhotoUrl ? (
          <Image
            src={consultant.profilePhotoUrl}
            alt={fullName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-zinc-400">
            {(fullName[0] ?? "?").toUpperCase()}
          </div>
        )}
      </div>

      <h3 className="text-base font-semibold text-zinc-900 transition-colors group-hover:text-amber-600">
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
      <div className="mb-12 text-center">
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

      {/* Leadership section — wider cards, 2 col max */}
      {leaders.length > 0 && (
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-2">
            <Crown size={16} className="text-amber-500" />
            <h2 className="text-lg font-bold text-zinc-900">
              Liderlik &amp; Ofis Sahipleri
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {leaders.map((c) => (
              <LeadershipCard key={c.id} consultant={c} />
            ))}
          </div>
        </section>
      )}

      {/* Divider */}
      {leaders.length > 0 && agents.length > 0 && (
        <div className="mb-10 border-t border-zinc-100" />
      )}

      {/* Consultants section — compact 3-col grid */}
      {agents.length > 0 ? (
        <section>
          {leaders.length > 0 && (
            <div className="mb-5 flex items-center gap-2">
              <Users size={16} className="text-zinc-400" />
              <h2 className="text-lg font-bold text-zinc-900">
                Danışmanlarımız
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
