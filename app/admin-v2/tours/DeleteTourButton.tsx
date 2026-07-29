"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type DeleteTourButtonProps = {
  tourId: string;
  tourTitle: string;
};

type DeleteTourResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

export default function DeleteTourButton({
  tourId,
  tourTitle,
}: DeleteTourButtonProps) {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleDelete() {
    if (deleting) {
      return;
    }

    const confirmed = window.confirm(
      `ნამდვილად გინდა ტურის „${tourTitle}“ სამუდამოდ წაშლა?\n\nწაშლის შემდეგ მისი აღდგენა შეუძლებელი იქნება.`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(
          `ავტორიზაციის შემოწმება ვერ მოხერხდა: ${sessionError.message}`
        );
      }

      if (!session?.access_token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `/api/admin/tours/${encodeURIComponent(tourId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const result = (await response.json()) as DeleteTourResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "ტურის წაშლა ვერ მოხერხდა."
        );
      }

      router.replace(
        "/admin-v2/tours?success=deleted"
      );

      router.refresh();
    } catch (error: unknown) {
      console.error(
        "Admin tour delete request error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "ტურის წაშლისას უცნობი შეცდომა დაფიქსირდა."
      );

      setDeleting(false);
    }
  }

  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-red-200 bg-red-50">
      <div className="p-5">
        <p className="text-center font-semibold text-red-700">
          ტურის სამუდამოდ წაშლა
        </p>

        <p className="mt-2 text-center text-sm text-red-500">
          წაშლის შემდეგ ტურის აღდგენა შეუძლებელი იქნება.
        </p>

        {errorMessage && (
          <div className="mt-4 rounded-2xl border border-red-300 bg-white p-4 text-sm font-semibold text-red-700">
            ⚠️ {errorMessage}
          </div>
        )}

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="mt-4 w-full rounded-2xl bg-red-600 px-5 py-4 text-lg font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleting
            ? "⏳ იშლება..."
            : "🗑️ ტურის წაშლა"}
        </button>
      </div>
    </div>
  );
}