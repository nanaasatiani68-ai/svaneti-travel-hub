"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function getTourId(formData: FormData) {
  const tourId = formData.get("tourId");

  if (!tourId || typeof tourId !== "string") {
    throw new Error("ტურის ID ვერ მოიძებნა.");
  }

  return tourId;
}

export async function approveTour(formData: FormData) {
  const tourId = getTourId(formData);
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
    throw new Error(`ტურის დამტკიცება ვერ მოხერხდა: ${error.message}`);
  }

  revalidatePath("/admin-v2");
  revalidatePath("/admin-v2/tours");
  revalidatePath("/tours");
}

export async function rejectTour(formData: FormData) {
  const tourId = getTourId(formData);
  const supabase = await createClient();

  const { error } = await supabase
    .from("tours")
    .update({
      status: "rejected",
    })
    .eq("id", tourId);

  if (error) {
    console.error("Reject tour error:", error);
    throw new Error(`ტურის უარყოფა ვერ მოხერხდა: ${error.message}`);
  }

  revalidatePath("/admin-v2");
  revalidatePath("/admin-v2/tours");
  revalidatePath("/tours");
}

export async function deleteTour(formData: FormData) {
  const tourId = getTourId(formData);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tours")
    .delete()
    .eq("id", tourId)
    .select("id");

  if (error) {
    console.error("Delete tour error:", error);
    throw new Error(`ტურის წაშლა ვერ მოხერხდა: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(
      "ტური არ წაიშალა. სავარაუდოდ Supabase-ის DELETE Policy ბლოკავს წაშლას."
    );
  }

  revalidatePath("/admin-v2");
  revalidatePath("/admin-v2/tours");
  revalidatePath("/tours");
}