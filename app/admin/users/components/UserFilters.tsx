"use client";

type UserFiltersProps = {
  active: string;
  onChange: (filter: string) => void;
};

const filters = [
  "All",
  "Super Admin",
  "Admin",
  "Guide",
  "Driver",
  "Hotel",
];

export default function UserFilters({
  active,
  onChange,
}: UserFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">

      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          className={`
            px-5
            py-2.5
            rounded-xl
            font-medium
            transition-all
            duration-300
            ${
              active === filter
                ? "bg-cyan-500 text-white shadow-lg scale-105"
                : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
            }
          `}
        >
          {filter}
        </button>
      ))}

    </div>
  );
}