"use client";

import { useState } from "react";

export default function Home() {
  const [showBeta, setShowBeta] = useState(true);

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat text-white"
      style={{
        backgroundImage:
      "linear-gradient(rgba(15,23,42,.65), rgba(15,23,42,.75)), url('/hero.jpg')",
      }}
    >
      {showBeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="max-w-lg rounded-3xl bg-white/15 border border-white/20 p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="mb-4 text-4xl">🚀</div>

            <h2 className="text-3xl font-bold">
              Welcome to Public Beta
            </h2>

            <p className="mt-4 text-white/80">
              Svaneti Travel Hub is growing every day. Thank you for being one
              of our first travelers.
            </p>

            <button
              onClick={() => setShowBeta(false)}
              className="mt-6 rounded-2xl bg-sky-500 px-6 py-3 font-semibold text-white hover:bg-sky-600 transition"
            >
              Explore Now
            </button>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold">🏔️ Svaneti Travel Hub</h1>
          <p className="text-sm text-white/70">Georgia Travel Platform</p>
        </div>

        <div className="rounded-full bg-sky-500/90 px-4 py-2 text-sm font-semibold shadow-lg">
          🚀 PUBLIC BETA v1.0
        </div>
      </header>

      <section className="flex min-h-[75vh] items-center px-8">
        <div className="max-w-4xl">
          <div className="mb-5 inline-block rounded-full bg-white/15 px-5 py-2 text-sm font-semibold backdrop-blur-xl border border-white/20">
            Discover Svaneti • Tours • Hotels • Transfers
          </div>

          <h2 className="text-6xl font-extrabold leading-tight drop-shadow-lg">
            Explore Georgia Like Never Before
          </h2>

          <p className="mt-6 max-w-2xl text-xl text-white/85">
            Book tours, find stays, arrange transfers and discover unforgettable
            experiences across Svaneti.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button className="rounded-2xl bg-sky-500 px-7 py-4 font-bold shadow-xl hover:bg-sky-600 transition">
              Book a Tour
            </button>

            <button className="rounded-2xl bg-white/15 px-7 py-4 font-bold backdrop-blur-xl border border-white/20 hover:bg-white/25 transition">
              Find Hotels
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 px-8 pb-12 md:grid-cols-4">
        <Feature title="🏔️ Tours" text="Hiking, horse riding, jeep tours and adventures." />
        <Feature title="🏨 Hotels" text="Find trusted stays in Mestia and around Svaneti." />
        <Feature title="🚐 Transfers" text="Airport, Mestia, Ushguli and private transfers." />
        <Feature title="🤖 AI Assistant" text="Plan your perfect trip with smart recommendations." />
      </section>

      <footer className="border-t border-white/10 bg-black/30 px-8 py-6 text-center text-white/70 backdrop-blur-xl">
        <p>© 2026 Svaneti Travel Hub</p>
        <p className="mt-1">Version 1.0 Beta • Made with ❤️ in Georgia</p>
      </footer>
    </main>
  );
}

function Feature({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-white/15 p-6 shadow-2xl backdrop-blur-xl border border-white/20 hover:scale-105 transition-all duration-300">
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="mt-3 text-white/75">{text}</p>
    </div>
  );
}