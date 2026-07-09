"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AddTourPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState("");
  const [maxPeople, setMaxPeople] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
    }

    checkUser();
  }, [router]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function uploadImage() {
    if (!imageFile) return "";

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from("tour-images")
      .upload(filePath, imageFile);

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage
      .from("tour-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function addTour(e: React.FormEvent) {
    e.preventDefault();

    if (!userId) {
      alert("მომხმარებელი ვერ მოიძებნა");
      return;
    }

    if (!title || !description || !location || !price) {
      alert("გთხოვ შეავსო აუცილებელი ველები");
      return;
    }

    try {
      setLoading(true);

      const imageUrl = await uploadImage();

      const { error } = await supabase.from("tours").insert([
        {
          title,
          description,
          location,
          price: Number(price),
          duration,
          start_date: startDate || null,
          max_people: maxPeople ? Number(maxPeople) : null,
          category,
          image_url: imageUrl,
          user_id: userId,
          status: "pending",
        },
      ]);

      if (error) {
        throw new Error(error.message);
      }

      alert("ტური დამატებულია და ელოდება ადმინის დადასტურებას");
      router.push("/dashboard/my-tours");
    } catch (error: any) {
      alert("შეცდომა: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          ➕ Add New Tour
        </h1>
        <p className="text-slate-500 mt-2">
          Add your tour to Georgia Travel Hub. It will be published after admin approval.
        </p>
      </div>

      <form
        onSubmit={addTour}
        className="bg-white rounded-2xl shadow p-6 md:p-8 space-y-8"
      >
        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Tour Information
          </h2>

          <div className="grid md:grid-cols-2 gap-5">
            <input
              type="text"
              placeholder="Tour name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              required
            />

            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input"
              required
            />

            <input
              type="number"
              placeholder="Price GEL"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input"
              required
            />

            <input
              type="text"
              placeholder="Duration, example: 3 days"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="input"
            />

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />

            <input
              type="number"
              placeholder="Max people"
              value={maxPeople}
              onChange={(e) => setMaxPeople(e.target.value)}
              className="input"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
            >
              <option value="">Choose category</option>
              <option value="Hiking">Hiking</option>
              <option value="Jeep Tour">Jeep Tour</option>
              <option value="Horse Riding">Horse Riding</option>
              <option value="Cultural Tour">Cultural Tour</option>
              <option value="Adventure">Adventure</option>
            </select>
          </div>

          <textarea
            placeholder="Tour description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="input mt-5 w-full"
            required
          />
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Cover Photo
          </h2>

          <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:border-sky-400 transition">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="mx-auto max-h-72 rounded-xl object-cover"
              />
            ) : (
              <div>
                <div className="text-5xl mb-3">📸</div>
                <p className="font-semibold text-slate-700">
                  Click to upload cover photo
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  JPG, PNG or WEBP
                </p>
              </div>
            )}
          </label>
        </section>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-600 disabled:bg-slate-400"
          >
            {loading ? "Saving..." : "Submit Tour"}
          </button>
        </div>
      </form>
    </div>
  );
}