"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type TourRow = {
  id: number | string;
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
  const supabase = useMemo(() => createClient(), []);

  const [tours, setTours] = useState<TourWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadToursWithOwners() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (!cancelled) {
            setErrorMessage("ადმინისტრატორის ავტორიზაცია საჭიროა.");
            setLoading(false);
          }
          return;
        }

        const { data: currentProfile, error: currentProfileError } =
          await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (currentProfileError) {
          throw new Error(
            `ადმინისტრატორის პროფილის შემოწმება ვერ მოხერხდა: ${currentProfileError.message}`
          );
        }

        const role = String(currentProfile?.role || "").toLowerCase();

        if (role !== "director" && role !== "admin") {
          if (!cancelled) {
            setErrorMessage("ამ გვერდზე წვდომა მხოლოდ ადმინისტრატორს აქვს.");
            setLoading(false);
          }
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
          throw new Error(`ტურების ჩატვირთვა ვერ მოხერხდა: ${toursError.message}`);
        }

        const toursList = (toursData as TourRow[] | null) ?? [];

        const ownerIds = Array.from(
          new Set(
            toursList
              .map((tour) => tour.user_id)
              .filter((ownerId): ownerId is string => Boolean(ownerId))
          )
        );

        let profiles: ProfileRow[] = [];

        if (ownerIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, email, phone")
            .in("id", ownerIds);

          if (profilesError) {
            console.error("Owners loading error:", profilesError);
          } else {
            profiles = (profilesData as ProfileRow[] | null) ?? [];
          }
        }

        const profileMap = new Map(
          profiles.map((profile) => [
            profile.id,
            {
              name: profile.full_name || "მფლობელი არ არის მითითებული",
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

        if (!cancelled) {
          setTours(preparedTours);
          setLoading(false);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "მონაცემების ჩატვირთვა ვერ მოხერხდა."
          );
          setLoading(false);
        }
      }
    }

    loadToursWithOwners();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const filteredTours = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return tours;
    }

    return tours.filter((tour) => {
      return (
        String(tour.title || "").toLowerCase().includes(value) ||
        String(tour.location || "").toLowerCase().includes(value) ||
        String(tour.status || "").toLowerCase().includes(value) ||
        tour.owner_name.toLowerCase().includes(value) ||
        tour.owner_email.toLowerCase().includes(value) ||
        tour.owner_phone.toLowerCase().includes(value)
      );
    });
  }, [search, tours]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-400">
              Admin V2
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              🏔️ ტურები და მფლობელები
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-white/60 sm:text-base">
              აქ ჩანს ყველა ტური და მისი მფლობელის ინფორმაცია.
            </p>
          </div>

          <Link
            href="/admin-v2"
            className="inline-flex w-fit items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-bold transition hover:bg-white/15"
          >
            ← ადმინისტრაციაში დაბრუნება
          </Link>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="ყველა ტური" value={String(tours.length)} />
          <StatCard
            label="დამტკიცებული"
            value={String(
              tours.filter((tour) => tour.status === "approved").length
            )}
          />
          <StatCard
            label="მოლოდინში"
            value={String(
              tours.filter(
                (tour) => !tour.status || tour.status === "pending"
              ).length
            )}
          />
          <StatCard
            label="უარყოფილი"
            value={String(
              tours.filter((tour) => tour.status === "rejected").length
            )}
          />
        </div>

        <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl">
          <label
            htmlFor="tour-owner-search"
            className="mb-2 block text-sm font-bold text-white/70"
          >
            ძიება
          </label>

          <input
            id="tour-owner-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ტური, მფლობელი, ელფოსტა, ტელეფონი, ადგილი ან სტატუსი..."
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-400"
          />
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-lg font-bold">იტვირთება...</p>
            <p className="mt-2 text-sm text-white/50">
              ტურებისა და მფლობელების ინფორმაცია იტვირთება.
            </p>
          </div>
        ) : errorMessage ? (
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-5 text-red-100">
            <p className="font-bold">შეცდომა</p>
            <p className="mt-1 text-sm">{errorMessage}</p>
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-lg font-bold">ტურები ვერ მოიძებნა</p>
            <p className="mt-2 text-sm text-white/50">
              შეცვალე საძიებო სიტყვა და სცადე თავიდან.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 lg:hidden">
              {filteredTours.map((tour) => (
                <article
                  key={String(tour.id)}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-cyan-400">
                        ტური
                      </p>

                      <h2 className="mt-1 break-words text-xl font-extrabold">
                        {tour.title || "უსახელო ტური"}
                      </h2>

                      <p className="mt-1 text-sm text-white/50">
                        {tour.location || "ადგილი არ არის მითითებული"}
                      </p>
                    </div>

                    <StatusBadge status={tour.status} />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MobileInfo label="მფლობელი" value={tour.owner_name} />
                    <MobileInfo label="ელფოსტა" value={tour.owner_email} />
                    <MobileInfo label="ტელეფონი" value={tour.owner_phone} />
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
                          ? new Date(tour.created_at).toLocaleDateString("ka-GE")
                          : "არ არის მითითებული"
                      }
                    />
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/admin-v2/tours/${tour.id}`}
                      className="inline-flex rounded-xl bg-cyan-500 px-4 py-2 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-400"
                    >
                      დეტალების ნახვა
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/50">
                    <tr>
                      <th className="px-5 py-4">ტური</th>
                      <th className="px-5 py-4">მფლობელი</th>
                      <th className="px-5 py-4">კონტაქტი</th>
                      <th className="px-5 py-4">ადგილი</th>
                      <th className="px-5 py-4">ფასი</th>
                      <th className="px-5 py-4">სტატუსი</th>
                      <th className="px-5 py-4">თარიღი</th>
                      <th className="px-5 py-4">ქმედება</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTours.map((tour) => (
                      <tr
                        key={String(tour.id)}
                        className="border-t border-white/10 transition hover:bg-white/5"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold">
                            {tour.title || "უსახელო ტური"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold">{tour.owner_name}</p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="break-all text-white/70">
                            {tour.owner_email}
                          </p>
                          <p className="mt-1 text-white/50">
                            {tour.owner_phone}
                          </p>
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

                        <td className="px-5 py-4">
                          <Link
                            href={`/admin-v2/tours/${tour.id}`}
                            className="inline-flex rounded-xl bg-cyan-500 px-3 py-2 text-xs font-extrabold text-slate-950 transition hover:bg-cyan-400"
                          >
                            დეტალები
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
      <p className="text-xs font-bold uppercase tracking-wide text-white/40">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black">{value}</p>
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
        დამტკიცებული
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