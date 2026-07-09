"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    country: "",
    city: "",
    bio: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile({
        full_name: data.full_name || "",
        phone: data.phone || "",
        country: data.country || "",
        city: data.city || "",
        bio: data.bio || "",
      });
    }

    setLoading(false);
  }

  async function saveProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("id", user.id);

    if (error) {
      alert(error.message);
    } else {
      alert("პროფილი წარმატებით შეინახა");
    }
  }

  if (loading) return <h2 style={{ padding: 40 }}>Loading...</h2>;

  return (
    <main style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
      <h1>👤 My Profile</h1>

      <input
        placeholder="Full Name"
        value={profile.full_name}
        onChange={(e) =>
          setProfile({ ...profile, full_name: e.target.value })
        }
      />

      <br /><br />

      <input
        placeholder="Phone"
        value={profile.phone}
        onChange={(e) =>
          setProfile({ ...profile, phone: e.target.value })
        }
      />

      <br /><br />

      <input
        placeholder="Country"
        value={profile.country}
        onChange={(e) =>
          setProfile({ ...profile, country: e.target.value })
        }
      />

      <br /><br />

      <input
        placeholder="City"
        value={profile.city}
        onChange={(e) =>
          setProfile({ ...profile, city: e.target.value })
        }
      />

      <br /><br />

      <textarea
        placeholder="About Me"
        rows={5}
        value={profile.bio}
        onChange={(e) =>
          setProfile({ ...profile, bio: e.target.value })
        }
      />

      <br /><br />

      <button onClick={saveProfile}>
        💾 Save Profile
      </button>
    </main>
  );
}