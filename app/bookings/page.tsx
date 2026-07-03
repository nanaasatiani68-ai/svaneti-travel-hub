"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function BookingsPage() {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  const [notes, setNotes] = useState("");

  const [totalPrice, setTotalPrice] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("Bookings").insert([
      {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        tour_id: 1,

        check_in: checkIn,
        check_out: checkOut,

        adults,
        children,

        notes,

        total_price: totalPrice,

        payment_status: "Pending",

        status: "Pending",
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerName,
        customerEmail,
        customerPhone,
      }),
    });

    alert("ჯავშანი წარმატებით დაემატა!");

    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCheckIn(null);
    setCheckOut(null);
    setAdults(1);
    setChildren(0);
    setNotes("");
    setTotalPrice(0);
  };

  return (
    <main style={{ padding: "40px" }}>
      <h1>ტურის დაჯავშნა</h1>

      <form onSubmit={handleSubmit}>
                <input
          type="text"
          placeholder="სახელი"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
        />

        <br />
        <br />

        <input
          type="email"
          placeholder="ელფოსტა"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          required
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="ტელეფონი"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          required
        />

        <br />
        <br />

        <label>📅 Check-in</label>
        <br />

        <DatePicker
          selected={checkIn}
          onChange={(date) => setCheckIn(date)}
          minDate={new Date()}
          dateFormat="dd/MM/yyyy"
          placeholderText="აირჩიე Check-in"
        />

        <br />
        <br />

        <label>📅 Check-out</label>
        <br />

        <DatePicker
          selected={checkOut}
          onChange={(date) => setCheckOut(date)}
          minDate={checkIn || new Date()}
          dateFormat="dd/MM/yyyy"
          placeholderText="აირჩიე Check-out"
        />

        <br />
        <br />

        <input
          type="number"
          placeholder="👨 Adults"
          value={adults}
          onChange={(e) => setAdults(Number(e.target.value))}
          min={1}
        />

        <br />
        <br />

        <input
          type="number"
          placeholder="👶 Children"
          value={children}
          onChange={(e) => setChildren(Number(e.target.value))}
          min={0}
        />

        <br />
        <br />

        <textarea
          placeholder="შენიშვნა"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />

        <br />
        <br />

        <input
          type="number"
          placeholder="სრული ფასი"
          value={totalPrice}
          onChange={(e) => setTotalPrice(Number(e.target.value))}
        />

        <br />
        <br />

        <button type="submit">
          📋 ჯავშნის გაგზავნა
        </button>
      </form>
    </main>
  );
}