import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

function getEnv(key: string): string | undefined {
  try {
    return Deno.env.get(key);
  } catch {
    return undefined;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed.", 405);
  }

  const supabaseUrl = getEnv("SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return errorResponse("Server is not configured for account deletion.", 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const accessToken = authHeader.replace("Bearer ", "");
  if (!accessToken) {
    return errorResponse("Missing authorization header.", 401);
  }

  // Resolve the caller's identity from the presented JWT.
  const userClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return errorResponse("Invalid or expired session.", 401);
  }

  const userId = userData.user.id;

  // Only doctors may delete their own account.
  const { data: profile, error: profileError } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return errorResponse(`Failed to load profile: ${profileError.message}`, 500);
  }
  if (!profile) {
    return errorResponse("No profile found for this account.", 404);
  }
  if (profile.role !== "doctor") {
    return errorResponse("Only doctors can delete their own account.", 403);
  }

  // Anonymize the profile before deletion so the profiles row — which
  // cascades off auth.users — leaves no residual personally-identifying
  // information in any materialized views or caches.
  await userClient
    .from("profiles")
    .update({
      first_name: "Deleted",
      last_name: "User",
      email: `deleted-${userId}@deleted.local`,
    })
    .eq("id", userId);

  // Delete the auth user. Profiles cascade (profiles.id → auth.users.id
  // ON DELETE CASCADE); patient records are preserved because their
  // created_by FKs are ON DELETE SET NULL (see migration 00010).
  const { error: deleteError } = await userClient.auth.admin.deleteUser(userId);
  if (deleteError) {
    return errorResponse(`Failed to delete account: ${deleteError.message}`, 500);
  }

  return jsonResponse({ success: true });
});
