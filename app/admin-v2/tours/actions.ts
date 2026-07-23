"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function readTourId(formData: FormData): string | null {
  const value = formData.get("tourId");

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.trim();
}

function refreshTourPages() {
  revalidatePath("/admin-v2");
  revalidatePath("/admin-v2/tours");
  revalidatePath("/tours");
}

export async function approveTour(formData: FormData) {
  const tourId = readTourId(formData);

  if (!tourId) {
    redirect("/admin-v2/tours?error=missing-tour-id");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tours")
    .update({
      status: "approved",
    })
    .eq("id", tourId)
    .select("id");

  if (error) {
    console.error("Approve tour error:", error);

    redirect(
      `/admin-v2/tours?error=${encodeURIComponent(error.message)}`
    );
  }

  if (!data || data.length === 0) {
    console.error(
      "Approve tour failed: no rows were updated. Check UPDATE RLS policy."
    );

    redirect("/admin-v2/tours?error=approve-policy-blocked");
  }

  refreshTourPages();
  redirect("/admin-v2/tours?success=approved");
}

export async function rejectTour(formData: FormData) {
  const tourId = readTourId(formData);

  if (!tourId) {
    redirect("/admin-v2/tours?error=missing-tour-id");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tours")
    .update({
      status: "rejected",
    })
    .eq("id", tourId)
    .select("id");

  if (error) {
    console.error("Reject tour error:", error);

    redirect(
      `/admin-v2/tours?error=${encodeURIComponent(error.message)}`
    );
  }

  if (!data || data.length === 0) {
    console.error(
      "Reject tour failed: no rows were updated. Check UPDATE RLS policy."
    );

    redirect("/admin-v2/tours?error=reject-policy-blocked");
  }

  refreshTourPages();
  redirect("/admin-v2/tours?success=rejected");
}

export async function deleteTour(formData: FormData) {
  const tourId = readTourId(formData);

  if (!tourId) {
    redirect("/admin-v2/tours?error=missing-tour-id");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tours")
    .delete()
    .eq("id", tourId)
    .select("id");

  if (error) {
    console.error("Delete tour error:", error);

    redirect(
      `/admin-v2/tours?error=${encodeURIComponent(error.message)}`
    );
  }

  if (!data || data.length === 0) {
    console.error(
      "Delete tour failed: no rows were deleted. Check DELETE RLS policy."
    );

    redirect("/admin-v2/tours?error=delete-policy-blocked");
  }

  refreshTourPages();
  redirect("/admin-v2/tours?success=deleted");
}