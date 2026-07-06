"use client";

import { X } from "lucide-react";
import StatusBadge from "./StatusBadge";
import RoleBadge from "./RoleBadge";

type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  lastLogin: string;
};

type UserDrawerProps = {
  open: boolean;
  user: User | null;
  onClose: () => void;
};

export default function UserDrawer({
  open,
  user,
  onClose,
}: UserDrawerProps) {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="h-full w-full max-w-md overflow-y-auto bg-slate-900 text-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-slate-700 p-6">
          <h2 className="text-2xl font-bold">User Details</h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-slate-800"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6">

          <div className="flex flex-col items-center text-center">

            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-cyan-600 text-4xl font-bold">
              {user.name.charAt(0)}
            </div>

            <h3 className="mt-4 text-2xl font-bold">
              {user.name}
            </h3>

            <p className="text-slate-400">
              {user.email}
            </p>

          </div>

          <div className="mt-8 space-y-5">

            <Info label="Phone" value={user.phone} />

            <Info
              label="Last Login"
              value={user.lastLogin}
            />

            <div>
              <p className="mb-2 text-sm text-slate-400">
                Role
              </p>

              <RoleBadge role={user.role} />
            </div>

            <div>
              <p className="mb-2 text-sm text-slate-400">
                Status
              </p>

              <StatusBadge status={user.status} />
            </div>

          </div>

          <div className="mt-10 space-y-3">

            <button className="w-full rounded-xl bg-blue-600 py-3 font-semibold transition hover:bg-blue-700">
              ✏️ Edit User
            </button>

            <button className="w-full rounded-xl bg-red-600 py-3 font-semibold transition hover:bg-red-700">
              🔒 Disable User
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
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold">
        {value}
      </p>
    </div>
  );
}