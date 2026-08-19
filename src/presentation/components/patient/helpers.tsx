import { type ReactNode } from "react";
import { inputClass } from "./utils";

export function SectionHeading({
  icon,
  title,
  badge,
}: {
  icon?: ReactNode;
  title: string;
  badge?: ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
      {icon && <span className="text-brand-600">{icon}</span>}
      {title}
      {badge}
    </h3>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export function SummaryItem({
  label,
  value,
  mono = false,
  truncate = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p
        className={`text-sm text-gray-900 ${mono ? "font-mono text-xs" : ""} ${truncate ? "max-w-[200px] truncate" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

export function MedicationField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        className={inputClass}
      />
    </div>
  );
}

export function NoteField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      <textarea
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        rows={2}
        className={inputClass}
      />
    </div>
  );
}

export function AppointmentStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export function NoteBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-xs font-bold text-gray-400">{label}</span>
      <p className="flex-1 text-gray-700">{value}</p>
    </div>
  );
}

export function AiSummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
      <p className="mt-0.5 text-gray-800">{value}</p>
    </div>
  );
}

export function AuditItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className={`text-right text-gray-900 ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
