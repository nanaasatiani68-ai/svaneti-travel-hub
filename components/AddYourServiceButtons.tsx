"use client";

import Link from "next/link";

export default function AddYourServiceButtons() {
  const services = [
    {
      title: "Add Your Transfer",
      titleKa: "დაამატე შენი ტრანსფერი",
      description:
        "Offer airport transfers, city transfers and private transportation services.",
      descriptionKa:
        "დაამატე აეროპორტის, ქალაქთაშორისი ან კერძო ტრანსფერის სერვისი.",
      icon: "🚐",
      href: "/dashboard/add-transfer",
      button: "Add Transfer",
    },
    {
      title: "Add Your Hotel",
      titleKa: "დაამატე შენი სასტუმრო",
      description:
        "List your hotel, guesthouse or accommodation on Georgia Gateway Hub.",
      descriptionKa:
        "განათავსე შენი სასტუმრო, საოჯახო სასტუმრო ან სხვა განთავსების ობიექტი.",
      icon: "🏨",
      href: "/dashboard/add-hotel",
      button: "Add Hotel",
    },
    {
      title: "Become a Guide",
      titleKa: "დაამატე შენი გიდის სერვისი",
      description:
        "Create your guide profile and offer your services to travelers.",
      descriptionKa:
        "შექმენი გიდის პროფილი და შესთავაზე შენი მომსახურება მოგზაურებს.",
      icon: "🧑‍💼",
      href: "/dashboard/add-guide",
      button: "Add Guide",
    },
  ];

  return (
    <section className="w-full py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900">
            Share Your Service
          </h2>

          <p className="mt-2 text-slate-600">
            დაამატე შენი სერვისი Georgia Gateway Hub-ზე
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.href}
              className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-4xl">
                {service.icon}
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                {service.title}
              </h3>

              <p className="mt-1 font-semibold text-slate-700">
                {service.titleKa}
              </p>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {service.description}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {service.descriptionKa}
              </p>

              <div className="mt-auto pt-6">
                <Link
                  href={service.href}
                  className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
                >
                  {service.button}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}