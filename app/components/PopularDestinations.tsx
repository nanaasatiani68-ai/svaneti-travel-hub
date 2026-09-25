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
  image: string;
  descriptionKa: string;
  descriptionEn: string;
};

const destinations: Destination[] = [
  {
    nameKa: "მესტია",
    nameEn: "Mestia",
    searchValue: "Mestia",
    image:
      "https://images.unsplash.com/photo-1565008576549-57569a49371d?auto=format&fit=crop&w=1200&q=85",
    descriptionKa: "სვანეთის მთავარი ტურისტული ცენტრი",
    descriptionEn: "The heart of Svaneti",
  },
  {
    nameKa: "უშგული",
    nameEn: "Ushguli",
    searchValue: "Ushguli",
    image:
      "https://images.unsplash.com/photo-1569531955323-33c6b2dca44b?auto=format&fit=crop&w=1200&q=85",
    descriptionKa: "ისტორიული სოფლები კავკასიონის მთებში",
    descriptionEn: "Historic villages in the Caucasus Mountains",
  },
  {
    nameKa: "ქორულდის ტბები",
    nameEn: "Koruldi Lakes",
    searchValue: "Koruldi",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
    descriptionKa: "ულამაზესი მთის ტბები უშბას ხედებით",
    descriptionEn: "Mountain lakes with spectacular Ushba views",
  },
  {
    nameKa: "ჭალაადის მყინვარი",
    nameEn: "Chalaadi Glacier",
    searchValue: "Chalaadi",
    image:
      "https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=1200&q=85",
    descriptionKa: "ერთ-ერთი ყველაზე პოპულარული მარშრუტი მესტიასთან",
    descriptionEn: "One of the most popular routes near Mestia",
  },
  {
    nameKa: "ქუთაისი",
    nameEn: "Kutaisi",
    searchValue: "Kutaisi",
    image:
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=85",
    descriptionKa: "ისტორია, კულტურა და დასავლეთ საქართველოს კარიბჭე",
    descriptionEn: "History, culture and a gateway to western Georgia",
  },
  {
    nameKa: "თბილისი",
    nameEn: "Tbilisi",
    searchValue: "Tbilisi",
    image:
      "https://images.unsplash.com/photo-1563284223-333497472e88?auto=format&fit=crop&w=1200&q=85",
    descriptionKa: "საქართველოს დედაქალაქი და კულტურული ცენტრი",
    descriptionEn: "Georgia's capital and cultural center",
  },
];

export default function PopularDestinations({
  language,
}: PopularDestinationsProps) {
  const isKa = language === "ka";

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">
            {isKa ? "აღმოაჩინე საქართველო" : "Discover Georgia"}
          </p>

          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            {isKa ? "პოპულარული მიმართულებები" : "Popular Destinations"}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            {isKa
              ? "აირჩიე მიმართულება და ნახე შესაბამისი ტურები, ტრანსფერები, სასტუმროები და გიდები."
              : "Choose a destination and discover matching tours, transfers, hotels and guides."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {destinations.map((destination) => (
          <Link
            key={destination.searchValue}
            href={`/search?destination=${encodeURIComponent(
              destination.searchValue
            )}`}
            className="group relative min-h-[280px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-2xl"
          >
            <img
              src={destination.image}
              alt={isKa ? destination.nameKa : destination.nameEn}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/5" />

            <div className="absolute inset-x-0 bottom-0 p-6">
              <h3 className="text-2xl font-black text-white">
                {isKa ? destination.nameKa : destination.nameEn}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-200">
                {isKa
                  ? destination.descriptionKa
                  : destination.descriptionEn}
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm transition group-hover:border-cyan-400/50 group-hover:bg-cyan-400/10">
                <span>
                  {isKa ? "დათვალიერება" : "Explore"}
                </span>

                <span aria-hidden="true">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}