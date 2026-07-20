import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type TourDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type Tour = {
  id: number;
  created_at: string | null;
  title: string | null;
  description: string | null;
  price: number | null;
  image_url: string | null;
  location: string | null;
  user_id: string | null;
  status: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  duration: string | null;
  max_people: number | null;
  start_date: string | null;
  category: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  bio: string | null;
};

function formatDate(date: string | null) {
  if (!date) return "Not specified";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: string | null) {
  if (!date) return "Not specified";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getStatusStyle(status: string | null) {
  switch (status) {
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export default async function TourDetailsPage({
  params,
}: TourDetailsPageProps) {
  const { id } = await params;

  const tourId = Number(id);

  if (!Number.isInteger(tourId)) {
    notFound();
  }

  const supabase = await createClient();

  // ტურის წამოღება
  const { data: tourData, error: tourError } = await supabase
    .from("tours")
    .select("*")
    .eq("id", tourId)
    .single();

  if (tourError || !tourData) {
    console.error("Tour fetch error:", tourError);
    notFound();
  }

  const tour = tourData as Tour;

  // ტურის მფლობელის პროფილის ცალკე წამოღება
  let owner: Profile | null = null;

  if (tour.user_id) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(
        `
          id,
          full_name,
          avatar_url,
          role,
          phone,
          country,
          city,
          bio
        `
      )
      .eq("id", tour.user_id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
    }

    owner = profileData as Profile | null;
  }

  async function approveTour() {
    "use server";

    const supabase = await createClient();

    const { error } = await supabase
      .from("tours")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", tourId);

    if (error) {
      console.error("Approve tour error:", error);
      redirect(`/admin-v2/tours/${tourId}?error=approve`);
    }

    revalidatePath("/admin-v2/tours");
    revalidatePath(`/admin-v2/tours/${tourId}`);
    redirect(`/admin-v2/tours/${tourId}`);
  }

  async function rejectTour() {
    "use server";

    const supabase = await createClient();

    const { error } = await supabase
      .from("tours")
      .update({
        status: "rejected",
        approved_at: null,
      })
      .eq("id", tourId);

    if (error) {
      console.error("Reject tour error:", error);
      redirect(`/admin-v2/tours/${tourId}?error=reject`);
    }

    revalidatePath("/admin-v2/tours");
    revalidatePath(`/admin-v2/tours/${tourId}`);
    redirect(`/admin-v2/tours/${tourId}`);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* უკან დაბრუნება */}
        <div className="mb-6">
          <Link
            href="/admin-v2/tours"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Back to Tours
          </Link>
        </div>

        {/* ზედა სათაური */}
        <section className="mb-8 rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                Tour Management
              </p>

              <h1 className="text-3xl font-bold sm:text-4xl">
                {tour.title || "Untitled Tour"}
              </h1>

              <p className="mt-3 text-slate-300">
                Review the tour information and approve or reject the request.
              </p>
            </div>

            <span
              className={`w-fit rounded-full border px-5 py-2 text-sm font-bold uppercase ${getStatusStyle(
                tour.status
              )}`}
            >
              {tour.status || "pending"}
            </span>
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* მთავარი ნაწილი */}
          <div className="space-y-8">
            {/* ტურის ფოტო */}
            <section className="overflow-hidden rounded-3xl bg-white shadow-lg">
              {tour.image_url ? (
                <img
                  src={tour.image_url}
                  alt={tour.title || "Tour"}
                  className="h-[300px] w-full object-cover sm:h-[450px]"
                />
              ) : (
                <div className="flex h-[300px] w-full items-center justify-center bg-slate-200 sm:h-[450px]">
                  <div className="text-center">
                    <div className="mb-3 text-6xl">🏔️</div>
                    <p className="font-semibold text-slate-500">
                      No tour image
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* ტურის ინფორმაცია */}
            <section className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">
              <h2 className="mb-6 text-2xl font-bold">Tour Information</h2>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <InfoCard
                  icon="📍"
                  label="Location"
                  value={tour.location || "Not specified"}
                />

                <InfoCard
                  icon="💰"
                  label="Price"
                  value={
                    tour.price !== null
                      ? `${Number(tour.price).toLocaleString()} ₾`
                      : "Not specified"
                  }
                />

                <InfoCard
                  icon="⏱️"
                  label="Duration"
                  value={tour.duration || "Not specified"}
                />

                <InfoCard
                  icon="👥"
                  label="Maximum people"
                  value={
                    tour.max_people !== null
                      ? String(tour.max_people)
                      : "Not specified"
                  }
                />

                <InfoCard
                  icon="📅"
                  label="Start date"
                  value={formatDate(tour.start_date)}
                />

                <InfoCard
                  icon="🏷️"
                  label="Category"
                  value={tour.category || "Not specified"}
                />
              </div>
            </section>

            {/* აღწერა */}
            <section className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">
              <h2 className="mb-5 text-2xl font-bold">Description</h2>

              <p className="whitespace-pre-line text-base leading-8 text-slate-600">
                {tour.description || "No description was provided for this tour."}
              </p>
            </section>

            {/* მოთხოვნის ინფორმაცია */}
            <section className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">
              <h2 className="mb-6 text-2xl font-bold">Request Information</h2>

              <div className="grid gap-5 sm:grid-cols-2">
                <InfoCard
                  icon="📨"
                  label="Submitted at"
                  value={formatDateTime(tour.submitted_at)}
                />

                <InfoCard
                  icon="🕒"
                  label="Created at"
                  value={formatDateTime(tour.created_at)}
                />

                <InfoCard
                  icon="✅"
                  label="Approved at"
                  value={formatDateTime(tour.approved_at)}
                />

                <InfoCard
                  icon="🆔"
                  label="Tour ID"
                  value={String(tour.id)}
                />
              </div>
            </section>

            {/* Tour Owner */}
            <section className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">
              <h2 className="mb-6 text-3xl font-bold">👤 Tour Owner</h2>

              {owner ? (
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  {owner.avatar_url ? (
                    <img
                      src={owner.avatar_url}
                      alt={owner.full_name || "Tour owner"}
                      className="h-24 w-24 shrink-0 rounded-full border-4 border-slate-100 object-cover shadow-md"
                    />
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-slate-200 text-4xl shadow-md">
                      👤
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="mb-5">
                      <h3 className="text-2xl font-bold text-slate-900">
                        {owner.full_name || "Unnamed user"}
                      </h3>

                      <p className="mt-1 font-medium text-cyan-700">
                        {owner.role || "User"}
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <OwnerDetail
                        label="Phone"
                        value={owner.phone || "Not provided"}
                      />

                      <OwnerDetail
                        label="Country"
                        value={owner.country || "Not provided"}
                      />

                      <OwnerDetail
                        label="City"
                        value={owner.city || "Not provided"}
                      />

                      <OwnerDetail label="User ID" value={owner.id} />
                    </div>

                    {owner.bio && (
                      <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
                          Bio
                        </p>

                        <p className="whitespace-pre-line leading-7 text-slate-600">
                          {owner.bio}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <div className="mb-3 text-5xl">👤</div>

                  <h3 className="text-lg font-bold text-slate-700">
                    Owner profile not found
                  </h3>

                  <p className="mt-2 text-slate-500">
                    User ID: {tour.user_id || "No user ID"}
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* მარჯვენა მართვის პანელი */}
          <aside className="space-y-6">
            <section className="sticky top-6 rounded-3xl bg-white p-6 shadow-lg">
              <h2 className="mb-2 text-2xl font-bold">Admin Actions</h2>

              <p className="mb-6 text-sm leading-6 text-slate-500">
                Approve the tour to publish it, or reject the request.
              </p>

              <div className="space-y-3">
                {tour.status !== "approved" && (
                  <form action={approveTour}>
                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-emerald-500 px-5 py-4 text-lg font-bold text-white shadow-md transition hover:bg-emerald-600"
                    >
                      ✓ Approve Tour
                    </button>
                  </form>
                )}

                {tour.status !== "rejected" && (
                  <form action={rejectTour}>
                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-red-500 px-5 py-4 text-lg font-bold text-white shadow-md transition hover:bg-red-600"
                    >
                      ✕ Reject Tour
                    </button>
                  </form>
                )}

                <Link
                  href="/admin-v2/tours"
                  className="block w-full rounded-2xl bg-slate-200 px-5 py-4 text-center text-lg font-bold text-slate-700 transition hover:bg-slate-300"
                >
                  Back to List
                </Link>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-6">
                <p className="text-sm text-slate-500">
                  Current status
                </p>

                <p className="mt-1 text-xl font-bold capitalize text-slate-900">
                  {tour.status || "pending"}
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-3 text-2xl">{icon}</div>

      <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-lg font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function OwnerDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-all font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}