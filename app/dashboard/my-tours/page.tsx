"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function MyToursPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadTours() {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setMessage(`User error: ${userError.message}`);
        setLoading(false);
        return;
      }

      if (!user) {
        setMessage("მომხმარებელი ავტორიზებული არ არის.");
        setLoading(false);
        return;
      }

      console.log("Logged user ID:", user.id);

      // ჯერ user_id ფილტრის გარეშე ვამოწმებთ
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        setMessage(`Supabase შეცდომა: ${error.message}`);
        setLoading(false);
        return;
      }

      console.log("Tours from Supabase:", data);

      setTours(data || []);

      if (!data || data.length === 0) {
        setMessage(
          `ტურები ვერ მოიძებნა. მომხმარებლის ID არის: ${user.id}`
        );
      }

      setLoading(false);
    }

    loadTours();
  }, []);

  if (loading) {
    return <div className="p-8">იტვირთება...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">🏔️ My Tours</h1>

      {message && (
        <div className="mb-6 rounded-xl bg-yellow-100 p-4 text-yellow-800">
          {message}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tours.map((tour) => (
          <div
            key={tour.id}
            className="rounded-2xl bg-white p-6 text-slate-900 shadow"
          >
            <h2 className="text-xl font-bold">
              {tour.title || tour.name || "Untitled Tour"}
            </h2>

            <p className="mt-2">
              სტატუსი: <strong>{tour.status || "არ აქვს"}</strong>
            </p>

            <p className="mt-2 break-all text-sm">
              user_id: {tour.user_id || "ცარიელია"}
            </p>

            <p className="mt-2 break-all text-sm">
              owner_id: {tour.owner_id || "ცარიელია"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}