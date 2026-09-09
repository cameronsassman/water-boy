import { createClient } from "@supabase/supabase-js";

// Fail fast instead of hanging indefinitely if Supabase is slow or
// unreachable. Without this, a slow/down database (connection pool
// exhaustion, network blip, etc.) can make a page hang for a very long
// time — Next's static-generation timeout is 60s — instead of failing
// fast so the app can degrade gracefully.
const timeoutFetch: typeof fetch = (url, options) =>
  fetch(url, { ...options, signal: AbortSignal.timeout(10_000) });

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { global: { fetch: timeoutFetch } }
);
