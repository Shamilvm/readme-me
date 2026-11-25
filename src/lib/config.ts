export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * When Supabase isn't configured yet, the app runs in demo mode:
 * no sign-in, answers are kept in this browser only. Handy for previewing.
 */
export const DEMO_MODE = !SUPABASE_URL || !SUPABASE_ANON_KEY;
