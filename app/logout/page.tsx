"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LogoutPage() {
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function logout() {
      setErrorMessage("");

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        setErrorMessage(`ანგარიშიდან გამოსვლა ვერ მოხერხდა: ${error.message}`);
        return;
      }

      router.replace("/login");
      router.refresh();
    }

    logout();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl">
        {errorMessage ? (
          <>
            <div className="text-6xl">⚠️</div>

            <h1 className="mt-5 text-2xl font-extrabold">
              გამოსვლა ვერ მოხერხდა
            </h1>

            <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
              {errorMessage}
            </p>

            <Link
              href="/dashboard"
              className="mt-6 inline-flex rounded-2xl bg-cyan-500 px-6 py-3 font-bold text-white transition hover:bg-cyan-600"
            >
              Dashboard-ზე დაბრუნება
            </Link>
          </>
        ) : (
          <>
            <div className="text-6xl">🚪</div>

            <h1 className="mt-5 text-2xl font-extrabold">
              ანგარიშიდან გამოსვლა
            </h1>

            <p className="mt-3 text-white/60">
              გთხოვ დაელოდე, ანგარიშიდან გამოდიხარ...
            </p>

            <div className="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-cyan-400" />
          </>
        )}
      </section>
    </main>
  );
}