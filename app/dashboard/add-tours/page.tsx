"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function AddTourPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
    };

    checkUser();
  }, [router]);

  const addTour = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      alert("მომხმარებელი ვერ მოიძებნა");
      return;
    }

    if (!title || !description || !price || !location) {
      alert("გთხოვ შეავსო ყველა აუცილებელი ველი");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("tours").insert([
      {
        title,
        description,
        price: Number(price),
        location,
        image_url: imageUrl,
        user_id: userId,
        status: "pending",
      },
    ]);

    setLoading(false);

    if (error) {
      alert("ტური ვერ დაემატა: " + error.message);
      return;
    }

    alert("ტური დამატებულია და ელოდება ადმინისტრატორის დადასტურებას");
    router.push("/dashboard");
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
          maxWidth: "800px",
          margin: "0 auto",
          background: "white",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 0 15px rgba(0,0,0,0.1)",
        }}
      >
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            marginBottom: "20px",
            padding: "10px 15px",
            border: "none",
            borderRadius: "6px",
            background: "#64748b",
            color: "white",
            cursor: "pointer",
          }}
        >
          ← უკან დაბრუნება
        </button>

        <h1>➕ ტურის დამატება</h1>
        <p>შეავსე ინფორმაცია. ტური გამოჩნდება მხოლოდ ადმინის დადასტურების შემდეგ.</p>        <form
          onSubmit={addTour}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            marginTop: "30px",
          }}
        >
          <input
            type="text"
            placeholder="ტურის სახელი"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />

          <textarea
            placeholder="ტურის აღწერა"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              resize: "vertical",
            }}
          />

          <input
            type="number"
            placeholder="ფასი (₾)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />

          <input
            type="text"
            placeholder="ლოკაცია"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />

          <input
            type="text"
            placeholder="ფოტოს URL (არასავალდებულო)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
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
        </form>
      </div>
    </main>
  );
}