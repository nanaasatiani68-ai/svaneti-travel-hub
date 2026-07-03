"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import RoleBadge from "./RoleBadge";
import { User } from "../page";

type UserRowProps = {
  user: User;
  onView: (user: User) => void;
};

export default function UserRow({
  user,
  onView,
}: UserRowProps) {
  return (
    <tr className="border-b border-white/10 hover:bg-white/5 transition">

      <td className="p-5">
        <div>
          <h3 className="text-white font-semibold">
            {user.name}
          </h3>

          <p className="text-white/60 text-sm">
            {user.email}
          </p>

          <p className="text-white/50 text-xs">
            {user.phone}
          </p>
        </div>
      </td>

      <td>
        <RoleBadge role={user.role} />
      </td>

      <td>
        <StatusBadge status={user.status} />
      </td>

      <td className="text-white">
        {user.lastLogin}
      </td>

      <td>
        <div className="flex justify-center gap-3">

          <button
            onClick={() => onView(user)}
            className="bg-cyan-500 hover:bg-cyan-600 transition p-2 rounded-xl text-white"
          >
            <Eye size={18} />
          </button>

          <button
            className="bg-green-500 hover:bg-green-600 transition p-2 rounded-xl text-white"
          >
            <Pencil size={18} />
          </button>

          <button
            className="bg-red-500 hover:bg-red-600 transition p-2 rounded-xl text-white"
          >
            <Trash2 size={18} />
          </button>

        </div>
      </td>

    </tr>
  );
}