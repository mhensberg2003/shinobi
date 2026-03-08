export default function WatchLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090909] px-6">
      <div className="w-full max-w-md">
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full w-2/3 rounded-full bg-white"
            style={{ animation: "shinobi-watch-loading 1.2s ease-in-out infinite" }}
          />
        </div>
        <h1 className="mt-6 text-center text-2xl font-semibold text-white">Opening player</h1>
        <p className="mt-4 text-center text-sm text-white/60">
          Loading the watch page and player controls.
        </p>
      </div>
      <style>{`
        @keyframes shinobi-watch-loading {
          0% { transform: translateX(-30%); opacity: 0.5; }
          50% { transform: translateX(20%); opacity: 1; }
          100% { transform: translateX(70%); opacity: 0.5; }
        }
      `}</style>
    </main>
  );
}
