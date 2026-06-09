'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Camera, RefreshCw, CheckCircle, X,
  AlertCircle, Loader2,
} from 'lucide-react'

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [phase, setPhase] = useState('idle') // idle | streaming | preview | done
  const [error, setError] = useState('')
  const [capturedImage, setCapturedImage] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')

  const startCamera = useCallback(async (facing = facingMode) => {
    setError('')
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setPhase('streaming')
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError('Could not access camera: ' + err.message)
      }
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setCapturedImage(dataUrl)
    stopCamera()
    setPhase('preview')
  }, [stopCamera])

  const retake = useCallback(() => {
    setCapturedImage(null)
    setPhase('idle')
  }, [])

  const flipCamera = useCallback(() => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startCamera(next)
  }, [facingMode, startCamera])

  const confirm = useCallback(() => {
    if (!capturedImage) return
    onCapture(capturedImage)
    stopCamera()
    setPhase('done')
  }, [capturedImage, onCapture, stopCamera])

  const handleClose = useCallback(() => {
    stopCamera()
    onClose?.()
  }, [stopCamera, onClose])

  return (
    <div className="space-y-4">

      {/* Instructions banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-3">
        <AlertCircle size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <p className="font-medium text-blue-300">How to take your KYC photo</p>
          <ul className="space-y-0.5 text-slate-400 list-disc list-inside">
            <li>Hold your driving licence clearly in front of you</li>
            <li>Make sure your face and the licence are both visible</li>
            <li>Ensure good lighting — avoid shadows or glare</li>
            <li>Keep the licence text readable in the photo</li>
          </ul>
        </div>
      </div>

      {/* Camera area */}
      <div className="relative bg-slate-800 rounded-xl overflow-hidden"
        style={{ aspectRatio: '16/9' }}>

        {/* Idle state */}
        {phase === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center">
              <Camera size={28} className="text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-white text-sm font-medium">Camera not started</p>
              <p className="text-slate-400 text-xs mt-1">
                Click below to open your camera
              </p>
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400 text-center max-w-xs">
                {error}
              </div>
            )}
            <Button
              onClick={() => startCamera()}
              className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
            >
              <Camera size={14} className="mr-2" /> Open Camera
            </Button>
          </div>
        )}

        {/* Live stream */}
        {phase === 'streaming' && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Face + licence guide overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Semi-transparent overlay with cutout guide */}
              <div className="absolute inset-0 border-2 border-blue-400/30 m-6 rounded-xl" />
              <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                <p className="text-white text-xs text-center">
                  Face + Licence in frame
                </p>
              </div>
            </div>
            {/* Controls */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
              {/* Flip camera */}
              <button
                onClick={flipCamera}
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <RefreshCw size={16} />
              </button>
              {/* Capture button */}
              <button
                onClick={capture}
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:bg-slate-100 transition-colors shadow-lg"
              >
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                  <Camera size={22} className="text-white" />
                </div>
              </button>
              {/* Close */}
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </>
        )}

        {/* Preview captured photo */}
        {phase === 'preview' && capturedImage && (
          <>
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1">
              <p className="text-white text-xs">Review your photo</p>
            </div>
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
              <Button
                onClick={retake}
                className="bg-black/60 hover:bg-black/80 text-white border border-white/20 h-9 text-sm backdrop-blur-sm"
              >
                <RefreshCw size={13} className="mr-1.5" /> Retake
              </Button>
              <Button
                onClick={confirm}
                className="bg-green-600 hover:bg-green-700 text-white h-9 text-sm"
              >
                <CheckCircle size={13} className="mr-1.5" /> Use This Photo
              </Button>
            </div>
          </>
        )}

        {/* Done state */}
        {phase === 'done' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-green-500/10">
            <CheckCircle size={40} className="text-green-400" />
            <p className="text-white font-medium text-sm">Photo submitted!</p>
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}