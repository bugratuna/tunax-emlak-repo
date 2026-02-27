import { notFound } from "next/navigation";
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
import { ApiRequestError } from "@/lib/api/client";
import type { AuditLogEntry, ModerationReport, ScoringReport } from "@/lib/types";

interface Props {
  params: Promise<{ listingId: string }>;
}

export default async function ModerationDetailPage({ params }: Props) {
  const { listingId } = await params;

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
    getScoringReport(listingId),
    getModerationReport(listingId),
    getAuditLog(listingId),
  ]);

  const scoringReport: ScoringReport | null =
    scoreResult.status === "fulfilled" ? scoreResult.value : null;
  const moderationReport: ModerationReport | null =
    reportResult.status === "fulfilled" ? reportResult.value : null;
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
            Danışman: {listing.consultantId} · Gönderim:{" "}
            {new Date(listing.submittedAt).toLocaleDateString("tr-TR")}
          </p>
        </div>
        <StatusBadge status={listing.status} />
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

              {scoringReport.deterministicScores.missingFields.length > 0 && (
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

              {scoringReport.deterministicScores.warnings.length > 0 && (
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
          {moderationReport ? (
            <dl className="space-y-3 text-sm">
              <Row label="Karar" value={moderationReport.decision} />
              <Row label="Yönetici" value={moderationReport.adminId} />
              <Row
                label="Karar tarihi"
                value={new Date(moderationReport.decidedAt).toLocaleString("tr-TR")}
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
