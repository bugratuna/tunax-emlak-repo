import { getServerToken } from "@/lib/auth.server";
import { listAdminUsers } from "@/lib/api/users";
import { ApiErrorMessage } from "@/components/api-error-message";
import type { AdminUser } from "@/lib/types";
import { UserActions } from "./user-actions";

export const metadata = { title: "Kullanıcı Yönetimi — Realty Tunax" };

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktif",
  SUSPENDED: "Askıya Alındı",
  PENDING_APPROVAL: "Onay Bekliyor",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  SUSPENDED: "bg-red-100 text-red-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Yönetici",
  CONSULTANT: "Danışman",
};

export default async function AdminUsersPage() {
  const token = await getServerToken();

  let users: AdminUser[] = [];
  let fetchError: string | null = null;
  try {
    users = await listAdminUsers(token ?? undefined);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Kullanıcılar yüklenemedi.";
  }

  const pending = users.filter((u) => u.status === "PENDING_APPROVAL");
  const active = users.filter((u) => u.status === "ACTIVE");
  const suspended = users.filter((u) => u.status === "SUSPENDED");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Kullanıcı Yönetimi</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {users.length} kullanıcı · {pending.length} onay bekliyor
          </p>
        </div>
      </div>

      {fetchError && <ApiErrorMessage error={fetchError} />}

      {/* Pending Approval section */}
      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-600">
            Onay Bekleyenler ({pending.length})
          </h2>
          <UserTable users={pending} highlight />
        </section>
      )}

      {/* Active users */}
      {active.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Aktif Kullanıcılar ({active.length})
          </h2>
          <UserTable users={active} />
        </section>
      )}

      {/* Suspended users */}
      {suspended.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Askıya Alınanlar ({suspended.length})
          </h2>
          <UserTable users={suspended} />
        </section>
      )}

      {users.length === 0 && !fetchError && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-400">
          Henüz kullanıcı yok.
        </div>
      )}
    </div>
  );
}

function UserTable({ users, highlight }: { users: AdminUser[]; highlight?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-lg border ${highlight ? "border-amber-200" : "border-zinc-200"} bg-white`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <th className="px-4 py-3 text-left">Ad Soyad</th>
            <th className="px-4 py-3 text-left">E-posta</th>
            <th className="px-4 py-3 text-left">Rol</th>
            <th className="px-4 py-3 text-left">Durum</th>
            <th className="px-4 py-3 text-left">Kayıt Tarihi</th>
            <th className="px-4 py-3 text-right">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-zinc-50">
              <td className="px-4 py-3 font-medium text-zinc-800">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.name}
              </td>
              <td className="px-4 py-3 text-zinc-600">{user.email}</td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[user.status] ?? "bg-zinc-100 text-zinc-600"}`}
                >
                  {STATUS_LABELS[user.status] ?? user.status}
                </span>
              </td>
              <td className="px-4 py-3 text-zinc-500">
                {new Date(user.createdAt).toLocaleDateString("tr-TR")}
              </td>
              <td className="px-4 py-3 text-right">
                <UserActions user={user} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
