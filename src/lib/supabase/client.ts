"use client";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

// Config pública do projeto QIMO (a anon key é pública por design; o acesso
// é protegido por RLS — as tabelas bordeaux_* só respondem a usuários logados).
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vvvzitszfcajfrvzpace.supabase.co";
const SUPABASE_ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dnppdHN6ZmNhamZydnpwYWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzODMyMzIsImV4cCI6MjA5Mzk1OTIzMn0.4tBzaBgyvzwuTEvlX9wSc85c6EKtTVfEidYeeh6aGRw";

let _client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!_client) {
    _client = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "qimo-admin-auth" },
    });
  }
  return _client;
}

export function isSupabaseConfigured() {
  return !!SUPABASE_URL && !!SUPABASE_ANON;
}
