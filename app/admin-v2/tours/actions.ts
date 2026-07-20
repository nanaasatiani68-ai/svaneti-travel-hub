"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function approveTour(formData: FormData) {
  const tourId = Number(formData.get("tourId"));

  if (!tourId) {
    throw new Error("ტურის ID ვერ მოიძებნა");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("tours")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
    })
    .eq("id", tourId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin-v2/tours");
}

export async function rejectTour(formData: FormData) {
  const tourId = Number(formData.get("tourId"));

  if (!tourId) {
    throw new Error("ტურის ID ვერ მოიძებნა");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("tours")
    .update({
      status: "rejected",
      approved_at: null,
    })
    .eq("id", tourId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin-v2/tours");
}