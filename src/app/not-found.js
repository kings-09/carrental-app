import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto">
          <span className="text-4xl font-bold text-slate-600">?</span>
        </div>
        <h1 className="text-4xl font-bold text-white">404</h1>
        <p className="text-slate-400 text-sm">
          This page doesn't exist or you don't have permission to view it.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Link
            href="/"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}