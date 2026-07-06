export default function ProfilePage() {
  return (
    <div className="max-w-5xl mx-auto">

      <div className="rounded-3xl bg-white/10 border border-white/20 p-10 backdrop-blur-xl shadow-2xl">

        <h1 className="text-4xl font-bold text-white mb-10">
          👤 My Profile
        </h1>

        <div className="flex flex-col md:flex-row gap-10 items-center">

          <div className="flex flex-col items-center">

            <img
              src="/profile.jpg"
              alt="Profile"
              className="w-44 h-44 rounded-full object-cover border-4 border-cyan-500 shadow-2xl"
            />

            <button className="mt-5 bg-cyan-500 hover:bg-cyan-600 transition px-6 py-3 rounded-2xl font-semibold text-white">
              📷 Change Photo
            </button>

          </div>

          <div className="flex-1 space-y-6">

            <div>
              <label className="text-white/70 block mb-2">
                Full Name
              </label>

              <input
                defaultValue="Nana Asatiani"
                className="w-full rounded-2xl bg-white/10 border border-white/20 p-4 text-white outline-none"
              />
            </div>

            <div>
              <label className="text-white/70 block mb-2">
                Email
              </label>

              <input
                defaultValue="nanaasatiani68@gmail.com"
                className="w-full rounded-2xl bg-white/10 border border-white/20 p-4 text-white outline-none"
              />
            </div>

            <div>
              <label className="text-white/70 block mb-2">
                Phone
              </label>

              <input
                defaultValue="+995 556 768 006"
                className="w-full rounded-2xl bg-white/10 border border-white/20 p-4 text-white outline-none"
              />
            </div>

            <div className="flex gap-4">

              <button className="bg-cyan-500 hover:bg-cyan-600 transition px-8 py-4 rounded-2xl font-semibold">
                💾 Save Changes
              </button>

              <button className="bg-red-500 hover:bg-red-600 transition px-8 py-4 rounded-2xl font-semibold">
                🔒 Change Password
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}