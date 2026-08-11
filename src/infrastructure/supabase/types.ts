export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface HealthCheckResponse {
  status: "ok" | "error";
  timestamp: string;
  message?: string;
}
