"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    const { data, error } = await supabase
      .from("Bookings")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setBookings(data);
    }
  }

  return (
    <main style={{ padding: "40px" }}>
      <h1>📋 ჯავშნების სია</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr>
            <th>სახელი</th>
            <th>ელფოსტა</th>
            <th>ტელეფონი</th>
          </tr>
        </thead>

        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td>{booking.customer_name}</td>
              <td>{booking.customer_email}</td>
              <td>{booking.customer_phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}