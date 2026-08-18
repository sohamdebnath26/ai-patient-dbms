import type { PatientStatus } from "@domain/patient";

export const inputClass =
  "focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none";
export const labelClass = "block text-sm font-medium text-gray-700";

export function computeAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function statusBadgeClass(status: PatientStatus): string {
  switch (status) {
    case "active":
      return "bg-green-50 text-green-700";
    case "inactive":
      return "bg-yellow-50 text-yellow-700";
    case "deceased":
      return "bg-gray-100 text-gray-600";
    case "deregistered":
      return "bg-orange-50 text-orange-600";
    case "archived":
      return "bg-red-50 text-red-600";
  }
}

export function severityBadgeClass(severity: string): string {
  if (severity === "severe" || severity === "life_threatening") {
    return "bg-red-50 text-red-700 border-red-200";
  }
  if (severity === "moderate") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-blue-50 text-blue-700 border-blue-200";
}

export interface ClinicalImage {
  id: string;
  url: string;
  name: string;
  uploadedAt: string;
  bodyArea: string;
  diagnosis: string;
  notes: string;
}
