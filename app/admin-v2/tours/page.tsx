import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { approveTour } from "./actions";
import RejectTourForm from "./RejectTourForm";
import DeleteTourButton from "./DeleteTourButton";

type TourStatus = "pending" | "approved" | "rejected" | string;

type SearchParams = {
  success?: string;
  error?: string;
};

type Tour = {
  id: number | string;
  user_id: string | null;
  title: string | null;
  location: string | null;
  price: number | null;
  duration: string | null;
  max_people: number | null;
  start_date: string | null;
  category: string | null;
  description: string | null;
  image_url: string | null;
  status: TourStatus | null;
  rejection_reason: string | null;
  submitted_at: string | null;
  created_at: string | null;
};

type OwnerProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  bio: string | null;
};

type TourWithOwner = Tour & {
  owner: OwnerProfile | null;
};

type AdminToursPageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function AdminToursPage({
  searchParams,
}: AdminToursPageProps) {
  const params = searchParams ? await searchParams : {};

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tours")
    .select(
      `
        id,
        user_id,
        title,
        location,
        price,
        duration,
        max_people,
        start_date,
        category,
        description,
        image_url,
        status,
        rejection_reason,
        submitted_at,
        created_at
      `
    )
    .order("created_at", { ascending: false });

  const rawTours = (data as Tour[] | null) ?? [];

  const ownerIds = Array.from(
    new Set(
      rawTours
        .map((tour) => tour.user_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  let ownerProfiles: OwnerProfile[] = [];
  let profilesErrorMessage = "";

  if (ownerIds.length > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select(
        `
          id,
          full_name,
          avatar_url,
          phone,
          country,
          city,
          bio
        `
      )
      .in("id", ownerIds);

    if (profilesError) {
      profilesErrorMessage = profilesError.message;
    } else {
      ownerProfiles = (profilesData as OwnerProfile[] | null) ?? [];
    }
  }

  const profileMap = new Map(
    ownerProfiles.map((profile) => [profile.id, profile])
  );

  const tours: TourWithOwner[] = rawTours.map((tour) => ({
    ...tour,
    owner: tour.user_id ? profileMap.get(tour.user_id) ?? null : null,
  }));

  const pendingCount = tours.filter(
    (tour) => tour.status === "pending"
  ).length;

  const approvedCount = tours.filter(
    (tour) => tour.status === "approved"
  ).length;

  const rejectedCount = tours.filter(
    (tour) => tour.status === "rejected"
  ).length;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-xl">
          <div className="text-6xl">⚠️</div>

          <h1 className="mt-5 text-3xl font-bold text-red-600">
            ტურების ჩატვირთვა ვერ მოხერხდა
          </h1>

          <p className="mt-4 break-words text-gray-600">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 p-4 sm:p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">
              Tour Management
            </p>

            <h1 className="mt-3 text-4xl font-black text-slate-900 sm:text-5xl">
              🛡️ დამატებული ტურები
            </h1>

            <p className="mt-3 text-lg text-slate-500">
              დაამტკიცე, უარყავი ან წაშალე მომხმარებლების მიერ დამატებული ტურები.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox
              label="ყველა"
              value={tours.length}
              className="text-slate-900"
            />

            <StatBox
              label="მოლოდინში"
              value={pendingCount}
              className="text-amber-600"
            />

            <StatBox
              label="დამტკიცებული"
              value={approvedCount}
              className="text-emerald-600"
            />

            <StatBox
              label="უარყოფილი"
              value={rejectedCount}
              className="text-red-600"
            />
          </div>
        </div>

        {params.success && (
          <SuccessMessage success={params.success} />
        )}

        {params.error && (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-lg">
            <p className="font-bold">⚠️ მოქმედება ვერ შესრულდა</p>

            <p className="mt-2 break-words">
              {decodeURIComponent(params.error)}
            </p>
          </div>
        )}

        {profilesErrorMessage && (
          <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800 shadow-lg">
            <p className="font-bold">
              ⚠️ ტურის ავტორების პროფილები ვერ ჩაიტვირთა
            </p>

            <p className="mt-2 break-words text-sm">
              {profilesErrorMessage}
            </p>

            <p className="mt-2 text-sm">
              შეამოწმე profiles ცხრილის SELECT RLS Policy.
            </p>
          </div>
        )}

        {tours.length === 0 && (
          <div className="rounded-3xl bg-white p-12 text-center shadow-xl">
            <div className="text-7xl">🏔️</div>

            <h2 className="mt-5 text-3xl font-bold text-slate-900">
              დამატებული ტურები არ არის
            </h2>

            <p className="mt-3 text-gray-500">
              მომხმარებლის მიერ დამატებული ტურები აქ გამოჩნდება.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {tours.map((tour) => (
            <article
              key={tour.id}
              className="group overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              {tour.image_url ? (
                <div className="overflow-hidden">
                  <img
                    src={tour.image_url}
                    alt={tour.title || "Tour"}
                    className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex h-72 items-center justify-center bg-slate-200 text-7xl">
                  🏔️
                </div>
              )}

              <div className="p-5 sm:p-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <StatusBadge status={tour.status} />

                  <span className="text-sm text-slate-400">
                    Tour #{tour.id}
                  </span>
                </div>

                <h2 className="text-3xl font-bold text-slate-900">
                  {tour.title || "უსახელო ტური"}
                </h2>

                <OwnerInformation
                  owner={tour.owner}
                  userId={tour.user_id}
                />

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TourDetail
                    icon="📍"
                    label="მდებარეობა"
                    value={tour.location || "არ არის მითითებული"}
                  />

                  <TourDetail
                    icon="💰"
                    label="მანქანის სრული ფასი"
                    value={
                      tour.price !== null
                        ? `${Number(tour.price).toLocaleString("ka-GE")} ₾`
                        : "შეთანხმებით"
                    }
                  />

                  <TourDetail
                    icon="⏳"
                    label="ხანგრძლივობა"
                    value={tour.duration || "არ არის მითითებული"}
                  />

                  <TourDetail
                    icon="👥"
                    label="მაქსიმალური რაოდენობა"
                    value={
                      tour.max_people
                        ? String(tour.max_people)
                        : "არ არის მითითებული"
                    }
                  />

                  <TourDetail
                    icon="🗓️"
                    label="დაწყების თარიღი"
                    value={formatDate(tour.start_date)}
                  />

                  <TourDetail
                    icon="🚙"
                    label="კატეგორია"
                    value={tour.category || "არ არის მითითებული"}
                  />
                </div>

                <div className="mt-8 rounded-3xl bg-slate-50 p-6">
                  <h3 className="mb-3 text-2xl font-bold text-slate-900">
                    📝 აღწერა
                  </h3>

                  <p className="whitespace-pre-wrap leading-8 text-slate-700">
                    {tour.description || "აღწერა არ არის დამატებული."}
                  </p>
                </div>

                {tour.status === "rejected" &&
                  tour.rejection_reason && (
                    <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6">
                      <h3 className="text-xl font-bold text-red-700">
                        ❌ უარყოფის მიზეზი
                      </h3>

                      <p className="mt-3 whitespace-pre-wrap leading-7 text-red-700">
                        {tour.rejection_reason}
                      </p>
                    </div>
                  )}

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {tour.status !== "approved" && (
                    <form action={approveTour}>
                      <input
                        type="hidden"
                        name="tourId"
                        value={String(tour.id)}
                      />

                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-bold text-white transition hover:bg-emerald-700"
                      >
                        ✅ დამტკიცება
                      </button>
                    </form>
                  )}

                  <Link
                    href={`/admin-v2/tours/${tour.id}`}
                    className="flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-4 text-center text-lg font-bold text-white transition hover:bg-blue-700"
                  >
                    👁️ დეტალურად ნახვა
                  </Link>
                </div>

                {tour.status !== "rejected" && (
                  <RejectTourForm tourId={String(tour.id)} />
                )}

                <DeleteTourButton
                  tourId={String(tour.id)}
                  tourTitle={tour.title || "უსახელო ტური"}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function SuccessMessage({
  success,
}: {
  success: string;
}) {
  let message = "მოქმედება წარმატებით შესრულდა.";

  if (success === "approved") {
    message = "ტური წარმატებით დამტკიცდა.";
  }

  if (success === "rejected") {
    message = "ტური უარყოფილია და მიზეზი წარმატებით შეინახა.";
  }

  if (success === "deleted") {
    message = "ტური წარმატებით წაიშალა.";
  }

  return (
    <div className="mb-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700 shadow-lg">
      <p className="font-bold">✅ წარმატება</p>
      <p className="mt-2">{message}</p>
    </div>
  );
}

function StatBox({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="min-w-[130px] rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-lg">
      <p className="text-sm text-gray-500">{label}</p>

      <p className={`mt-1 text-3xl font-black ${className}`}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: TourStatus | null;
}) {
  if (status === "approved") {
    return (
      <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
        ✅ დამტკიცებული
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
        ❌ უარყოფილი
      </span>
    );
  }

  return (
    <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700">
      🟡 დასამტკიცებელი
    </span>
  );
}

function OwnerInformation({
  owner,
  userId,
}: {
  owner: OwnerProfile | null;
  userId: string | null;
}) {
  return (
    <section className="mt-6 rounded-3xl border border-cyan-200 bg-cyan-50 p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {owner?.avatar_url ? (
          <img
            src={owner.avatar_url}
            alt={owner.full_name || "ტურის ავტორი"}
            className="h-24 w-24 shrink-0 rounded-3xl border-4 border-white object-cover shadow-lg"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-cyan-600 text-4xl text-white shadow-lg">
            👤
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            ტურის ავტორი
          </p>

          <h3 className="mt-2 break-words text-2xl font-black text-slate-900">
            {owner?.full_name || "სახელი არ არის მითითებული"}
          </h3>

          {(owner?.city || owner?.country) && (
            <p className="mt-2 text-slate-600">
              📍 {[owner.city, owner.country].filter(Boolean).join(", ")}
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {owner?.phone ? (
              <a
                href={`tel:${owner.phone}`}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700"
              >
                📞 {owner.phone}
              </a>
            ) : (
              <span className="inline-flex items-center rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 font-bold text-amber-700">
                ⚠️ ტელეფონი არ არის მითითებული
              </span>
            )}
          </div>

          {owner?.bio && (
            <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-600">
              {owner.bio}
            </p>
          )}

          <p className="mt-4 break-all text-xs text-slate-400">
            მომხმარებლის ID: {userId || "ტურს მომხმარებელი არ ჰყავს დაკავშირებული"}
          </p>
        </div>
      </div>
    </section>
  );
}

function TourDetail({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="font-bold text-slate-800">
        {icon} {label}
      </p>

      <p className="mt-2 break-words text-slate-600">
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "არ არის მითითებული";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ka-GE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}