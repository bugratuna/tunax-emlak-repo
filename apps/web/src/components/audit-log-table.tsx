import type { AuditLogEntry } from "@/lib/types";

// Action → color mapping for the timeline dot
const ACTION_COLORS: Record<string, string> = {
  SUBMIT: "bg-blue-500",
  APPROVE: "bg-green-500",
  REJECT: "bg-red-500",
  REQUEST_CHANGES: "bg-amber-400",
  RESUBMIT: "bg-blue-400",
  ENRICH: "bg-purple-400",
  SCORE: "bg-zinc-400",
};

const ACTION_LABELS: Record<string, string> = {
  SUBMIT: "Gönderildi",
  APPROVE: "Onaylandı",
  REJECT: "Reddedildi",
  REQUEST_CHANGES: "Değişiklik İstendi",
  RESUBMIT: "Yeniden Gönderildi",
  ENRICH: "Zenginleştirildi",
  SCORE: "Puanlandı",
};

export function AuditLogTable({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-zinc-400">Henüz denetim kaydı bulunmuyor.</p>
    );
  }

  // Show most recent first
  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <ol className="relative space-y-0">
      {sorted.map((entry, i) => {
        const dot = ACTION_COLORS[entry.action] ?? "bg-zinc-400";
        const label = ACTION_LABELS[entry.action] ?? entry.action;
        const isLast = i === sorted.length - 1;

        return (
          <li key={i} className="flex gap-4">
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div
                className={`mt-1 h-3 w-3 shrink-0 rounded-full ring-2 ring-white ${dot}`}
              />
              {!isLast && (
                <div className="mt-1 w-px flex-1 bg-zinc-200" />
              )}
            </div>

            {/* Content */}
            <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
              <p className="text-sm font-medium text-zinc-800">{label}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-400">
                {entry.adminId && <span>Yönetici: {entry.adminId}</span>}
                <time dateTime={entry.timestamp}>
                  {new Date(entry.timestamp).toLocaleString("tr-TR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
