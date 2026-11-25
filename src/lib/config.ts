export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** False until the Supabase keys are set in .env.local (or the host's environment). */
export const SUPABASE_CONFIGURED = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
