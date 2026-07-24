"use client";

import { useState } from "react";
import { rejectTour } from "./actions";

type RejectTourFormProps = {
  tourId: string;
};

export default function RejectTourForm({
  tourId,
}: RejectTourFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="mt-4">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full rounded-2xl bg-amber-500 px-5 py-4 text-lg font-bold text-white transition hover:bg-amber-600"
        >
          ❌ ტურის უარყოფა
        </button>
      ) : (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-amber-900">
                ❌ ტურის უარყოფა
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                ჩაწერილი მიზეზი გამოუჩნდება ტურის ავტორს.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setReason("");
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold text-slate-600 shadow transition hover:bg-slate-100"
              aria-label="ფორმის დახურვა"
            >
              ×
            </button>
          </div>

          <form action={rejectTour} className="mt-5">
            <input type="hidden" name="tourId" value={tourId} />

            <label
              htmlFor={`rejectionReason-${tourId}`}
              className="block font-bold text-slate-800"
            >
              უარყოფის მიზეზი
            </label>

            <textarea
              id={`rejectionReason-${tourId}`}
              name="rejectionReason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              minLength={5}
              maxLength={1000}
              rows={6}
              autoFocus
              placeholder="მაგალითად: ტურის აღწერა არასრულია. გთხოვთ დაამატოთ დეტალური მარშრუტი, მომსახურებაში შემავალი პირობები და სწორი ფასი."
              className="mt-3 w-full resize-y rounded-2xl border-2 border-amber-300 bg-white px-4 py-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
            />

            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
              <span
                className={
                  reason.trim().length > 0 &&
                  reason.trim().length < 5
                    ? "font-semibold text-red-600"
                    : "text-slate-500"
                }
              >
                მინიმუმ 5 სიმბოლო
              </span>

              <span className="text-slate-500">
                {reason.length}/1000
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setReason("");
                }}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-4 font-bold text-slate-700 transition hover:bg-slate-100"
              >
                გაუქმება
              </button>

              <button
                type="submit"
                disabled={reason.trim().length < 5}
                className="rounded-2xl bg-red-600 px-5 py-4 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                ❌ უარყოფის დადასტურება
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}