"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type TourRow = {
  id: number;
  title: string | null;
  location: string | null;
  price: number | null;
  status: string | null;
  user_id: string | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type TourWithOwner = TourRow & {
  owner_name: string;
  owner_email: string;
  owner_phone: string;
};

export default function AdminTourOwnersPage() {
  const [tours, setTours] = useState<TourWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadToursWithOwners() {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrorMessage("ადმინისტრატორის ავტორიზაცია საჭიროა.");
        setLoading(false);
        return;
      }

      const { data: currentProfile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setErrorMessage(
          `ადმინისტრატორის პროფილის შემოწმება ვერ მოხერხდა: ${profileError.message}`
        );
        setLoading(false);
        return;
      }

      const role = String(currentProfile?.role || "").toLowerCase();

      if (role !== "director" && role !== "admin") {
        setErrorMessage("ამ გვერდზე წვდომა მხოლოდ ადმინისტრატორს აქვს.");
        setLoading(false);
        return;
      }

      const { data: toursData, error: toursError } = await supabase
        .from("tours")
        .select(
          `
            id,
            title,
            location,
            price,
            status,
            user_id,
            created_at
          `
        )
        .order("created_at", { ascending: false });

      if (toursError) {
        setErrorMessage(
          `ტურების ჩატვირთვა ვერ მოხერხდა: ${toursError.message}`
        );
        setLoading(false);
        return;
      }

      const toursList = (toursData ?? []) as TourRow[];

      const ownerIds = Array.from(
        new Set(
          toursList
            .map((tour) => tour.user_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      let profilesList: ProfileRow[] = [];

      if (ownerIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .in("id", ownerIds);

        if (profilesError) {
          console.error("Profiles loading error:", profilesError);
        } else {
          profilesList = (profilesData ?? []) as ProfileRow[];
        }
      }

      const profileMap = new Map(
        profilesList.map((profile) => [
          profile.id,
          {
            name: profile.full_name || "სახელი არ არის მითითებული",
            email: profile.email || "ელფოსტა არ არის მითითებული",
            phone: profile.phone || "ტელეფონი არ არის მითითებული",
          },
        ])
      );

      const preparedTours: TourWithOwner[] = toursList.map((tour) => {
        const owner = tour.user_id
          ? profileMap.get(tour.user_id)
          : undefined;

        return {
          ...tour,
          owner_name: owner?.name || "მფლობელი არ არის მითითებული",
          owner_email: owner?.email || "ელფოსტა არ არის მითითებული",
          owner_phone: owner?.phone || "ტელეფონი არ არის მითითებული",
        };
      });

      setTours(preparedTours);
      setLoading(false);
    }

    loadToursWithOwners();
  }, []);

  const filteredTours = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return tours;
    }

    return tours.filter((tour) => {
      return (
        String(tour.title || "").toLowerCase().includes(value) ||
        tour.owner_name.toLowerCase().includes(value) ||
        tour.owner_email.toLowerCase().includes(value) ||
        String(tour.location || "").toLowerCase().includes(value) ||
        String(tour.status || "").toLowerCase().includes(value)
      );
    });
  }, [search, tours]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6 text-white">
        <h1 className="text-3xl font-bold">🏔️ ტურები და მფლობელები</h1>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-6">
          მონაცემები იტვირთება...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6 text-white">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">
            Admin V2
          </p>

          <h1 className="mt-2 text-3xl font-extrabold">
            🏔️ ტურები და მფლობელები
          </h1>

          <p className="mt-2 text-white/60">
            აქ ჩანს ყველა ტური და მისი მფლობელის ინფორმაცია.
          </p>
        </div>

        <Link
          href="/admin-v2"
          className="inline-flex w-fit rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20"
        >
          ← ადმინისტრაციაში დაბრუნება
        </Link>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 font-semibold text-red-200">
          {errorMessage}
        </div>
      )}

      {!errorMessage && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="მოძებნე ტური, მფლობელი, ელფოსტა ან მდებარეობა..."
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white outline-none placeholder:text-white/40 focus:border-cyan-400"
            />

            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 font-bold">
              სულ: {filteredTours.length}
            </div>
          </div>

          {filteredTours.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/10 p-10 text-center">
              <div className="mb-4 text-6xl">📭</div>

              <h2 className="text-2xl font-bold">ტურები ვერ მოიძებნა</h2>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/10 shadow-2xl">
              <table className="min-w-[1200px] w-full border-collapse">
                <thead className="bg-white/10">
                  <tr className="text-left text-sm uppercase tracking-wide text-white/60">
                    <th className="px-5 py-4">ტური</th>
                    <th className="px-5 py-4">მფლობელი</th>
                    <th className="px-5 py-4">ელფოსტა</th>
                    <th className="px-5 py-4">ტელეფონი</th>
                    <th className="px-5 py-4">მდებარეობა</th>
                    <th className="px-5 py-4">ფასი</th>
                    <th className="px-5 py-4">სტატუსი</th>
                    <th className="px-5 py-4">დამატების თარიღი</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTours.map((tour) => (
                    <tr
                      key={tour.id}
                      className="border-t border-white/10 transition hover:bg-white/5"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-bold">
                            {tour.title || "უსახელო ტური"}
                          </p>

                          <p className="mt-1 text-xs text-white/40">
                            ID: {tour.id}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {tour.owner_name}
                      </td>

                      <td className="px-5 py-4 text-white/70">
                        {tour.owner_email}
                      </td>

                      <td className="px-5 py-4 text-white/70">
                        {tour.owner_phone}
                      </td>

                      <td className="px-5 py-4 text-white/70">
                        {tour.location || "არ არის მითითებული"}
                      </td>

                      <td className="px-5 py-4 font-bold text-cyan-300">
                        {tour.price !== null
                          ? `${Number(tour.price).toLocaleString()} ₾`
                          : "შეთანხმებით"}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={tour.status} />
                      </td>

                      <td className="px-5 py-4 text-white/70">
                        {tour.created_at
                          ? new Date(tour.created_at).toLocaleDateString("ka-GE")
                          : "არ არის მითითებული"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const normalizedStatus = status || "pending";

  if (normalizedStatus === "approved") {
    return (
      <span className="inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
        დადასტურებული
      </span>
    );
  }

  if (normalizedStatus === "rejected") {
    return (
      <span className="inline-flex rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300">
        უარყოფილი
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
      მოლოდინში
    </span>
  );
}