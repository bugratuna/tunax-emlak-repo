import { notFound } from "next/navigation";
import { getListing } from "@/lib/api/listings";
import {
  getModerationReport,
  getScoringReport,
} from "@/lib/api/moderation";
import { StatusBadge } from "@/components/status-badge";
import { ApiErrorMessage } from "@/components/api-error-message";
import { DecisionBar } from "./decision-bar";
import { ApiRequestError } from "@/lib/api/client";
import type { ModerationReport, ScoringReport } from "@/lib/types";

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
    return <ApiErrorMessage error={err instanceof Error ? err : "Error loading listing."} />;
  }

  // Fetch scoring report and moderation report in parallel — 404 is non-fatal
  let scoringReport: ScoringReport | null = null;
  let moderationReport: ModerationReport | null = null;

  const [scoreResult, reportResult] = await Promise.allSettled([
    getScoringReport(listingId),
    getModerationReport(listingId),
  ]);

  if (scoreResult.status === "fulfilled") scoringReport = scoreResult.value;
  if (reportResult.status === "fulfilled") moderationReport = reportResult.value;

  const isPendingReview = listing.status === "PENDING_REVIEW";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-sm text-zinc-500">
            <a href="/admin/moderation" className="hover:underline">
              Moderation Queue
            </a>{" "}
            / Review
          </p>
          <h1 className="text-xl font-semibold text-zinc-900">
            {listing.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Consultant: {listing.consultantId} · Submitted:{" "}
            {new Date(listing.submittedAt).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={listing.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scoring report */}
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Scoring Report
          </h2>
          {scoringReport ? (
            <div className="space-y-4">
              <ScoreBar
                label="Completeness"
                value={scoringReport.deterministicScores.completenessScore}
              />
              <ScoreBar
                label="Description quality"
                value={scoringReport.deterministicScores.descriptionQualityScore}
              />

              {scoringReport.deterministicScores.missingFields.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1">
                    Missing fields
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
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-2">
                    Warnings
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
                        <span className="font-semibold">[{w.severity}] {w.code}</span>
                        {w.field && <span className="ml-1 opacity-70">· {w.field}</span>}
                        <p className="mt-0.5">{w.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scoringReport.llmResult && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-2">
                    AI Analysis
                  </p>
                  <dl className="space-y-1 text-sm">
                    {scoringReport.llmResult.contentModeration && (
                      <LlmRow
                        label="Content"
                        value={scoringReport.llmResult.contentModeration.status}
                      />
                    )}
                    {scoringReport.llmResult.factVerification && (
                      <LlmRow
                        label="Facts"
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
              Scoring report not yet available. The automation pipeline may
              still be processing.
            </p>
          )}
        </div>

        {/* Previous moderation report */}
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Previous Decision
          </h2>
          {moderationReport ? (
            <dl className="space-y-3 text-sm">
              <Row label="Decision" value={moderationReport.decision} />
              <Row label="Admin" value={moderationReport.adminId} />
              <Row
                label="Decided at"
                value={new Date(moderationReport.decidedAt).toLocaleString()}
              />
              <Row
                label="Applied rules"
                value={moderationReport.appliedRules.join(", ")}
              />
              {moderationReport.feedback && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-1">
                    Feedback to consultant
                  </dt>
                  <dd className="rounded bg-amber-50 px-3 py-2 text-amber-800">
                    {moderationReport.feedback}
                  </dd>
                </div>
              )}
              {moderationReport.notes && (
                <Row label="Notes" value={moderationReport.notes} />
              )}
            </dl>
          ) : (
            <p className="text-sm text-zinc-400">No previous decision for this listing.</p>
          )}
        </div>
      </div>

      {/* Decision bar — only shown for PENDING_REVIEW */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Make a Decision
        </h2>
        {isPendingReview ? (
          <DecisionBar listingId={listingId} />
        ) : (
          <p className="text-sm text-zinc-400">
            Actions are only available when listing is in{" "}
            <strong>PENDING_REVIEW</strong> status. Current status:{" "}
            <strong>{listing.status}</strong>.
          </p>
        )}
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
      <div className="flex justify-between text-xs text-zinc-500 mb-1">
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
