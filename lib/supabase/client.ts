import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL გარემოს ცვლადი არ არის დამატებული."
    );
  }

  if (!supabaseKey) {
    throw new Error(
      "Supabase-ის საჯარო API key გარემოს ცვლადი არ არის დამატებული."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}