"use client";

import Link from "next/link";

type Language = "ka" | "en";

type PopularDestinationsProps = {
  language: Language;
};

type Destination = {
  nameKa: string;
  nameEn: string;
  searchValue: string;
};

const destinations: Destination[] = [
  {
    nameKa: "მესტია",
    nameEn: "Mestia",
    searchValue: "Mestia",
  },
  {
    nameKa: "უშგული",
    nameEn: "Ushguli",
    searchValue: "Ushguli",
  },
  {
    nameKa: "ქორულდის ტბები",
    nameEn: "Koruldi Lakes",
    searchValue: "Koruldi",
  },
  {
    nameKa: "ჭალაადის მყინვარი",
    nameEn: "Chalaadi Glacier",
    searchValue: "Chalaadi",
  },
  {
    nameKa: "ქუთაისი",
    nameEn: "Kutaisi",
    searchValue: "Kutaisi",
  },
  {
    nameKa: "თბილისი",
    nameEn: "Tbilisi",
    searchValue: "Tbilisi",
  },
];

export default function PopularDestinations({
  language,
}: PopularDestinationsProps) {
  const isKa = language === "ka";

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
          {isKa ? "აღმოაჩინე საქართველო" : "Discover Georgia"}
        </p>

        <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          {isKa ? "პოპულარული მიმართულებები" : "Popular Destinations"}
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          {isKa
            ? "აირჩიე მიმართულება და ნახე შესაბამისი ტურები, ტრანსფერები, სასტუმროები და გიდები."
            : "Choose a destination and discover matching tours, transfers, hotels and guides."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {destinations.map((destination) => (
          <Link
            key={destination.searchValue}
            href={`/search?destination=${encodeURIComponent(
              destination.searchValue
            )}`}
            className="group flex min-h-[115px] flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-200 hover:-translate-y-1 hover:border-cyan-400/50 hover:bg-white/10"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-lg">
              📍
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-black leading-tight text-white">
                {isKa ? destination.nameKa : destination.nameEn}
              </h3>

              <div className="mt-2 flex items-center gap-1 text-xs font-bold text-cyan-400">
                <span>{isKa ? "ნახვა" : "Explore"}</span>
                <span aria-hidden="true">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}