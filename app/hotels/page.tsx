"use client";

import {
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type Hotel = {
  id: number | string;
  name: string | null;
  location: string | null;
  price_per_night: number | null;
  description: string | null;
  image_url: string | null;
  rooms: number | null;
  phone: string | null;
  status: string | null;
  created_at: string | null;
};

type SortOption =
  | "newest"
  | "price-low"
  | "price-high"
  | "rooms-high"
  | "name";

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minimumRooms, setMinimumRooms] = useState("");
  const [sortBy, setSortBy] =
    useState<SortOption>("newest");

  async function loadHotels() {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("hotels")
        .select(
          `
            id,
            name,
            location,
            price_per_night,
            description,
            image_url,
            rooms,
            phone,
            status,
            created_at
          `
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setHotels((data as Hotel[] | null) ?? []);
    } catch (error: unknown) {
      console.error("Hotels loading error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "უცნობი შეცდომა დაფიქსირდა.";

      setHotels([]);

      setErrorMessage(
        `სასტუმროების ჩატვირთვა ვერ მოხერხდა. ${message}`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHotels();
  }, []);

  const filteredHotels = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const minimumPrice =
      minPrice.trim() === ""
        ? null
        : Number(minPrice);

    const maximumPrice =
      maxPrice.trim() === ""
        ? null
        : Number(maxPrice);

    const requestedRooms =
      minimumRooms.trim() === ""
        ? null
        : Number(minimumRooms);

    const result = hotels.filter((hotel) => {
      const name = String(
        hotel.name ?? ""
      ).toLowerCase();

      const location = String(
        hotel.location ?? ""
      ).toLowerCase();

      const description = String(
        hotel.description ?? ""
      ).toLowerCase();

      const phone = String(
        hotel.phone ?? ""
      ).toLowerCase();

      const matchesSearch =
        searchValue === "" ||
        name.includes(searchValue) ||
        location.includes(searchValue) ||
        description.includes(searchValue) ||
        phone.includes(searchValue);

      const numericPrice =
        hotel.price_per_night === null
          ? null
          : Number(hotel.price_per_night);

      const matchesMinPrice =
        minimumPrice === null ||
        (numericPrice !== null &&
          numericPrice >= minimumPrice);

      const matchesMaxPrice =
        maximumPrice === null ||
        (numericPrice !== null &&
          numericPrice <= maximumPrice);

      const matchesRooms =
        requestedRooms === null ||
        hotel.rooms === null ||
        Number(hotel.rooms) >= requestedRooms;

      return (
        matchesSearch &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesRooms
      );
    });

    return [...result].sort((a, b) => {
      if (sortBy === "price-low") {
        const priceA =
          a.price_per_night === null
            ? Number.POSITIVE_INFINITY
            : Number(a.price_per_night);

        const priceB =
          b.price_per_night === null
            ? Number.POSITIVE_INFINITY
            : Number(b.price_per_night);

        return priceA - priceB;
      }

      if (sortBy === "price-high") {
        const priceA =
          a.price_per_night === null
            ? Number.NEGATIVE_INFINITY
            : Number(a.price_per_night);

        const priceB =
          b.price_per_night === null
            ? Number.NEGATIVE_INFINITY
            : Number(b.price_per_night);

        return priceB - priceA;
      }

      if (sortBy === "rooms-high") {
        return (
          Number(b.rooms ?? 0) -
          Number(a.rooms ?? 0)
        );
      }

      if (sortBy === "name") {
        return String(a.name ?? "").localeCompare(
          String(b.name ?? ""),
          "ka"
        );
      }

      const dateA = a.created_at
        ? new Date(a.created_at).getTime()
        : 0;

      const dateB = b.created_at
        ? new Date(b.created_at).getTime()
        : 0;

      return dateB - dateA;
    });
  }, [
    hotels,
    search,
    minPrice,
    maxPrice,
    minimumRooms,
    sortBy,
  ]);

  const hasActiveFilters =
    search.trim() !== "" ||
    minPrice.trim() !== "" ||
    maxPrice.trim() !== "" ||
    minimumRooms.trim() !== "" ||
    sortBy !== "newest";

  function clearFilters() {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setMinimumRooms("");
    setSortBy("newest");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-emerald-400" />

          <h1 className="mt-6 text-2xl font-black">
            სასტუმროები იტვირთება
          </h1>

          <p className="mt-2 text-white/55">
            გთხოვთ, მოიცადოთ...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-2xl shadow-lg">
              🏨
            </div>

            <div className="min-w-0">
              <h1 className="