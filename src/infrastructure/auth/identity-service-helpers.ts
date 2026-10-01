import type { Prisma } from "@/generated/prisma/client";

export const MAX_EMAIL = 320;
export const MAX_PASSWORD = 1024;
export const MIN_NEW_PASSWORD = 10;
export const MAX_DISPLAY_NAME = 160;
export const MAX_PHONE = 32;

export function normalizeEmail(value: string): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= MAX_EMAIL && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function normalizePassword(value: string): string | null {
  if (typeof value !== "string" || value.length === 0 || new TextEncoder().encode(value).byteLength > MAX_PASSWORD) return null;
  return value;
}

export function normalizeNewPassword(value: string): string | null {
  const password = normalizePassword(value);
  return password && Array.from(password).length >= MIN_NEW_PASSWORD ? password : null;
}

export function normalizeOptional(value: string | undefined, max: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length <= max ? normalized || null : null;
}

export function isValidDate(value: Date): boolean {
  return value instanceof Date && Number.isFinite(value.getTime());
}

export function auditData(value: Record<string, unknown>): Prisma.InputJsonObject {
  return value as Prisma.InputJsonObject;
}

export function sessionKind(kind: "CUSTOMER" | "ADMIN"): "customer" | "admin" {
  return kind === "ADMIN" ? "admin" : "customer";
}

export function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2002";
}
