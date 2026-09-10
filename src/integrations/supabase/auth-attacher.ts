import { supabase } from "./client";

// Stub para evitar a quebra do build sem depender do createMiddleware
export const attachSupabaseAuth = {
  client: (fn: any) => fn,
  server: (fn: any) => fn,
  middleware: [] as any[],
};
