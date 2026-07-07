"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AddTourPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
    };

    getUser();
  }, [router]);

  const addTour = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !title.trim() ||
      !description.trim() ||
      !price ||
      !location.trim()
    ) {
      alert("გთხოვ შეავსო ყველა აუცილებელი ველი.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("tours").insert({
      title,
      description,
      price: Number(price),
      image_url: imageUrl,
      location,
      user_id: userId,
      status: "pending",
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("✅ ტური წარმატებით დაემატა და ელოდება ადმინისტრატორის დადასტურებას.");

    setTitle("");
    setDescription("");
    setPrice("");
    setLocation("");
    setImageUrl("");    router.push("/dashboard");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ marginBottom: "20px" }}>➕ ტურის დამატება</h1>

        <form
          onSubmit={addTour}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          <input
            type="text"
            placeholder="ტურის სახელი"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ padding: "12px" }}
          />

          <textarea
            placeholder="ტურის აღწერა"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            required
            style={{ padding: "12px" }}
          />

          <input
            type="number"
            placeholder="ფასი (₾)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            style={{ padding: "12px" }}
          />

          <input
            type="text"
            placeholder="ლოკაცია"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            style={{ padding: "12px" }}
          />

          <input
            type="text"
            placeholder="ფოტოს URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            style={{ padding: "12px" }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "15px",
              background: "#0ea5e9",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            {loading ? "იტვირთება..." : "ტურის დამატება"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "15px",
              background: "#64748b",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            უკან დაბრუნება
          </button>
        </form>
      </div>
    </main>
  );
}