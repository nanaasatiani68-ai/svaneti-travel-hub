"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function BookingsPage() {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("Bookings").insert([
      {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        tour_id: 1,
      },
    ]);

    if (error) {
      alert(error.message);
    } else {
      alert("ჯავშანი წარმატებით დაემატა!");
    }
  };

  return (
    <main style={{ padding: "40px" }}>
      <h1>ჯავშნის ფორმა</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="სახელი"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />

        <br /><br />

        <input
          placeholder="ელფოსტა"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
        />

        <br /><br />

        <input
          placeholder="ტელეფონი"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
        />

        <br /><br />

        <button type="submit">
          ჯავშნის გაგზავნა
        </button>
      </form>
    </main>
  );
}