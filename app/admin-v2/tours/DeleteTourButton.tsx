"use client";

import { useState } from "react";
import { deleteTour } from "./actions";

type DeleteTourButtonProps = {
  tourId: string;
  tourTitle: string;
};

export default function DeleteTourButton({
  tourId,
  tourTitle,
}: DeleteTourButtonProps) {
  const [confirmed, setConfirmed] = useState(false);

  if (!confirmed) {
    return (
      <div className="mt-4 overflow-hidden rounded-3xl border border-red-200 bg-red-50">
        <div className="p-5">
          <p className="text-center font-semibold text-red-700">
            Delete tour permanently
          </p>

          <p className="mt-2 text-center text-sm text-red-500">
            This action cannot be undone.
          </p>

          <button
            type="button"
            onClick={() => setConfirmed(true)}
            className="mt-4 w-full rounded-2xl bg-red-600 px-5 py-4 text-lg font-bold text-white transition hover:bg-red-700"
          >
            Delete tour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-3xl border-2 border-red-400 bg-red-50">
      <div className="p-5">
        <p className="text-center text-lg font-bold text-red-700">
          Are you sure you want to delete this tour?
        </p>

        <p className="mt-2 break-words text-center font-semibold text-slate-800">
          {tourTitle}
        </p>

        <p className="mt-2 text-center text-sm text-red-600">
          This action is permanent.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setConfirmed(false)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-4 font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>

          <form action={deleteTour}>
            <input
              type="hidden"
              name="tourId"
              value={tourId}
            />

            <button
              type="submit"
              className="w-full rounded-2xl bg-red-600 px-4 py-4 font-bold text-white transition hover:bg-red-700"
            >
              Yes, delete
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
