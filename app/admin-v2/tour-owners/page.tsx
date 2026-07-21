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
        tour.owner_phone.toLowerCase().includes(value) ||
        String(tour.location || "").toLowerCase().includes(value) ||
        String(tour.status || "").toLowerCase().includes(value)
      );
    });
  }, [search, tours]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 text-white sm:px-6">
        <h1 className="text-2xl font-bold sm:text-3xl">
          🏔️ ტურები და მფლობელები
        </h1>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-6">
          მონაცემები იტვირთება...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400 sm:text-sm">
            Admin V2
          </p>

          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            🏔️ ტურები და მფლობელები
          </h1>

          <p className="mt-2 text-sm leading-6 text-white/60 sm:text-base">
            აქ ჩანს ყველა ტური და მისი მფლობელის ინფორმაცია.
          </p>
        </div>

        <Link
          href="/admin-v2"
          className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold transition hover:bg-white/20 sm:w-fit"
        >
          ← ადმინისტრაციაში დაბრუნება
        </Link>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-sm font-semibold text-red-200">
          {errorMessage}
        </div>
      )}

      {!errorMessage && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="მოძებნე ტური ან მფლობელი..."
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-cyan-400 sm:px-5 sm:text-base"
            />

            <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-bold sm:text-base">
              სულ: {filteredTours.length}
            </div>
          </div>

          {filteredTours.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-center sm:p-10">
              <div className="mb-4 text-5xl sm:text-6xl">📭</div>

              <h2 className="text-xl font-bold sm:text-2xl">
                ტურები ვერ მოიძებნა
              </h2>
            </div>
          ) : (
            <>
              {/* მობილურის ბარათები */}
              <div className="space-y-4 lg:hidden">
                {filteredTours.map((tour) => (
                  <article
                    key={tour.id}
                    className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-cyan-400">
                          ტური
                        </p>

                        <h2 className="mt-1 break-words text-xl font-extrabold">
                          {tour.title || "უსახელო ტური"}
                        </h2>

                        <p className="mt-1 text-xs text-white/40">
                          ID: {tour.id}
                        </p>
                      </div>

                      <StatusBadge status={tour.status} />
                    </div>

                    <div className="mt-5 space-y-3">
                      <MobileInfo
                        label="მფლობელი"
                        value={tour.owner_name}
                      />

                      <MobileInfo
                        label="ელფოსტა"
                        value={tour.owner_email}
                      />

                      <MobileInfo
                        label="ტელეფონი"
                        value={tour.owner_phone}
                      />

                      <MobileInfo
                        label="მდებარეობა"
                        value={tour.location || "არ არის მითითებული"}
                      />

                      <MobileInfo
                        label="ფასი"
                        value={
                          tour.price !== null
                            ? `${Number(tour.price).toLocaleString()} ₾`
                            : "შეთანხმებით"
                        }
                      />

                      <MobileInfo
                        label="დამატების თარიღი"
                        value={
                          tour.created_at
                            ? new Date(tour.created_at).toLocaleDateString(
                                "ka-GE"
                              )
                            : "არ არის მითითებული"
                        }
                      />
                    </div>
                  </article>
                ))}
              </div>

              {/* კომპიუტერის ცხრილი */}
              <div className="hidden overflow-x-auto rounded-3xl border border-white/10 bg-white/10 shadow-2xl lg:block">
                <table className="w-full min-w-[1200px] border-collapse">
                  <thead className="bg-white/10">
                    <tr className="text-left text-sm uppercase tracking-wide text-white/60">
                      <th className="px-5 py-4">ტური</th>
                      <th className="px-5 py-4">მფლობელი</th>
                      <th className="px-5 py-4">ელფოსტა</th>
                      <th className="px-5 py-4">ტელეფონი</th>
                      <th className="px-5 py-4">მდებარეობა</th>
                      <th className="px-5 py-4">ფასი</th>
                      <th className="px-5 py-4">სტატუსი</th>
                      <th className="px-5 py-4">თარიღი</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTours.map((tour) => (
                      <tr
                        key={tour.id}
                        className="border-t border-white/10 transition hover:bg-white/5"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold">
                            {tour.title || "უსახელო ტური"}
                          </p>

                          <p className="mt-1 text-xs text-white/40">
                            ID: {tour.id}
                          </p>
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
                            ? new Date(tour.created_at).toLocaleDateString(
                                "ka-GE"
                              )
                            : "არ არის მითითებული"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function MobileInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-black/20 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-white/40">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const normalizedStatus = status || "pending";

  if (normalizedStatus === "approved") {
    return (
      <span className="inline-flex shrink-0 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
        დადასტურებული
      </span>
    );
  }

  if (normalizedStatus === "rejected") {
    return (
      <span className="inline-flex shrink-0 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300">
        უარყოფილი
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
      მოლოდინში
    </span>
  );
}