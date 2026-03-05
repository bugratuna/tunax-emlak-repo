import { notFound } from "next/navigation";
import Image from "next/image";
import { getServerToken } from "@/lib/auth.server";
import { getListing } from "@/lib/api/listings";
import {
  getModerationReport,
  getScoringReport,
  getAuditLog,
} from "@/lib/api/moderation";
import { StatusBadge } from "@/components/status-badge";
import { ApiErrorMessage } from "@/components/api-error-message";
import { AuditLogTable } from "@/components/audit-log-table";
import { DecisionBar } from "./decision-bar";
import { EnrichPanel } from "./enrich-panel";
import { FeaturedToggle } from "./featured-toggle";
import { ApiRequestError } from "@/lib/api/client";
import type { AuditLogEntry, ModerationReport, ScoringReport } from "@/lib/types";

interface Props {
  params: Promise<{ listingId: string }>;
}

export default async function ModerationDetailPage({ params }: Props) {
  const { listingId } = await params;
  const token = await getServerToken();

  // Fetch listing — 404 = not found
  let listing;
  try {
    listing = await getListing(listingId);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) notFound();
    return <ApiErrorMessage error={err instanceof Error ? err : "İlan yüklenemedi."} />;
  }

  // Fetch scoring report, moderation report, and audit log in parallel — 404 is non-fatal
  const [scoreResult, reportResult, auditResult] = await Promise.allSettled([
    getScoringReport(listingId, token ?? undefined),
    getModerationReport(listingId, token ?? undefined),
    getAuditLog(listingId, token ?? undefined),
  ]);

  const scoringReport: ScoringReport | null =
    scoreResult.status === "fulfilled" ? scoreResult.value : null;
  const rawModerationReport: ModerationReport | null =
    reportResult.status === "fulfilled" ? reportResult.value : null;
  // Normalise array fields so the page never calls .join() on undefined.
  const moderationReport = rawModerationReport
    ? normalizeModerationReport(rawModerationReport)
    : null;
  const auditLog: AuditLogEntry[] =
    auditResult.status === "fulfilled" ? auditResult.value : [];

  const isPendingReview = listing.status === "PENDING_REVIEW";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-sm text-zinc-500">
            <a href="/admin/moderation" className="hover:underline">
              Onay Kuyruğu
            </a>{" "}
            / İnceleme
          </p>
          <h1 className="text-xl font-semibold text-zinc-900">
            {listing.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Danışman: {listing.consultantName ?? listing.consultantId} · Gönderim:{" "}
            {listing.submittedAt.slice(0, 10)}
          </p>
        </div>
        <StatusBadge status={listing.status} />
      </div>

      {/* Listing preview */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          İlan Önizleme
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Photos strip */}
          {listing.media && listing.media.length > 0 ? (
            <div className="flex shrink-0 gap-1.5 overflow-x-auto">
              {listing.media.slice(0, 5).map((photo, i) => (
                <div
                  key={photo.id}
                  className={`relative h-24 shrink-0 overflow-hidden rounded-md bg-zinc-100 ${
                    i === 0 ? "w-36" : "w-24"
                  }`}
                >
                  <Image
                    src={photo.publicUrl}
                    alt={`Fotoğraf ${i + 1}`}
                    fill
                    sizes="144px"
                    className="object-cover"
                    unoptimized
                  />
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-blue-600/80 px-1.5 py-0.5 text-[9px] font-medium text-white">
                      Kapak
                    </span>
                  )}
                </div>
              ))}
              {listing.media.length > 5 && (
                <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-xs text-zinc-400">
                  +{listing.media.length - 5}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-24 w-36 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-xs text-zinc-400">
              Fotoğraf yok
            </div>
          )}

          {/* Key facts */}
          <div className="min-w-0 space-y-2 text-sm">
            {listing.price && (
              <p className="text-lg font-bold text-zinc-900">
                {listing.price.amount.toLocaleString("tr-TR")}{" "}
                {listing.price.currency ?? "TRY"}
                {listing.price.isNegotiable && (
                  <span className="ml-2 text-xs font-normal text-zinc-400">
                    Pazarlığa açık
                  </span>
                )}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
              {listing.category && (
                <span>
                  {listing.category === "SALE" ? "Satılık" : "Kiralık"}
                </span>
              )}
              {(listing.subtype ?? listing.propertyType) && (
                <span>{listing.subtype ?? listing.propertyType}</span>
              )}
              {listing.location?.city && (
                <span>
                  {[
                    listing.location.city,
                    listing.location.district,
                    listing.location.neighborhood,
                  ]
                    .filter(Boolean)
                    .join(" › ")}
                </span>
              )}
              {listing.specifications?.roomCount != null && (
                <span>{listing.specifications.roomCount} oda</span>
              )}
              {listing.specifications?.grossArea != null && (
                <span>{listing.specifications.grossArea} m²</span>
              )}
              {listing.specifications?.floorNumber != null && (
                <span>
                  {listing.specifications.floorNumber}. kat
                  {listing.specifications.totalFloors != null
                    ? ` / ${listing.specifications.totalFloors}`
                    : ""}
                </span>
              )}
            </div>
            {listing.location?.coordinates && (
              <p className="text-xs text-zinc-400">
                📍 {listing.location.coordinates.latitude.toFixed(5)},{" "}
                {listing.location.coordinates.longitude.toFixed(5)}
              </p>
            )}
            {listing.description && (
              <p className="line-clamp-2 text-xs text-zinc-500">
                {listing.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scoring report */}
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Puanlama Raporu
          </h2>
          {scoringReport ? (
            <div className="space-y-4">
              <ScoreBar
                label="Tamlık"
                value={scoringReport.deterministicScores.completenessScore}
              />
              <ScoreBar
                label="Açıklama kalitesi"
                value={scoringReport.deterministicScores.descriptionQualityScore}
              />

              {Array.isArray(scoringReport.deterministicScores.missingFields) &&
                scoringReport.deterministicScores.missingFields.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Eksik Alanlar
                  </p>
                  <ul className="list-disc pl-4 text-sm text-zinc-600">
                    {scoringReport.deterministicScores.missingFields.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(scoringReport.deterministicScores.warnings) &&
                scoringReport.deterministicScores.warnings.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Uyarılar
                  </p>
                  <div className="space-y-2">
                    {scoringReport.deterministicScores.warnings.map((w, i) => (
                      <div
                        key={i}
                        className={`rounded border px-3 py-2 text-xs ${
                          w.severity === "HIGH"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : w.severity === "MEDIUM"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-zinc-200 bg-zinc-50 text-zinc-600"
                        }`}
                      >
                        <span className="font-semibold">
                          [{w.severity}] {w.code}
                        </span>
                        {w.field && (
                          <span className="ml-1 opacity-70">· {w.field}</span>
                        )}
                        <p className="mt-0.5">{w.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scoringReport.llmResult && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Yapay Zeka Analizi
                  </p>
                  <dl className="space-y-1 text-sm">
                    {scoringReport.llmResult.contentModeration && (
                      <LlmRow
                        label="İçerik"
                        value={scoringReport.llmResult.contentModeration.status}
                      />
                    )}
                    {scoringReport.llmResult.factVerification && (
                      <LlmRow
                        label="Gerçeklik"
                        value={scoringReport.llmResult.factVerification.status}
                      />
                    )}
                    {scoringReport.llmResult.riskAssessment && (
                      <LlmRow
                        label="Risk"
                        value={scoringReport.llmResult.riskAssessment.riskLevel}
                      />
                    )}
                  </dl>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">
              Puanlama raporu henüz hazır değil. Otomasyon hattı işliyor olabilir.
            </p>
          )}
        </div>

        {/* Previous moderation report */}
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Önceki Karar
          </h2>
          {moderationReport?.decision ? (
            <dl className="space-y-3 text-sm">
              <Row label="Karar" value={moderationReport.decision} />
              <Row label="Yönetici" value={moderationReport.adminId ?? "—"} />
              <Row
                label="Karar tarihi"
                value={
                  moderationReport.decidedAt
                    ? moderationReport.decidedAt.slice(0, 16).replace("T", " ")
                    : "—"
                }
              />
              <Row
                label="Uygulanan kurallar"
                value={moderationReport.appliedRules.join(", ") || "—"}
              />
              {moderationReport.feedback && (
                <div>
                  <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Danışmana geri bildirim
                  </dt>
                  <dd className="rounded bg-amber-50 px-3 py-2 text-amber-800">
                    {moderationReport.feedback}
                  </dd>
                </div>
              )}
              {moderationReport.notes && (
                <Row label="Notlar" value={moderationReport.notes} />
              )}
            </dl>
          ) : (
            <p className="text-sm text-zinc-400">Bu ilan için önceki karar yok.</p>
          )}
        </div>
      </div>

      {/* Decision bar — only shown for PENDING_REVIEW */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Karar Ver
        </h2>
        {isPendingReview ? (
          <DecisionBar listingId={listingId} />
        ) : (
          <p className="text-sm text-zinc-400">
            Kararlar yalnızca ilan <strong>PENDING_REVIEW</strong> durumunda
            iken alınabilir. Mevcut durum: <strong>{listing.status}</strong>.
          </p>
        )}
      </div>

      {/* LLM Enrichment panel */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          LLM Zenginleştirme
        </h2>
        <EnrichPanel listingId={listingId} initialReport={moderationReport} />
      </div>

      {/* Featured toggle — only for PUBLISHED listings */}
      {listing.status === "PUBLISHED" && (
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Öne Çıkan
          </h2>
          <p className="mb-3 text-xs text-zinc-400">
            Öne çıkan ilanlar ana sayfada ve arama sonuçlarında ön plana çıkar.
          </p>
          <FeaturedToggle
            listingId={listingId}
            isFeatured={listing.isFeatured ?? false}
          />
        </div>
      )}

      {/* Audit log */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Denetim Kaydı
        </h2>
        <AuditLogTable entries={auditLog} />
      </div>
    </div>
  );
}

// ─── Data contract guard ──────────────────────────────────────────────────────
// The backend may return a pre-decision enrichment scaffold that lacks decision
// fields (adminId, appliedRules, decidedAt, …).  This function normalises every
// array field to an empty array so the page never calls .join() on undefined.
// It emits a console.warn when a field is missing so future API shape changes
// are easy to diagnose without hiding the discrepancy silently.
function normalizeModerationReport(
  r: ModerationReport,
): ModerationReport & { appliedRules: string[] } {
  if (!Array.isArray(r.appliedRules)) {
    console.warn(
      `[ModerationDetailPage] Unexpected response shape: appliedRules is ${typeof r.appliedRules} — defaulting to []`,
    );
  }
  return {
    ...r,
    appliedRules: Array.isArray(r.appliedRules) ? r.appliedRules : [],
  };
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 70
      ? "bg-green-500"
      : value >= 40
        ? "bg-amber-400"
        : "bg-red-500";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-zinc-500">
        <span>{label}</span>
        <span className="font-semibold">{value}/100</span>
      </div>
      <div className="h-2 w-full rounded-full bg-zinc-100">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-zinc-700">{value}</dd>
    </div>
  );
}

function LlmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-700">{value}</dd>
    </div>
  );
}
