import { apiFetch, ApiRequestError } from "./client";
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

export async function activateUser(id: string): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/api/admin/users/${id}/activate`, { method: "PATCH" });
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  profilePhoto?: File | null;
}

export async function registerUser(dto: RegisterDto): Promise<AdminUser> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const base = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
  const formData = new FormData();
  formData.append("firstName", dto.firstName);
  formData.append("lastName", dto.lastName);
  formData.append("email", dto.email);
  formData.append("phoneNumber", dto.phoneNumber);
  formData.append("password", dto.password);
  if (dto.profilePhoto) formData.append("profilePhoto", dto.profilePhoto);

  const res = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({
      statusCode: res.status,
      message: res.statusText,
      error: "Unknown",
    }));
    throw new ApiRequestError(res.status, body);
  }
  return res.json();
}

// ── Public team endpoints (no auth required) ──────────────────────────────────

export async function listTeam(): Promise<ConsultantPublicProfile[]> {
  return apiFetch<ConsultantPublicProfile[]>("/api/team");
}

export async function getConsultant(id: string): Promise<ConsultantPublicProfile> {
  return apiFetch<ConsultantPublicProfile>(`/api/team/${id}`);
}
