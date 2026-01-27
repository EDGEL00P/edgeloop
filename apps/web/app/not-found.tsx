import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 px-4 text-center">
      <div className="space-y-6">
        {/* 404 Number */}
        <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
          404
        </h1>
        
        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Looks like this play got called back. The page you are looking for does not exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Home
          </Link>
          <Link
            href="/predictions"
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-emerald-400 border border-emerald-600 rounded-lg hover:bg-emerald-600/10 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
          >
            View Predictions
          </Link>
        </div>

        {/* Football decoration */}
        <div className="pt-8 text-6xl opacity-20">
          🏈
        </div>
      </div>
    </main>
  )
}
