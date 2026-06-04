/**
 * Dev-only Supabase connectivity check.
 * Run: node --env-file=.env.local --import tsx lib/supabase/test-connection.ts
 */

import { createClient } from "@supabase/supabase-js";

async function testConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error("FAIL: NEXT_PUBLIC_SUPABASE_URL or ANON_KEY missing in env");
    process.exit(1);
  }

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("FAIL: Supabase request error:", error.message);
    process.exit(1);
  }

  console.log("OK: Connected to Supabase");
  console.log(`    URL: ${url}`);
  console.log(
    `    Session: ${data.session ? "active" : "none (expected before login)"}`,
  );
}

testConnection().catch((err: unknown) => {
  console.error("FAIL:", err);
  process.exit(1);
});
