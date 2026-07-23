"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getTourId(formData: FormData): string | null {
  const value = formData.get("tourId");

  if (typeof value !== "string") {
    return null;
  }

  const tourId = value.trim();

  return tourId.length > 0 ? tourId : null;
}

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      allowed: false,
      message: "ადმინისტრატორის ავტორიზაცია ვერ მოიძებნა.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      allowed: false,
      message: "ადმინისტრატორის პროფილი ვერ მოიძებნა.",
    };
  }

  const role = String(profile.role ?? "")
    .trim()
    .toLowerCase();

  if (role !== "admin" && role !== "director") {
    return {
      allowed: false,
      message: "ტურის მართვის უფლება არ გაქვს.",
    };
  }

  return {
    allowed: true,
    message: "",
  };
}

function refreshPages() {
  revalidatePath("/admin-v2");
  revalidatePath("/admin-v2/tours");
  revalidatePath("/tours");
  revalidatePath("/");
}

export async function approveTour(formData: FormData): Promise<void> {
  const tourId = getTourId(formData);

  if (!tourId) {
    redirect("/admin-v2/tours?error=missing-tour-id");
  }

  const authorization = await requireAdmin();

  if (!authorization.allowed) {
    redirect(
      `/admin-v2/tours?error=${encodeURIComponent(
        authorization.message
      )}`
    );
  }

  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from("tours")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
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
    redirect("/admin-v2/tours?error=tour-not-found");
  }

  refreshPages();
  redirect("/admin-v2/tours?success=approved");
}

export async function rejectTour(formData: FormData): Promise<void> {
  const tourId = getTourId(formData);

  if (!tourId) {
    redirect("/admin-v2/tours?error=missing-tour-id");
  }

  const authorization = await requireAdmin();

  if (!authorization.allowed) {
    redirect(
      `/admin-v2/tours?error=${encodeURIComponent(
        authorization.message
      )}`
    );
  }

  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
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
    redirect("/admin-v2/tours?error=tour-not-found");
  }

  refreshPages();
  redirect("/admin-v2/tours?success=rejected");
}

export async function deleteTour(formData: FormData): Promise<void> {
  const tourId = getTourId(formData);

  if (!tourId) {
    redirect("/admin-v2/tours?error=missing-tour-id");
  }

  const authorization = await requireAdmin();

  if (!authorization.allowed) {
    redirect(
      `/admin-v2/tours?error=${encodeURIComponent(
        authorization.message
      )}`
    );
  }

  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
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
    redirect("/admin-v2/tours?error=tour-not-found");
  }

  refreshPages();
  redirect("/admin-v2/tours?success=deleted");
}