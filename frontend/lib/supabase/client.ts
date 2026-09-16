"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly in dev rather than silently making requests to `undefined`.
  // eslint-disable-next-line no-console
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — copy .env.local.example to .env.local."
  );
}

// A single browser-side Supabase client for Auth (sign up / sign in / session).
// This uses the anon key only — safe to ship to the client, and it's the
// public.workspaces RLS policies (scoped to auth.uid()) that keep data
// private, not secrecy of this key.
export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
