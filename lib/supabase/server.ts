import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey = getSupabaseKey();

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL გარემოს ცვლადი არ არის დამატებული."
    );
  }

  if (!supabaseKey) {
    throw new Error(
      "Supabase-ის Publishable ან Anon key არ არის დამატებული."
    );
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set(
                  name,
                  value,
                  options
                );
              }
            );
          } catch {
            /*
             * Server Component-ში cookie-ის ჩაწერა
             * შეიძლება შეუძლებელი იყოს.
             * ასეთ დროს Proxy განაახლებს სესიას.
             */
          }
        },
      },
    }
  );
}