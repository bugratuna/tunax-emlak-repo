import { apiFetch, ApiRequestError } from "./client";
import { getClientToken } from "@/lib/auth";
import type { AdminUser, ConsultantPublicProfile, UserProfile } from "@/lib/types";

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

// ── Authenticated user profile endpoints ──────────────────────────────────────

export interface UpdateProfileDto {
  name?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  profilePhotoUrl?: string;
}

/** Get the currently authenticated user's profile (requires JWT). */
export async function getMe(token?: string): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/users/me", token ? { _token: token } : undefined);
}

/** Update the currently authenticated user's profile (requires JWT). */
export async function updateMe(dto: UpdateProfileDto): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

/**
 * Upload a profile photo file (JPEG/PNG/WebP, max 5 MB).
 * Sends multipart/form-data to POST /api/users/me/photo.
 * Returns the updated UserProfile with the new profilePhotoUrl.
 */
export async function uploadProfilePhoto(file: File): Promise<UserProfile> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const base = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
  const token = getClientToken();
  const formData = new FormData();
  formData.append("photo", file);

  const res = await fetch(`${base}/api/users/me/photo`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
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
