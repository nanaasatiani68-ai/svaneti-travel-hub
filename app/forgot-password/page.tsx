"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [email, setEmail] = useState("");
  const [loading, setLoading] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  async function sendResetLink(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const normalizedEmail = email
        .trim()
        .toLowerCase();

      if (!normalizedEmail) {
        setErrorMessage(
          "ჩაწერე ელფოსტის მისამართი."
        );
        return;
      }

      const redirectUrl =
        `${window.location.origin}/reset-password`;

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          normalizedEmail,
          {
            redirectTo: redirectUrl,
          }
        );

      if (error) {
        console.error(
          "Password reset error:",
          error
        );

        setErrorMessage(
          `პაროლის აღდგენის წერილი ვერ გაიგზავნა: ${error.message}`
        );

        return;
      }

      setSuccessMessage(
        "პაროლის აღდგენის ბმული გამოგზავნილია. შეამოწმე ელფოსტა და Spam საქაღალდეც."
      );

      setEmail("");
    } catch (error: unknown) {
      console.error(
        "Unexpected password reset error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა დაფიქსირდა.";

      setErrorMessage(
        `შეცდომა მოხდა: ${message}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
        <div className="text-center">
          <div className="text-6xl">🔑</div>

          <h1 className="mt-4 text-3xl font-extrabold">
            დაგავიწყდა პაროლი?
          </h1>

          <p className="mt-3 leading-6 text-slate-500">
            ჩაწერე ანგარიშზე გამოყენებული
            ელფოსტა და პაროლის აღდგენის ბმულს
            გამოგიგზავნით.
          </p>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
            ⚠️ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
            ✅ {successMessage}
          </div>
        )}

        <form
          onSubmit={sendResetLink}
          className="mt-7 space-y-5"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              ელფოსტა
            </span>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="example@email.com"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-cyan-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "წერილი იგზავნება..."
              : "აღდგენის ბმულის გაგზავნა"}
          </button>
        </form>

        <Link
          href="/login"
          className="mt-6 block text-center text-sm font-bold text-cyan-700 hover:text-cyan-800"
        >
          ← ანგარიშზე შესვლაზე დაბრუნება
        </Link>

        <Link
          href="/"
          className="mt-4 block text-center text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          მთავარ გვერდზე დაბრუნება
        </Link>
      </section>
    </main>
  );
}