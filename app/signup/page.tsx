"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!fullName.trim()) {
      setErrorMessage("ჩაწერე სახელი და გვარი.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("ჩაწერე ელფოსტა.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("პაროლები ერთმანეთს არ ემთხვევა.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: data.user.id,
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            role: "user",
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }
    }

    setLoading(false);

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setSuccessMessage(
      "რეგისტრაცია წარმატებით დასრულდა. შეამოწმე ელფოსტა ანგარიშის დასადასტურებლად."
    );

    setFullName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
        <div className="text-center">
          <div className="text-5xl">🏔️</div>

          <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
            ანგარიშის შექმნა
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            დარეგისტრირდი Georgia Travel Hub-ზე
          </p>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSignup} className="mt-7 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              სახელი და გვარი
            </span>

            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="მაგალითად: Anna Brown"
              autoComplete="name"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              ელფოსტა
            </span>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@email.com"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              ტელეფონის ნომერი
            </span>

            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+995 5XX XX XX XX"
              autoComplete="tel"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              პაროლი
            </span>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="მინიმუმ 6 სიმბოლო"
              autoComplete="new-password"
              minLength={6}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              გაიმეორე პაროლი
            </span>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="პაროლი კიდევ ერთხელ"
              autoComplete="new-password"
              minLength={6}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-cyan-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "რეგისტრაცია მიმდინარეობს..." : "რეგისტრაცია"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          უკვე გაქვს ანგარიში?{" "}
          <Link
            href="/login"
            className="font-bold text-cyan-700 hover:text-cyan-800"
          >
            შესვლა
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