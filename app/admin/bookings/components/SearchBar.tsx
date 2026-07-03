"use client";

import { Search, X } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({
  value,
  onChange,
}: SearchBarProps) {
  return (
    <div className="relative w-full">

      <Search
        size={20}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"
      />

      <input
        type="text"
        placeholder="Search guest, email or phone..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full
          rounded-2xl
          bg-white/10
          backdrop-blur-xl
          border
          border-white/20
          py-3
          pl-12
          pr-12
          text-white
          placeholder:text-white/50
          outline-none
          focus:border-cyan-400
          transition
        "
      />

      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition"
        >
          <X size={18} />
        </button>
      )}

    </div>
  );
}