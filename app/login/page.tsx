"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type UserProfile = {
  role: string | null;
};

export default function LoginPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function login(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setErrorMessage("");
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

      if (!password) {
        setErrorMessage("ჩაწერე პაროლი.");
        return;
      }

      const {
        data,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (loginError) {
        const errorText =
          loginError.message.toLowerCase();

        if (
          errorText.includes(
            "invalid login credentials"
          )
        ) {
          setErrorMessage(
            "ელფოსტა ან პაროლი არასწორია."
          );
        } else if (
          errorText.includes(
            "email not confirmed"
          )
        ) {
          setErrorMessage(
            "ელფოსტა ჯერ არ არის დადასტურებული. შეამოწმე ელფოსტაზე მიღებული წერილი."
          );
        } else {
          setErrorMessage(
            `შესვლა ვერ მოხერხდა: ${loginError.message}`
          );
        }

        return;
      }

      const user = data.user;
      const session = data.session;

      if (!user || !session) {
        setErrorMessage(
          "სესიის შექმნა ვერ მოხერხდა. სცადე თავიდან."
        );
        return;
      }

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "Profile loading error:",
          profileError
        );
      }

      const profile =
        profileData as UserProfile | null;

      const role = String(
        profile?.role ?? ""
      )
        .trim()
        .toLowerCase();

      let destination = "/dashboard";

      if (
        role === "director" ||
        role === "admin"
      ) {
        destination = "/admin-v2";
      } else if (role === "staff") {
        destination = "/staff";
      }

      /*
       * სრული გვერდის ჩატვირთვა საჭიროა,
       * რათა ახალი Supabase cookie სერვერმა
       * აუცილებლად დაინახოს.
       */
      window.location.assign(destination);
    } catch (error: unknown) {
      console.error(
        "Unexpected login error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა დაფიქსირდა.";

      setErrorMessage(
        `შესვლისას შეცდომა მოხდა: ${message}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
        <div className="text-center">
          <div className="text-6xl">🔐</div>

          <h1 className="mt-4 text-3xl font-extrabold">
            ანგარიშზე შესვლა
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            შედი Georgia Gateway Hub-ის
            ანგარიშზე
          </p>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
            ⚠️ {errorMessage}
          </div>
        )}

        <form
          onSubmit={login}
          className="mt-7 space-y-5"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              ელფოსტა
            </span>

            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </label>

          <label className="block">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-slate-700">
                პაროლი
              </span>

              <Link
                href="/forgot-password"
                className="text-sm font-bold text-cyan-700 transition hover:text-cyan-800"
              >
                დაგავიწყდა პაროლი?
              </Link>
            </div>

            <input
              type="password"
              placeholder="შეიყვანე პაროლი"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
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
              ? "მიმდინარეობს შესვლა..."
              : "შესვლა"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ანგარიში ჯერ არ გაქვს?{" "}
          <Link
            href="/signup"
            className="font-bold text-cyan-700 hover:text-cyan-800"
          >
            რეგისტრაცია
          </Link>
        </p>

        <Link
          href="/"
          className="mt-5 block text-center text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          ← მთავარ გვერდზე დაბრუნება
        </Link>
      </section>
    </main>
  );
}