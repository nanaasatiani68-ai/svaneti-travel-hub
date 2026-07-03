"use client";

import { useState } from "react";

import UserSearch from "./components/UserSearch";
import UserFilters from "./components/UserFilters";
import UserTable from "./components/UserTable";
import UserDrawer from "./components/UserDrawer";

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  lastLogin: string;
};

const usersData: User[] = [
  {
    id: 1,
    name: "Nana Asatiani",
    email: "nanaasatiani68@gmail.com",
    phone: "+995 556 768 006",
    role: "Super Admin",
    status: "Active",
    lastLogin: "Today",
  },
  {
    id: 2,
    name: "Guide Operator",
    email: "guide@svaneti.ge",
    phone: "+995 555 111 222",
    role: "Guide",
    status: "Active",
    lastLogin: "Yesterday",
  },
  {
    id: 3,
    name: "Driver Team",
    email: "driver@svaneti.ge",
    phone: "+995 599 333 444",
    role: "Driver",
    status: "Away",
    lastLogin: "3 days ago",
  },
];

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredUsers = usersData.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.phone.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "All" || user.role === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <main className="min-h-screen p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">
            👥 Users Management
          </h1>

          <p className="text-white/70 mt-2">
            Manage admins, staff, guides and drivers.
          </p>
        </div>

        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-semibold shadow-lg transition">
          + Add User
        </button>
      </div>

      <div className="mb-6">
        <UserSearch value={search} onChange={setSearch} />
      </div>

      <div className="mb-8">
        <UserFilters active={filter} onChange={setFilter} />
      </div>

      <UserTable
        users={filteredUsers}
        onView={(user) => {
          setSelectedUser(user);
          setDrawerOpen(true);
        }}
      />

      <UserDrawer
        open={drawerOpen}
        user={selectedUser}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedUser(null);
        }}
      />
    </main>
  );
}