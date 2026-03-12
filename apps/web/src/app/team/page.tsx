import type { Metadata } from "next";
import { listTeam } from "@/lib/api/users";
import type { ConsultantPublicProfile } from "@/lib/types";
import { TeamPageClient } from "./team-page-client";

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
  "Ofis Sahibi (Broker)",
]);

function isLeadership(c: ConsultantPublicProfile): boolean {
  if (c.title && LEADERSHIP_TITLES.has(c.title)) return true;
  if (c.role === "ADMIN" && !c.title) return true;
  return false;
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
      <TeamPageClient leaders={leaders} agents={agents} />
    </div>
  );
}
