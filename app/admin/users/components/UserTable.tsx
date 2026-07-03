"use client";

import UserRow from "./UserRow";
import { User } from "../page";

type UserTableProps = {
  users: User[];
  onView: (user: User) => void;
};

export default function UserTable({
  users,
  onView,
}: UserTableProps) {
  return (
    <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">

      <div className="p-6 border-b border-white/10">

        <h2 className="text-2xl font-bold text-white">
          👥 Users
        </h2>

        <p className="text-white/60 mt-1">
          Total Users: {users.length}
        </p>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-white/10">

            <tr className="text-left text-white">

              <th className="p-5">
                User
              </th>

              <th>
                Role
              </th>

              <th>
                Status
              </th>

              <th>
                Last Login
              </th>

              <th className="text-center">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onView={onView}
              />
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}