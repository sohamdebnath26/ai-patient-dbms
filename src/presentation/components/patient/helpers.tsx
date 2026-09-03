import { type ReactNode } from "react";
import { inputClass } from "./utils";
import { Loader2 } from "lucide-react";

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

export function TextField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  span,
  type = "text",
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  span?: "full";
  type?: string;
  id?: string;
}) {
  return (
    <div className={span === "full" ? "col-span-2" : ""}>
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        disabled={disabled}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  span,
  rows = 3,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  span?: "full";
  rows?: number;
  id?: string;
}) {
  return (
    <div className={span === "full" ? "col-span-2" : ""}>
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        className={inputClass}
      />
    </div>
  );
}

export function LoadingButton({
  onClick,
  disabled,
  loading,
  icon: Icon,
  label,
  variant = "primary",
  type = "button",
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  label: string;
  variant?: "primary" | "secondary" | "danger";
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
        variant === "danger"
          ? "bg-red-600 text-white hover:bg-red-700"
          : variant === "secondary"
            ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
            : "bg-brand-600 hover:bg-brand-700 text-white"
      }`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon}
      {loading ? "Saving..." : label}
    </button>
  );
}
