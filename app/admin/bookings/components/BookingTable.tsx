"use client";

import {
  Eye,
  Pencil,
  Trash2,
  Calendar,
  Users,
  CreditCard,
} from "lucide-react";

type Booking = {
  id: number;
  guest: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  total: number;
  payment: string;
  status: string;
};

const bookings: Booking[] = [
  {
    id: 1,
    guest: "John Smith",
    email: "john@gmail.com",
    phone: "+44 555 111",
    checkIn: "12 Jul",
    checkOut: "15 Jul",
    adults: 2,
    children: 1,
    total: 520,
    payment: "Paid",
    status: "Confirmed",
  },
  {
    id: 2,
    guest: "Anna Brown",
    email: "anna@gmail.com",
    phone: "+49 888 222",
    checkIn: "18 Jul",
    checkOut: "21 Jul",
    adults: 2,
    children: 0,
    total: 380,
    payment: "Pending",
    status: "Pending",
  },
  {
    id: 3,
    guest: "David Miller",
    email: "david@gmail.com",
    phone: "+1 555 999",
    checkIn: "25 Jul",
    checkOut: "28 Jul",
    adults: 4,
    children: 2,
    total: 980,
    payment: "Paid",
    status: "Confirmed",
  },
];

function statusColor(status: string) {
  switch (status) {
    case "Confirmed":
      return "bg-green-500/20 text-green-300";
    case "Pending":
      return "bg-yellow-500/20 text-yellow-300";
    case "Cancelled":
      return "bg-red-500/20 text-red-300";
    default:
      return "bg-slate-500/20 text-slate-300";
  }
}

function paymentColor(payment: string) {
  return payment === "Paid"
    ? "bg-blue-500/20 text-blue-300"
    : "bg-orange-500/20 text-orange-300";
}

export default function BookingTable() {
  return (
    <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">

      <div className="flex items-center justify-between p-6 border-b border-white/10">

        <div>
          <h2 className="text-2xl font-bold text-white">
            📋 Booking Management
          </h2>

          <p className="text-white/70 mt-1">
            Manage all guest reservations
          </p>
        </div>

        <button className="bg-blue-600 hover:bg-blue-700 transition px-5 py-3 rounded-xl text-white font-semibold">
          + New Booking
        </button>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-white/10">

            <tr className="text-white text-left">

              <th className="p-5">Guest</th>

              <th>Dates</th>

              <th>Guests</th>

              <th>Total</th>

              <th>Payment</th>

              <th>Status</th>

              <th className="text-center">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="border-b border-white/10 hover:bg-white/5 transition-all"
              >
                <td className="p-5">
                  <h3 className="text-white font-semibold">
                    {booking.guest}
                  </h3>

                  <p className="text-white/60 text-sm">
                    {booking.email}
                  </p>

                  <p className="text-white/50 text-xs">
                    {booking.phone}
                  </p>
                </td>

                <td>
                  <div className="flex items-center gap-2 text-white">
                    <Calendar size={18} />

                    <div>
                      <p>{booking.checkIn}</p>
                      <p className="text-white/60 text-sm">
                        {booking.checkOut}
                      </p>
                    </div>
                  </div>
                </td>

                <td>
                  <div className="flex items-center gap-2 text-white">
                    <Users size={18} />

                    <span>
                      {booking.adults} Adults / {booking.children} Children
                    </span>
                  </div>
                </td>

                <td className="text-white font-bold">
                  ₾ {booking.total}
                </td>

                <td>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${paymentColor(
                      booking.payment
                    )}`}
                  >
                    {booking.payment}
                  </span>
                </td>

                <td>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${statusColor(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>
                </td>

                <td>
                  <div className="flex justify-center gap-3">

                    <button className="bg-cyan-500 hover:bg-cyan-600 transition p-2 rounded-xl text-white">
                      <Eye size={18} />
                    </button>

                    <button className="bg-green-500 hover:bg-green-600 transition p-2 rounded-xl text-white">
                      <Pencil size={18} />
                    </button>

                    <button className="bg-red-500 hover:bg-red-600 transition p-2 rounded-xl text-white">
                      <Trash2 size={18} />
                    </button>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>

        </table>

      </div>

    </div>
  );
}