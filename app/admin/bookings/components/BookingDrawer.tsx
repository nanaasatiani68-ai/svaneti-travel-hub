"use client";

import { X } from "lucide-react";

type Booking = {
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

type BookingDrawerProps = {
  open: boolean;
  booking: Booking | null;
  onClose: () => void;
};

export default function BookingDrawer({
  open,
  booking,
  onClose,
}: BookingDrawerProps) {
  if (!open || !booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">

      <div className="w-full max-w-md bg-slate-900 text-white shadow-2xl h-full overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b border-slate-700">

          <h2 className="text-2xl font-bold">
            Booking Details
          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={22} />
          </button>

        </div>

        <div className="p-6 space-y-6">

          <Info label="Guest" value={booking.guest} />
          <Info label="Email" value={booking.email} />
          <Info label="Phone" value={booking.phone} />
          <Info label="Check-in" value={booking.checkIn} />
          <Info label="Check-out" value={booking.checkOut} />

          <Info
            label="Guests"
            value={`${booking.adults} Adults / ${booking.children} Children`}
          />

          <Info
            label="Payment"
            value={booking.payment}
          />

          <Info
            label="Status"
            value={booking.status}
          />

          <Info
            label="Total"
            value={`₾ ${booking.total}`}
          />

          <div className="pt-4 space-y-3">

            <button className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-xl py-3 font-semibold">
              🖨 Print Booking
            </button>

            <button className="w-full bg-green-600 hover:bg-green-700 transition rounded-xl py-3 font-semibold">
              📄 Download Invoice
            </button>

            <button className="w-full bg-emerald-600 hover:bg-emerald-700 transition rounded-xl py-3 font-semibold">
              💬 Send WhatsApp
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-slate-700 pb-3">
      <p className="text-slate-400 text-sm">
        {label}
      </p>

      <p className="text-lg font-semibold mt-1">
        {value}
      </p>
    </div>
  );
}