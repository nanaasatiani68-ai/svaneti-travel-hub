export default function HotelsPage() {
  return (
    <div>
      <div className="rounded-3xl bg-white/10 border border-white/20 p-8 backdrop-blur-xl shadow-2xl">
        <h1 className="text-4xl font-bold text-white">
          🏨 Hotels Management
        </h1>

        <p className="text-white/70 mt-3">
          აქ გამოჩნდება ყველა სასტუმრო.
        </p>

        <button className="mt-8 rounded-2xl bg-cyan-500 px-6 py-3 font-semibold text-white hover:bg-cyan-600 transition">
          ➕ Add Hotel
        </button>
      </div>
    </div>
  );
}