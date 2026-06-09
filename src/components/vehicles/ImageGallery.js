'use client'

import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, Car } from 'lucide-react'

export default function ImageGallery({ images, vehicleName }) {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef(null)
  const touchEndX = useRef(null)

  const sorted = [...(images ?? [])].sort((a, b) =>
    b.is_primary ? 1 : -1
  )

  const prev = () => setCurrent((i) => (i === 0 ? sorted.length - 1 : i - 1))
  const next = () => setCurrent((i) => (i === sorted.length - 1 ? 0 : i + 1))

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX
    touchEndX.current = null
  }

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    const diff = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50
    if (Math.abs(diff) >= minSwipeDistance) {
      diff > 0 ? next() : prev()
    }
    touchStartX.current = null
    touchEndX.current = null
  }

  if (!sorted.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-56 sm:h-96 flex items-center justify-center">
        <Car size={64} className="text-slate-600" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image with swipe support */}
      <div
        className="relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-56 sm:h-96 group cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={sorted[current]?.url}
          alt={`${vehicleName} — photo ${current + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300 select-none pointer-events-none"
          draggable={false}
        />

        {/* Counter */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 text-white text-xs font-medium">
          {current + 1} / {sorted.length}
        </div>

        {/* Arrows */}
        {sorted.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {sorted.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {sorted.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${
                  i === current
                    ? 'w-4 h-2 bg-white'
                    : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {sorted.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-20 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                i === current
                  ? 'border-blue-500 opacity-100 scale-105'
                  : 'border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500'
              }`}
            >
              <img
                src={img.url}
                alt={`Thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}