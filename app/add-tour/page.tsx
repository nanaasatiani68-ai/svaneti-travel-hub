"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AddTourPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      let imageUrl = "";

      if (image) {
        const fileName = `${Date.now()}-${image.name}`;

        const { data: uploadData, error: uploadError } =
          await supabase.storage
            .from("tour-images")
            .upload(fileName, image);

        console.log("UPLOAD DATA:", uploadData);
        console.log("UPLOAD ERROR:", uploadError);

        if (uploadError) {
          alert("ფოტოს ატვირთვის შეცდომა!");
          console.log(uploadError);
          return;
        }

        const { data } = supabase.storage
          .from("tour-images")
          .getPublicUrl(fileName);

        imageUrl = data.publicUrl;
      }

      const { error } = await supabase.from("tours").insert([
        {
          title,
          description,
          price: Number(price),
          image_url: imageUrl,
        },
      ]);

      if (error) {
        console.log(error);
        alert("ტურის დამატების შეცდომა!");
        return;
      }

      alert("ტური წარმატებით დაემატა!");

      setTitle("");
      setDescription("");
      setPrice("");
      setImage(null);
    } catch (err) {
      console.log(err);
      alert("შეცდომა!");
    }
  };

  return (
    <main
      style={{
        padding: "40px",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h1>➕ ახალი ტურის დამატება</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          marginTop: "20px",
        }}
      >
        <input
          type="text"
          placeholder="ტურის სახელი"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: "12px" }}
        />

        <textarea
          placeholder="აღწერა"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ padding: "12px" }}
        />

        <input
          type="number"
          placeholder="ფასი"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{ padding: "12px" }}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setImage(e.target.files[0]);
            }
          }}
        />

        <button
          type="submit"
          style={{
            padding: "12px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
          }}
        >
          ტურის დამატება
        </button>
      </form>
    </main>
  );
}