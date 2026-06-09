export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base sm:text-lg">C</span>
            </div>
            <span className="text-white font-bold text-lg sm:text-xl">CarRental</span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">Fleet & Accounts Management</p>
        </div>
        {children}
      </div>
    </div>
  )
}