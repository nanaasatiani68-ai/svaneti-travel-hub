"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email || "");
    };

    checkUser();
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
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
          maxWidth: "900px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "12px",
          padding: "30px",
          boxShadow: "0 0 15px rgba(0,0,0,0.1)",
        }}
      >
        <h1>👋 კეთილი იყოს თქვენი მობრძანება</h1>

        <p>
          <strong>შესული მომხმარებელი:</strong> {email}
        </p>

        <hr style={{ margin: "25px 0" }} />

        <button
          onClick={() => router.push("/dashboard/add-tour")}
          style={{
            padding: "15px 25px",
            background: "#0ea5e9",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            marginRight: "15px",
          }}
        >
          ➕ ტურის დამატება
        </button>

        <button
          onClick={() => router.push("/dashboard/my-tours")}
          style={{
            padding: "15px 25px",
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            marginRight: "15px",
          }}
        >
          📋 ჩემი ტურები
        </button>

        <button
          onClick={logout}
          style={{
            padding: "15px 25px",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          🚪 გასვლა
        </button>
      </div>
    </main>
  );
}