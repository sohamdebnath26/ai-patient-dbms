import { type LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | undefined;
  secondary?: string;
  icon: LucideIcon;
  color: string;
  loading?: boolean;
  error?: boolean;
}

export function StatCard({
  label,
  value,
  secondary,
  icon: Icon,
  color,
  loading,
  error,
}: StatCardProps) {
  return (
    <div className="group border-surface-200 rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wider text-gray-400 uppercase">{label}</p>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          ) : error ? (
            <p className="text-lg font-bold text-red-400">—</p>
          ) : (
            <p className="text-3xl font-bold tracking-tight text-gray-900">
              {value?.toLocaleString() ?? 0}
            </p>
          )}
          {secondary && !loading && !error && <p className="text-xs text-gray-400">{secondary}</p>}
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-105`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
