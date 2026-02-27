import type { AuditLogEntry } from "@/lib/types";

export function AuditLogTable({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-zinc-400">Henüz denetim kaydı bulunmuyor.</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              İşlem
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              Yönetici
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              Tarih
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {entries.map((entry, i) => (
            <tr key={i} className="hover:bg-zinc-50">
              <td className="px-4 py-2 font-medium text-zinc-800">
                {entry.action}
              </td>
              <td className="px-4 py-2 text-zinc-500">
                {entry.adminId ?? "—"}
              </td>
              <td className="px-4 py-2 text-zinc-500">
                {new Date(entry.timestamp).toLocaleString("tr-TR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
