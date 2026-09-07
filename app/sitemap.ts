import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://georgiagatewayhub.com";

type PublicRow = {
  id: string | number;
  created_at?: string | null;
  updated_at?: string | null;
};

function toDate(value?: string | null) {
  if (!value) return new Date();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

async function getApprovedRows(
  table: "tours" | "transfers" | "hotels" | "guides"
): Promise<PublicRow[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      `Sitemap: missing Supabase public environment variables for ${table}.`
    );
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase
    .from(table)
    .select("id,created_at,updated_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    const retry = await supabase
      .from(table)
      .select("id,created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (retry.error) {
      console.error(`Sitemap ${table} error:`, retry.error);
      return [];
    }

    return (retry.data as PublicRow[] | null) ?? [];
  }

  return (data as PublicRow[] | null) ?? [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/tours`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/transfers`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/guides`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/hotels`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const [tours, transfers, hotels, guides] = await Promise.all([
    getApprovedRows("tours"),
    getApprovedRows("transfers"),
    getApprovedRows("hotels"),
    getApprovedRows("guides"),
  ]);

  const tourPages: MetadataRoute.Sitemap = tours.map((tour) => ({
    url: `${SITE_URL}/book-tour/${tour.id}`,
    lastModified: toDate(tour.updated_at || tour.created_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const transferPages: MetadataRoute.Sitemap = transfers.map((transfer) => ({
    url: `${SITE_URL}/book-transfer/${transfer.id}`,
    lastModified: toDate(transfer.updated_at || transfer.created_at),
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  const hotelPages: MetadataRoute.Sitemap = hotels.map((hotel) => ({
    url: `${SITE_URL}/book-hotel/${hotel.id}`,
    lastModified: toDate(hotel.updated_at || hotel.created_at),
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  const guidePages: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: `${SITE_URL}/guides/${guide.id}`,
    lastModified: toDate(guide.updated_at || guide.created_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...tourPages,
    ...transferPages,
    ...hotelPages,
    ...guidePages,
  ];
}
