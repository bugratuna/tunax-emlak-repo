import { apiFetch } from "./client";
import type { AdminUser, ConsultantPublicProfile } from "@/lib/types";

export async function listAdminUsers(token?: string): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>("/api/admin/users", token ? { _token: token } : undefined);
}

export async function approveUser(id: string): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/api/admin/users/${id}/approve`, { method: "PATCH" });
}

export async function suspendUser(id: string): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/api/admin/users/${id}/suspend`, { method: "PATCH" });
}

export interface CreateUserDto {
  email: string;
  password: string;
  role?: "ADMIN" | "CONSULTANT";
  name?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export async function createAdminUser(dto: CreateUserDto): Promise<AdminUser> {
  return apiFetch<AdminUser>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

// ── Public team endpoints (no auth required) ──────────────────────────────────

export async function listTeam(): Promise<ConsultantPublicProfile[]> {
  return apiFetch<ConsultantPublicProfile[]>("/api/team");
}

export async function getConsultant(id: string): Promise<ConsultantPublicProfile> {
  return apiFetch<ConsultantPublicProfile>(`/api/team/${id}`);
}
