export default function Topbar() {
  return (
    <header className="bg-white border-b border-slate-200 h-20 px-8 flex items-center justify-between">

      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Dashboard
        </h1>

        <p className="text-slate-500">
          Welcome back, Nana 👋
        </p>
      </div>

      <div className="flex items-center gap-5">

        <button className="relative text-2xl">
          🔔
          <span className="absolute -top-1 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            3
          </span>
        </button>

        <button className="text-2xl">
          🌙
        </button>

        <div className="flex items-center gap-3 bg-slate-100 rounded-xl px-4 py-2">

          <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            N
          </div>

          <div>
            <h3 className="font-semibold">
              Nana Asatiani
            </h3>

            <p className="text-sm text-slate-500">
              Director
            </p>
          </div>

        </div>

      </div>

    </header>
  );
}