"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

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
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
          <div
            className="relative bg-cover bg-center p-6 sm:p-8"
            style={{
              backgroundImage:
                "linear-gradient(rgba(2, 6, 23, 0.78), rgba(8, 47, 73, 0.72)), url('/dashboard/all-tours.jpg')",
            }}
          >
            <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
                  მომხმარებლის პანელი
                </p>

                <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                  👋 გამარჯობა, {fullName}
                </h1>

                <p className="mt-2 text-white/70">{email}</p>

                <p className="mt-1 text-sm text-white/50">
                  სტატუსი: {role}
                </p>
              </div>

              <button
                type="button"
                onClick={logout}
                className="w-fit rounded-2xl bg-red-500 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-red-600"
              >
                🚪 გამოსვლა
              </button>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <DashboardCard
            href="/tours"
            image="/dashboard/all-tours.jpg"
            icon="🌍"
            title="ყველა ტური"
            description="ნახე ყველა დამტკიცებული ტური და დაჯავშნე."
            featured
          />

          <DashboardCard
            href="/transfers"
            image="/dashboard/transfers.jpg"
            icon="🚐"
            title="ყველა ტრანსფერი"
            description="ნახე ყველა დამტკიცებული ტრანსფერი და დაჯავშნე."
            featured
          />

          <DashboardCard
            href="/profile"
            image="/dashboard/profile.jpg"
            icon="👤"
            title="ჩემი პროფილი"
            description="ნახე და შეცვალე პირადი ინფორმაცია."
          />

          <DashboardCard
            href="/dashboard/my-tours"
            image="/dashboard/my-tours.jpg"
            icon="🏔️"
            title="ჩემი ტურები"
            description="ნახე მხოლოდ შენ მიერ დამატებული ტურები."
          />

          <DashboardCard
            href="/dashboard/add-tour"
            image="/dashboard/add-tour.jpg"
            icon="➕"
            title="ტურის დამატება"
            description="დაამატე ახალი ტური დასამტკიცებლად."
          />

          <DashboardCard
            href="/dashboard/my-transfers"
            image="/dashboard/transfers.jpg"
            icon="🚐"
            title="ჩემი ტრანსფერები"
            description="ნახე მხოლოდ შენ მიერ დამატებული ტრანსფერები."
          />

          <DashboardCard
            href="/dashboard/add-transfer"
            image="/dashboard/add-transfer.jpg"
            icon="➕"
            title="ტრანსფერის დამატება"
            description="დაამატე ახალი ტრანსფერი."
          />

          <DashboardCard
            href="/dashboard/add-hotel"
            image="/dashboard/hotel.jpg"
            icon="🏨"
            title="სასტუმროს დამატება"
            description="დაამატე სასტუმრო დასამტკიცებლად."
          />

          <DashboardCard
            href="/dashboard/bookings"
            image="/dashboard/bookings.jpg"
            icon="📅"
            title="ჩემი ჯავშნები"
            description="ნახე შენი ჯავშნები და მოთხოვნები."
          />

          <DashboardCard
            href="/dashboard/favorites"
            image="/dashboard/favorites.jpg"
            icon="❤️"
            title="ფავორიტები"
            description="შენახული ტურები და სასტუმროები."
          />

          <DashboardCard
            href="/"
            image="/dashboard/home.jpg"
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
  image,
  icon,
  title,
  description,
  featured = false,
}: {
  href: string;
  image: string;
  icon: string;
  title: string;
  description: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative min-h-[185px] overflow-hidden rounded-2xl border shadow-xl transition duration-300 hover:-translate-y-1 ${
        featured ? "border-cyan-300/70" : "border-white/15"
      }`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
        style={{
          backgroundImage: `url('${image}')`,
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/25" />

      {featured && (
        <div className="absolute right-3 top-3 z-10 rounded-full bg-cyan-400 px-3 py-1 text-[10px] font-black text-slate-950 shadow-lg">
          პოპულარული
        </div>
      )}

      <div className="relative z-10 flex min-h-[185px] flex-col justify-end p-4">
        <div className="text-3xl drop-shadow-lg">{icon}</div>

        <h2 className="mt-2 text-lg font-extrabold leading-tight text-white drop-shadow-lg">
          {title}
        </h2>

        <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/75">
          {description}
        </p>

        <div className="mt-3 inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md transition group-hover:bg-cyan-500">
          გახსნა →
        </div>
      </div>
    </Link>
  );
}<DashboardCard
  href="/hotels"
  image="/dashboard/hotel.jpg"
  icon="🏨"
  title="ყველა სასტუმრო"
  description="ნახე ყველა დამტკიცებული სასტუმრო და დაჯავშნე."
  featured
/>