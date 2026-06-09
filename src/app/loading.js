export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-lg">C</span>
        </div>
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}