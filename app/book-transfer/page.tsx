import Link from "next/link";

export default function BookTransferIndexPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="text-7xl">🚐</div>
        <h1 className="mt-5 text-3xl font-black">აირჩიე ტრანსფერი</h1>
        <p className="mt-3 text-white/60">
          დაჯავშნისთვის ჯერ გახსენი სასურველი ტრანსფერი.
        </p>
        <Link
          href="/transfers"
          className="mt-7 inline-flex rounded-2xl bg-cyan-500 px-6 py-3 font-bold"
        >
          ყველა ტრანსფერი
        </Link>
      </div>
    </main>
  );
}
