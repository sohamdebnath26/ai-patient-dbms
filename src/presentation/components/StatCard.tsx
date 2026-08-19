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
    <div className="group border-surface-200 rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold tracking-normal text-gray-900 uppercase">{label}</p>
          <div className="mt-4 min-h-[44px]">
            {loading ? (
              <Loader2 className="h-7 w-7 animate-spin text-gray-300" />
            ) : error ? (
              <p className="text-[44px] leading-none font-extrabold text-gray-400">—</p>
            ) : (
              <p className="text-[44px] leading-none font-extrabold tracking-tight text-gray-900">
                {value?.toLocaleString() ?? 0}
              </p>
            )}
          </div>
          {secondary && !loading && !error && (
            <p className="mt-2 text-sm font-medium text-gray-500">{secondary}</p>
          )}
        </div>
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${color} transition-transform duration-200 group-hover:scale-105`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
