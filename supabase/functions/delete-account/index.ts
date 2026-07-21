import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });

  const authorization = request.headers.get("Authorization");
  if (!authorization) return json(401, { error: "Authentication required" });

  let body: { confirmation?: string } = {};
  try {
    body = await request.json();
  } catch (_error) {
    return json(400, { error: "Invalid request" });
  }
  if (body.confirmation !== "HAPUS") return json(400, { error: "Confirmation required" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json(500, { error: "Server configuration unavailable" });

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false }
  });
  const userResult = await userClient.auth.getUser();
  if (userResult.error || !userResult.data.user) return json(401, { error: "Invalid session" });

  const userId = userResult.data.user.id;
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  for (const table of ["family_agenda", "sloka_notes", "saved_slokas"]) {
    const result = await admin.from(table).delete().eq("user_id", userId);
    const missingTable = result.error && (result.error.code === "PGRST205" || result.error.code === "42P01" || result.error.message.toLowerCase().includes("does not exist"));
    if (result.error && !missingTable) {
      console.error(`Failed deleting ${table}:`, result.error.message);
      return json(500, { error: "Account data could not be deleted" });
    }
  }

  const deletion = await admin.auth.admin.deleteUser(userId);
  if (deletion.error) {
    console.error("Failed deleting auth user:", deletion.error.message);
    return json(500, { error: "Account could not be deleted" });
  }

  return json(200, { deleted: true });
});
