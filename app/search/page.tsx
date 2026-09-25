import { Suspense } from "react";
import SearchClient from "./SearchClient";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <p className="text-lg font-bold">Loading search...</p>
            </div>
          </div>
        </main>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
