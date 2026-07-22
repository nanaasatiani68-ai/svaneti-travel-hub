"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  full_name: string | null;
  role: string | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email || "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile loading error:", profileError);
      }

      const typedProfile = profile as Profile | null;

      setFullName(
        typedProfile?.full_name ||
          user.user_metadata?.full_name ||
          "მომხმარებელი"
      );

      setRole(typedProfile?.role || "user");
      setLoading(false);
    }

    loadUser();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="text-6xl">⏳</div>
          <p className="mt-4 font-semibold">პროფილი იტვირთება...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
                მომხმარებლის პანელი
              </p>

              <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                👋 გამარჯობა, {fullName}
              </h1>

              <p className="mt-2 text-white/60">{email}</p>

              <p className="mt-1 text-sm text-white/40">
                სტატუსი: {role}
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-2xl bg-red-500 px-6 py-3 font-bold text-white transition hover:bg-red-600"
            >
              🚪 გამოსვლა
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <DashboardCard
            href="/profile"
            icon="👤"
            title="ჩემი პროფილი"
            description="ნახე და შეცვალე პირადი ინფორმაცია."
          />

          <DashboardCard
            href="/dashboard/my-tours"
            icon="🏔️"
            title="ჩემი ტურები"
            description="ნახე მხოლოდ შენ მიერ დამატებული ტურები."
          />

          <DashboardCard
            href="/dashboard/add-tour"
            icon="➕"
            title="ტურის დამატება"
            description="დაამატე ახალი ტური დასამტკიცებლად."
          />

          <DashboardCard
            href="/dashboard/my-transfers"
            icon="🚐"
            title="ჩემი ტრანსფერები"
            description="ნახე მხოლოდ შენ მიერ დამატებული ტრანსფერები."
          />

          <DashboardCard
            href="/dashboard/add-transfer"
            icon="➕"
            title="ტრანსფერის დამატება"
            description="დაამატე ახალი ტრანსფერი."
          />

          <DashboardCard
            href="/dashboard/add-hotel"
            icon="🏨"
            title="სასტუმროს დამატება"
            description="დაამატე სასტუმრო დასამტკიცებლად."
          />

          <DashboardCard
            href="/dashboard/bookings"
            icon="📅"
            title="ჩემი ჯავშნები"
            description="ნახე შენი ჯავშნები და მოთხოვნები."
          />

          <DashboardCard
            href="/dashboard/favorites"
            icon="❤️"
            title="ფავორიტები"
            description="შენახული ტურები და სასტუმროები."
          />

          <DashboardCard
            href="/"
            icon="🏠"
            title="მთავარ გვერდზე დაბრუნება"
            description="გადადით Georgia Travel Hub-ის მთავარ გვერდზე."
          />
        </div>
      </div>
    </main>
  );
}

function DashboardCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl transition hover:-translate-y-1 hover:bg-white/15"
    >
      <div className="text-5xl">{icon}</div>

      <h2 className="mt-5 text-2xl font-extrabold">{title}</h2>

      <p className="mt-3 leading-7 text-white/60">{description}</p>
    </Link>
  );
}