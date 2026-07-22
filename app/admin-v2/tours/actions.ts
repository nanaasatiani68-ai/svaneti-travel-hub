"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function approveTour(formData: FormData) {
  const tourId = formData.get("tourId");

  if (!tourId) {
    throw new Error("Tour ID is missing");
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
    console.error("Approve tour error:", error);
    throw new Error(`ტურის დამტკიცება ვერ მოხერხდა: ${error.message}`);
  }

  revalidatePath("/admin-v2/tours");
  revalidatePath("/tours");
  revalidatePath("/");
}

export async function rejectTour(formData: FormData) {
  const tourId = formData.get("tourId");

  if (!tourId) {
    throw new Error("Tour ID is missing");
  }

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

  revalidatePath("/admin-v2/tours");
  revalidatePath("/tours");
  revalidatePath("/");
}

export async function deleteTour(formData: FormData) {
  const tourId = formData.get("tourId");

  if (!tourId) {
    throw new Error("Tour ID is missing");
  }

  const supabase = await createClient();

  /*
   * თუ bookings ცხრილში ამ ტურზე ჯავშნები არსებობს
   * და foreign key cascade არ გაქვს, ტურის წაშლა შეიძლება დაიბლოკოს.
   */
  const { error } = await supabase
    .from("tours")
    .delete()
    .eq("id", tourId);

  if (error) {
    console.error("Delete tour error:", error);
    throw new Error(`ტურის წაშლა ვერ მოხერხდა: ${error.message}`);
  }

  revalidatePath("/admin-v2/tours");
  revalidatePath("/admin-v2/tour-owners");
  revalidatePath("/tours");
  revalidatePath("/");
}