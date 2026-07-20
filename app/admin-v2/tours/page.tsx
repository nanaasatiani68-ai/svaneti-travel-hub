import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { approveTour, rejectTour } from "./actions";

export default async function AdminToursPage() {
  const supabase = await createClient();

  const { data: tours, error } = await supabase
    .from("tours")
    .select("*")
    .eq("status", "pending")
    .order("submitted_at", { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="rounded-3xl bg-white p-10 shadow-xl">
          <h1 className="text-3xl font-bold text-red-600">
            Error loading tours
          </h1>

          <p className="mt-4 text-gray-600">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 p-6 md:p-10">

      <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-5xl font-bold text-slate-900">
            🛡️ Pending Tours
          </h1>

          <p className="mt-3 text-lg text-slate-500">
            Review and approve tours submitted by users.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-xl">
          <p className="text-gray-500">
            Pending Tours
          </p>

          <h2 className="text-4xl font-bold">
            {tours?.length ?? 0}
          </h2>
        </div>

      </div>

      {tours?.length === 0 && (
        <div className="rounded-3xl bg-white p-12 text-center shadow-xl">
          <h2 className="text-3xl font-bold">
            ✅ No pending tours
          </h2>

          <p className="mt-3 text-gray-500">
            There are no tours waiting for approval.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">

        {tours?.map((tour) => (
          <div
            key={tour.id}
            className="group overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
          >

            {tour.image_url ? (
              <div className="overflow-hidden">
                <img
                  src={tour.image_url}
                  alt={tour.title}
                  className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="flex h-72 items-center justify-center bg-slate-200 text-7xl">
                🏔️
              </div>
            )}

            <div className="p-8">

              <div className="mb-6 flex items-center justify-between">

                <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700">
                  🟡 Pending Approval
                </span>

                <span className="text-sm text-slate-400">
                  Tour #{tour.id}
                </span>

              </div>

              <h2 className="text-3xl font-bold text-slate-900">
                {tour.title}
              </h2>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="rounded-2xl bg-slate-50 p-4">
                  📍 <strong>Location</strong>
                  <p>{tour.location}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  💰 <strong>Price</strong>
                  <p>{tour.price} GEL</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  ⏳ <strong>Duration</strong>
                  <p>{tour.duration}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  👥 <strong>Max People</strong>
                  <p>{tour.max_people}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  🗓️ <strong>Start Date</strong>
                  <p>{tour.start_date}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  🚙 <strong>Category</strong>
                  <p>{tour.category}</p>
                </div>

              </div>

              <div className="mt-8 rounded-3xl bg-slate-50 p-6">

                <h3 className="mb-3 text-2xl font-bold">
                  📝 Description
                </h3>

                <p className="whitespace-pre-wrap leading-8 text-slate-700">
                  {tour.description}
                </p>

              </div>

              <div className="mt-8 flex flex-col gap-4 lg:flex-row">

                <form action={approveTour} className="flex-1">

                  <input
                    type="hidden"
                    name="tourId"
                    value={tour.id}
                  />

                  <button className="w-full rounded-2xl bg-emerald-600 py-4 text-lg font-bold text-white transition hover:scale-105 hover:bg-emerald-700">
                    ✅ Approve
                  </button>

                </form>

                <form action={rejectTour} className="flex-1">

                  <input
                    type="hidden"
                    name="tourId"
                    value={tour.id}
                  />

                  <button className="w-full rounded-2xl bg-red-600 py-4 text-lg font-bold text-white transition hover:scale-105 hover:bg-red-700">
                    ❌ Reject
                  </button>

                </form>

                <Link
                  href={`/admin-v2/tours/${tour.id}`}
                  className="flex-1 rounded-2xl bg-blue-600 py-4 text-center text-lg font-bold text-white transition hover:scale-105 hover:bg-blue-700"
                >
                  👁️ View Details
                </Link>

              </div>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}