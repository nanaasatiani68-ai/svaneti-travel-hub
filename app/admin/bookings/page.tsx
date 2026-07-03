"use client";

import { useState } from "react";

import BookingTable from "./components/BookingTable";
import BookingFilters from "./components/BookingFilters";
import SearchBar from "./components/SearchBar";
import BookingDrawer from "./components/BookingDrawer";

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

const bookingsData: Booking[] = [
  {
    id: 1,
    guest: "John Smith",
    email: "john@gmail.com",
    phone: "+44 555111",
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
    phone: "+49 777222",
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
    phone: "+1 555999",
    checkIn: "25 Jul",
    checkOut: "28 Jul",
    adults: 4,
    children: 2,
    total: 980,
    payment: "Paid",
    status: "Confirmed",
  },
];

export default function BookingsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const filteredBookings = bookingsData.filter(
    (booking) => {
      const matchesSearch =
        booking.guest
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        booking.email
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        booking.phone
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" ||
        booking.status === filter;

      return matchesSearch && matchesFilter;
    }
  );

  return (
    <main className="min-h-screen p-8">

      <div className="mb-8">

        <h1 className="text-4xl font-bold text-white">
          Booking Management
        </h1>

        <p className="text-white/70 mt-2">
          Manage all reservations from one place.
        </p>

      </div>

      <div className="mb-6">

        <SearchBar
          value={search}
          onChange={setSearch}
        />

      </div>

      <div className="mb-8">

        <BookingFilters
          active={filter}
          onChange={setFilter}
        />

      </div>

      <BookingTable />

      <BookingDrawer
        open={drawerOpen}
        booking={selectedBooking}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedBooking(null);
        }}
      />    </main>
  );
}