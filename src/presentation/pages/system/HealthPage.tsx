import { useEffect, useState } from "react";
import { runHealthCheck } from "@infrastructure/supabase/health";
import type { HealthStatus } from "@infrastructure/supabase/health";
import { Activity, CheckCircle2, XCircle, Server, Database, Shield } from "lucide-react";

const statusColors: Record<HealthStatus["status"], string> = {
  healthy: "text-clinical-500",
  unhealthy: "text-red-500",
  checking: "text-yellow-500",
};

const statusBg: Record<HealthStatus["status"], string> = {
  healthy: "bg-green-50 border-green-200",
  unhealthy: "bg-red-50 border-red-200",
  checking: "bg-yellow-50 border-yellow-200",
};

const serviceIcons: Record<string, React.ReactNode> = {
  "Supabase Connection": <Server className="h-5 w-5" />,
  "Database Connectivity": <Database className="h-5 w-5" />,
  "Auth Service": <Shield className="h-5 w-5" />,
};

export function HealthPage() {
  const [services, setServices] = useState<HealthStatus[]>([
    { service: "Supabase Connection", status: "checking", latencyMs: 0 },
    { service: "Database Connectivity", status: "checking", latencyMs: 0 },
    { service: "Auth Service", status: "checking", latencyMs: 0 },
  ]);
  const [overall, setOverall] = useState<"healthy" | "unhealthy" | "degraded" | "checking">(
    "checking",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const report = await runHealthCheck();
        if (!cancelled) {
          setServices(report.services);
          setOverall(report.overall);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Health check failed");
          setOverall("unhealthy");
        }
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="bg-brand-600 flex h-12 w-12 items-center justify-center rounded-xl text-white">
              <Activity className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">System Diagnostics</h1>
          <p className="mt-1 text-sm text-gray-500">Supabase Connection Health</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div
          className={`mb-6 rounded-lg border p-4 text-center ${
            overall === "healthy"
              ? "border-green-200 bg-green-50"
              : overall === "unhealthy"
                ? "border-red-200 bg-red-50"
                : "border-yellow-200 bg-yellow-50"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {overall === "healthy" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : overall === "unhealthy" ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : (
              <Activity className="h-5 w-5 animate-spin text-yellow-600" />
            )}
            <span className="font-semibold text-gray-900">
              {overall === "healthy"
                ? "All Systems Operational"
                : overall === "unhealthy"
                  ? "System Unhealthy"
                  : "Checking..."}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {services.map((svc) => (
            <div
              key={svc.service}
              className={`flex items-center gap-3 rounded-lg border p-4 ${statusBg[svc.status]}`}
            >
              <span className={statusColors[svc.status]}>
                {serviceIcons[svc.service] ?? <Server className="h-5 w-5" />}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{svc.service}</p>
                {svc.error && <p className="text-xs text-red-600">{svc.error}</p>}
              </div>
              <div className="flex items-center gap-1 text-right">
                {svc.status === "healthy" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : svc.status === "unhealthy" ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <Activity className="h-4 w-4 animate-spin text-yellow-500" />
                )}
                {svc.latencyMs > 0 && (
                  <span className="text-xs text-gray-500">{svc.latencyMs}ms</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Project: clinic-os-dev · Region: ap-south-1
        </p>
      </div>
    </div>
  );
}
