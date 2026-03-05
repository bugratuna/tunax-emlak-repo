"use client";

import { useState } from "react";
import { initEnrichment, attachReportLlm } from "@/lib/api/moderation";
import { ApiErrorMessage } from "@/components/api-error-message";
import { ApiRequestError } from "@/lib/api/client";
import type { ModerationReport } from "@/lib/types";

interface Props {
  listingId: string;
  initialReport: ModerationReport | null;
}

export function EnrichPanel({ listingId, initialReport }: Props) {
  const [report, setReport] = useState<ModerationReport | null>(initialReport);
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  const [llmJson, setLlmJson] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [attached, setAttached] = useState(false);

  async function handleEnrich() {
    setEnrichError(null);
    setEnriching(true);
    try {
      const result = await initEnrichment(listingId);
      setReport(result);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const msg = Array.isArray(err.body.message)
          ? err.body.message.join(", ")
          : err.body.message;
        setEnrichError(`${err.status}: ${msg}`);
      } else {
        setEnrichError("Sunucuya ulaşılamıyor.");
      }
    } finally {
      setEnriching(false);
    }
  }

  function handleJsonChange(value: string) {
    setLlmJson(value);
    setParseError(null);
    setAttachError(null);
  }

  async function handleAttach() {
    setParseError(null);
    setAttachError(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(llmJson);
    } catch {
      setParseError("Geçersiz JSON. Lütfen yapıyı kontrol edin.");
      return;
    }

    setAttaching(true);
    try {
      const result = await attachReportLlm(listingId, parsed);
      setReport(result);
      setAttached(true);
      setLlmJson("");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const msg = Array.isArray(err.body.message)
          ? err.body.message.join(", ")
          : err.body.message;
        setAttachError(`${err.status}: ${msg}`);
      } else {
        setAttachError("Sunucuya ulaşılamıyor.");
      }
    } finally {
      setAttaching(false);
    }
  }

  const hasPrompt = Boolean(report?.llmPrompt);

  return (
    <div className="space-y-5">
      {/* Step 1: Enrich button (hidden once prompt is available) */}
      {!hasPrompt && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-500">
            Zenginleştirme, LLM için bir prompt ve JSON şema oluşturur.
          </p>
          {enrichError && <ApiErrorMessage error={enrichError} />}
          <button
            type="button"
            onClick={handleEnrich}
            disabled={enriching}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {enriching ? "İşleniyor…" : "Zenginleştir"}
          </button>
        </div>
      )}

      {/* Step 2: Show prompt + schema once available */}
      {hasPrompt && (
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
              LLM Prompt
            </p>
            <pre className="max-h-64 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 whitespace-pre-wrap">
              {report!.llmPrompt}
            </pre>
          </div>

          {!!report?.llmJsonSchema && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                LLM JSON Şeması
              </p>
              <pre className="max-h-64 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 whitespace-pre-wrap">
                {JSON.stringify(report.llmJsonSchema, null, 2)}
              </pre>
            </div>
          )}

          {/* Step 3: Attach LLM result */}
          {attached ? (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              LLM sonucu başarıyla eklendi.
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                LLM Sonucunu Yapıştırın
              </p>
              <textarea
                rows={8}
                value={llmJson}
                onChange={(e) => handleJsonChange(e.target.value)}
                placeholder='{"status": "SUCCESS", "contentModeration": {...}, ...}'
                className="w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-zinc-400"
                spellCheck={false}
              />
              {parseError && (
                <p className="text-xs text-red-600">{parseError}</p>
              )}
              {attachError && <ApiErrorMessage error={attachError} />}
              <button
                type="button"
                onClick={handleAttach}
                disabled={attaching || !llmJson.trim()}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
              >
                {attaching ? "Ekleniyor…" : "LLM Sonucu Ekle"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
