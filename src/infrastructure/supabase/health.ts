import { getSupabaseClient } from "./client";
import type { PostgrestError } from "@supabase/supabase-js";

export interface HealthStatus {
  service: string;
  status: "healthy" | "unhealthy" | "checking";
  latencyMs: number;
  error?: string;
}

export interface HealthReport {
  timestamp: string;
  overall: "healthy" | "unhealthy" | "degraded";
  services: HealthStatus[];
}

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && err.message === "Failed to fetch") return true;
  if (err instanceof Error && err.message.toLowerCase().includes("fetch")) return true;
  if (err instanceof Error && err.message.toLowerCase().includes("network")) return true;
  if (typeof err === "object" && err !== null && "code" in err) {
    const pgErr = err as PostgrestError;
    if (pgErr.code === "PGRST301") return true;
  }
  return false;
}

async function checkService(name: string, check: () => Promise<void>): Promise<HealthStatus> {
  const start = performance.now();
  try {
    await check();
    return {
      service: name,
      status: "healthy",
      latencyMs: Math.round(performance.now() - start),
    };
  } catch (err) {
    const isNetwork = isNetworkError(err);
    return {
      service: name,
      status: isNetwork ? "unhealthy" : "healthy",
      latencyMs: Math.round(performance.now() - start),
      error: isNetwork ? (err instanceof Error ? err.message : "Connection failed") : undefined,
    };
  }
}

async function checkSupabaseConnection(
  client: ReturnType<typeof getSupabaseClient>,
): Promise<void> {
  await client.auth.getSession();
}

async function checkDatabaseConnectivity(
  client: ReturnType<typeof getSupabaseClient>,
): Promise<void> {
  const { error } = await client
    .from("_internal_connectivity_check")
    .select("*", { count: "exact", head: true });

  if (error && isNetworkError(error)) {
    throw error;
  }
}

async function checkAuthService(client: ReturnType<typeof getSupabaseClient>): Promise<void> {
  const { error } = await client.auth.getSession();
  if (error && isNetworkError(error)) {
    throw error;
  }
}

export async function runHealthCheck(): Promise<HealthReport> {
  const client = getSupabaseClient();

  const services = await Promise.all([
    checkService("Supabase Connection", () => checkSupabaseConnection(client)),
    checkService("Database Connectivity", () => checkDatabaseConnectivity(client)),
    checkService("Auth Service", () => checkAuthService(client)),
  ]);

  const hasUnhealthy = services.some((s) => s.status === "unhealthy");

  return {
    timestamp: new Date().toISOString(),
    overall: hasUnhealthy ? "degraded" : "healthy",
    services,
  };
}
