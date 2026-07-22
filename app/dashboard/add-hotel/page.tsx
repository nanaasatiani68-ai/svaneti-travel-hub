"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AddHotelPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [rooms, setRooms] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim()) {
      setErrorMessage("ჩაწერე სასტუმროს სახელი.");
      return;
    }

    if (!location.trim()) {
      setErrorMessage("ჩაწერე სასტუმროს მდებარეობა.");
      return;
    }

    if (pricePerNight && Number(pricePerNight) < 0) {
      setErrorMessage("ფასი არ შეიძლება იყოს უარყოფითი.");
      return;
    }

    if (rooms && Number(rooms) < 1) {
      setErrorMessage("ოთახების რაოდენობა უნდა იყოს მინიმუმ 1.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage("სასტუმროს დასამატებლად ჯერ უნდა შეხვიდე ანგარიშში.");
      setLoading(false);
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("hotels").insert({
      user_id: user.id,
      name: name.trim(),
      location: location.trim(),
      price_per_night: pricePerNight ? Number(pricePerNight) : null,
      rooms: rooms ? Number(rooms) : null,
      phone: phone.trim() || null,
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      status: "pending",
    });

    if (error) {
      console.error("Hotel insert error:", error);
      setErrorMessage(`სასტუმროს დამატება ვერ მოხერხდა: ${error.message}`);
      setLoading(false);
      return;
    }

    setSuccessMessage(
      "სასტუმრო წარმატებით დაემატა და ადმინისტრატორის დასამტკიცებლად გაიგზავნა."
    );

    setName("");
    setLocation("");
    setPricePerNight("");
    setRooms("");
    setPhone("");
    setDescription("");
    setImageUrl("");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            ← მომხმარებლის პანელი
          </Link>

          <Link
            href="/hotels"
            className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            სასტუმროების ნახვა
          </Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
          <div className="text-center">
            <div className="text-6xl">🏨</div>

            <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              სასტუმროს დამატება
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              შეავსე სასტუმროს ინფორმაცია. დამატების შემდეგ სასტუმრო ჯერ
              ადმინისტრატორმა უნდა დაამტკიცოს.
            </p>
          </div>

          {errorMessage && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              ✅ {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <FormField label="სასტუმროს სახელი">
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="მაგალითად: Hotel Lahili"
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </FormField>

            <FormField label="მდებარეობა">
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="მაგალითად: მესტია"
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="ფასი ერთ ღამეზე">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={pricePerNight}
                  onChange={(event) => setPricePerNight(event.target.value)}
                  placeholder="მაგალითად: 150"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </FormField>

              <FormField label="ოთახების რაოდენობა">
                <input
                  type="number"
                  min={1}
                  value={rooms}
                  onChange={(event) => setRooms(event.target.value)}
                  placeholder="მაგალითად: 12"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </FormField>
            </div>

            <FormField label="ტელეფონის ნომერი">
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+995 5XX XX XX XX"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </FormField>

            <FormField label="ფოტოს ბმული">
              <input
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://example.com/hotel.jpg"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </FormField>

            <FormField label="სასტუმროს აღწერა">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="აღწერე სასტუმრო, ოთახები, სერვისები და მდებარეობა..."
                rows={6}
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </FormField>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "იგზავნება..." : "სასტუმროს დამატება"}
            </button>

            <p className="text-center text-xs leading-5 text-slate-400">
              სასტუმრო საჯაროდ გამოჩნდება მხოლოდ ადმინისტრატორის დამტკიცების
              შემდეგ.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      {children}
    </label>
  );
}