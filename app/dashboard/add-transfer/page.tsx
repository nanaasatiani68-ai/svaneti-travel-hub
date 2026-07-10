"use client";

import { useState } from "react";

export default function AddTransferPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [price, setPrice] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [seats, setSeats] = useState("");
  const [description, setDescription] = useState("");

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-xl">

        <h1 className="mb-8 text-4xl font-bold">
          🚐 ახალი ტრანსფერის დამატება
        </h1>

        <div className="grid gap-5">

          <input
            className="rounded-xl border p-4"
            placeholder="საიდან"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />

          <input
            className="rounded-xl border p-4"
            placeholder="სადამდე"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />

          <input
            className="rounded-xl border p-4"
            placeholder="ფასი (₾)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <input
            className="rounded-xl border p-4"
            placeholder="მანქანა"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
          />

          <input
            className="rounded-xl border p-4"
            placeholder="ადგილების რაოდენობა"
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
          />

          <textarea
            className="rounded-xl border p-4"
            rows={5}
            placeholder="აღწერა"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button
            className="rounded-xl bg-sky-500 p-4 font-bold text-white hover:bg-sky-600"
          >
            ტრანსფერის დამატება
          </button>

        </div>

      </div>
    </main>
  );
}