"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  language: "ka" | "en";
};

export default function HomeSearch({ language }: Props) {
  const router = useRouter();

  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("2");

  const text =
    language === "ka"
      ? {
          destination: "მიმართულება",
          destinationPlaceholder: "მესტია, უშგული, თბილისი...",
          date: "თარიღი",
          guests: "სტუმრები",
          guest: "სტუმარი",
          search: "ძებნა",
          title: "იპოვე შენი მოგზაურობა",
          subtitle: "მოძებნე ტურები, ტრანსფერები, სასტუმროები და გიდები",
        }
      : {
          destination: "Destination",
          destinationPlaceholder: "Mestia, Ushguli, Tbilisi...",
          date: "Date",
          guests: "Guests",
          guest: "Guest",
          search: "Search",
          title: "Find your perfect trip",
          subtitle: "Search tours, transfers, hotels and local guides",
        };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (destination.trim()) {
      params.set("destination", destination.trim());
    }

    if (date) {
      params.set("date", date);
    }

    params.set("guests", guests);

    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="mt-10 w-full max-w-6xl">
      <div className="rounded-3xl border border-white/15 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
        <div className="mb-5">
          <h3 className="text-xl font-black text-white sm:text-2xl">
            {text.title}
          </h3>

          <p className="mt-1 text-sm text-white/60">
            {text.subtitle}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-3 md:grid-cols-[2fr_1.2fr_1fr_auto]"
        >
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-white/60">
              📍 {text.destination}
            </span>

            <input
              type="text"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder={text.destinationPlaceholder}
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none transition placeholder:text-white/35 focus:border-cyan-400 focus:bg-white/15"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-white/60">
              📅 {text.date}
            </span>

            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none transition focus:border-cyan-400 focus:bg-white/15"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-white/60">
              👥 {text.guests}
            </span>

            <select
              value={guests}
              onChange={(event) => setGuests(event.target.value)}
              className="h-14 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 text-white outline-none transition focus:border-cyan-400"
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map(
                (number) => (
                  <option key={number} value={number}>
                    {number}{" "}
                    {number === 1 ? text.guest : text.guests.toLowerCase()}
                  </option>
                )
              )}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="h-14 w-full rounded-2xl bg-cyan-500 px-7 font-black text-white shadow-lg transition hover:bg-cyan-600 active:scale-[0.98] md:w-auto"
            >
              🔍 {text.search}
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-white/55">
          <span className="rounded-full bg-white/5 px-3 py-1.5">
            🏔 Tours
          </span>

          <span className="rounded-full bg-white/5 px-3 py-1.5">
            🚙 Transfers
          </span>

          <span className="rounded-full bg-white/5 px-3 py-1.5">
            🏨 Hotels
          </span>

          <span className="rounded-full bg-white/5 px-3 py-1.5">
            🧑‍💼 Guides
          </span>
        </div>
      </div>
    </div>
  );
}