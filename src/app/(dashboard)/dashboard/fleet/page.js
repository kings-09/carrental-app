'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { uploadVehicleImage, addVehicle, editVehicle, removeVehicle, changeVehicleStatus } from '@/app/actions/vehicles'
import VehicleForm from '@/components/vehicles/VehicleForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu'
import { Plus, Search, Car, MoreVertical, Pencil, Trash2, CheckCircle, Wrench, Upload, Image as ImageIcon, XCircle, Loader2, } from 'lucide-react'
import { toast } from 'sonner'

const statusConfig = {
  available: { label: 'Available', class: 'bg-green-500/10 text-green-400 border-green-500/20' },
  rented: { label: 'Rented', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  maintenance: { label: 'Maintenance', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  retired: { label: 'Retired', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export default function FleetPage() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingVehicleId, setUploadingVehicleId] = useState(null)
  const [uploadProgress, setUploadProgress] = useState([])
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const multiFileRef = useRef()

  const supabase = createClient()

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('vehicles')
      .select('*, vehicle_images(id, url, is_primary)')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (search) {
      query = query.or(
        `make.ilike.%${search}%,model.ilike.%${search}%,plate_number.ilike.%${search}%`
      )
    }

    const { data } = await query
    setVehicles(data ?? [])
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => { fetchVehicles() }, [fetchVehicles])

  const handleImageUpload = async (vehicleId, files) => {
    if (!files?.length) return
    setUploadingVehicleId(vehicleId)
    const fileArray = Array.from(files)
    const results = []

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      setUploadProgress((prev) => [
        ...prev.filter((p) => p.name !== file.name),
        { name: file.name, status: 'uploading', index: i },
      ])

      const fd = new FormData()
      fd.append('image', file)
      const result = await uploadVehicleImage(vehicleId, fd)

      setUploadProgress((prev) =>
        prev.map((p) =>
          p.name === file.name
            ? { ...p, status: result.error ? 'error' : 'done' }
            : p
        )
      )
      results.push(result)
    }

    const errors = results.filter((r) => r.error)
    const successes = results.filter((r) => r.success)

    if (successes.length > 0) {
      toast.success(`${successes.length} image${successes.length > 1 ? 's' : ''} uploaded!`)
      fetchVehicles()
    }
    if (errors.length > 0) {
      toast.error(`${errors.length} image${errors.length > 1 ? 's' : ''} failed to upload`)
    }

    setTimeout(() => {
      setUploadingVehicleId(null)
      setUploadProgress([])
    }, 1500)
  }

  const handleSubmit = async (formData) => {
    setSubmitting(true)
    const result = editTarget
      ? await editVehicle(editTarget.id, formData)
      : await addVehicle(formData)
    setSubmitting(false)

    if (result.error) { toast.error(result.error); return }
    toast.success(editTarget ? 'Vehicle updated!' : 'Vehicle added!')
    setShowForm(false)
    setEditTarget(null)
    fetchVehicles()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this vehicle? This cannot be undone.')) return
    const result = await removeVehicle(id)
    if (result.error) { toast.error(result.error); return }
    toast.success('Vehicle removed.')
    fetchVehicles()
  }

  const handleStatusChange = async (id, status) => {
    const result = await changeVehicleStatus(id, status)
    if (result.error) { toast.error(result.error); return }
    toast.success('Status updated.')
    fetchVehicles()
  }

  const openEdit = (vehicle) => { setEditTarget(vehicle); setShowForm(true) }
  const openAdd = () => { setEditTarget(null); setShowForm(true) }

  const stats = {
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === 'available').length,
    rented: vehicles.filter((v) => v.status === 'rented').length,
    maintenance: vehicles.filter((v) => v.status === 'maintenance').length,
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Fleet Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">{stats.total} vehicles total</p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
          <Plus size={16} className="mr-2" /> Add Vehicle
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Available', value: stats.available, color: 'text-green-400' },
          { label: 'Rented', value: stats.rented, color: 'text-blue-400' },
          { label: 'Maintenance', value: stats.maintenance, color: 'text-amber-400' },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-xl sm:text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by make, model or plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'available', 'rented', 'maintenance', 'retired'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${
                statusFilter === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse h-48" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center py-16 gap-3">
          <Car size={40} className="text-slate-600" />
          <p className="text-slate-400 font-medium">No vehicles found</p>
          <p className="text-slate-500 text-sm">Add your first vehicle to get started</p>
          <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white mt-2">
            <Plus size={15} className="mr-2" /> Add Vehicle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicles.map((v) => {
            const status = statusConfig[v.status] ?? statusConfig.available
            const primaryImage = v.vehicle_images?.find((i) => i.is_primary)?.url
            const imageCount = v.vehicle_images?.length ?? 0
            const isUploading = uploadingVehicleId === v.id

            return (
              <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
                {/* Image area */}
                <div className="h-36 bg-slate-800 flex items-center justify-center relative group/img">
                  {primaryImage ? (
                    <img src={primaryImage} alt={`${v.make} ${v.model}`}
                      className="w-full h-full object-cover" />
                  ) : (
                    <Car size={40} className="text-slate-600" />
                  )}

                  {/* Image count badge */}
                  {imageCount > 0 && (
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 text-white text-xs flex items-center gap-1">
                      <ImageIcon size={10} /> {imageCount}
                    </div>
                  )}

                  {/* Upload overlay on hover */}
                  <div
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      setSelectedVehicle(v)
                      setShowImageModal(true)
                    }}
                  >
                    <div className="flex flex-col items-center gap-1 text-white">
                      <Upload size={20} />
                      <span className="text-xs font-medium">
                        {imageCount > 0 ? 'Manage Photos' : 'Upload Photos'}
                      </span>
                    </div>
                  </div>

                  {/* Upload progress overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-2">
                      <Loader2 size={20} className="animate-spin text-blue-400" />
                      <p className="text-white text-xs">Uploading...</p>
                      <div className="w-3/4 space-y-1 max-h-16 overflow-hidden">
                        {uploadProgress.map((p) => (
                          <div key={p.name} className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              p.status === 'done' ? 'bg-green-400' :
                              p.status === 'error' ? 'bg-red-400' :
                              'bg-blue-400 animate-pulse'
                            }`} />
                            <p className="text-xs text-slate-300 truncate">{p.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {v.year} {v.make} {v.model}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5 font-mono">{v.plate_number}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-44">
                        <DropdownMenuItem onClick={() => openEdit(v)}
                          className="text-slate-300 hover:text-white text-sm gap-2 cursor-pointer">
                          <Pencil size={13} /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => { setSelectedVehicle(v); setShowImageModal(true) }}
                          className="text-blue-400 hover:text-blue-300 text-sm gap-2 cursor-pointer">
                          <ImageIcon size={13} /> Manage Photos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(v.id, 'available')}
                          className="text-green-400 hover:text-green-300 text-sm gap-2 cursor-pointer">
                          <CheckCircle size={13} /> Mark Available
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(v.id, 'maintenance')}
                          className="text-amber-400 hover:text-amber-300 text-sm gap-2 cursor-pointer">
                          <Wrench size={13} /> Send to Maintenance
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(v.id)}
                          className="text-red-400 hover:text-red-300 text-sm gap-2 cursor-pointer">
                          <Trash2 size={13} /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${status.class}`}>
                      {status.label}
                    </span>
                    <span className="text-white font-semibold text-sm">
                      ${v.daily_rate}<span className="text-slate-400 font-normal text-xs">/day</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Type</p>
                      <p className="text-xs text-white capitalize">{v.transmission ?? '—'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Fuel</p>
                      <p className="text-xs text-white capitalize">{v.fuel_type ?? '—'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Seats</p>
                      <p className="text-xs text-white">{v.seating_capacity ?? '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditTarget(null) }}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              {editTarget ? 'Edit Vehicle' : 'Add New Vehicle'}
            </DialogTitle>
          </DialogHeader>
          <VehicleForm
            initial={editTarget ?? {}}
            onSubmit={handleSubmit}
            loading={submitting}
          />
        </DialogContent>
      </Dialog>

      {/* Image management modal */}
      <Dialog open={showImageModal} onOpenChange={(open) => {
        setShowImageModal(open)
        if (!open) { setSelectedVehicle(null); setUploadProgress([]) }
      }}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              Photos — {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
            </DialogTitle>
          </DialogHeader>

          {selectedVehicle && (
            <div className="space-y-4">
              {/* Upload area */}
              <div
                className="border-2 border-dashed border-slate-600 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition-colors"
                onClick={() => multiFileRef.current?.click()}
              >
                <Upload size={28} className="text-slate-400 mx-auto mb-2" />
                <p className="text-white text-sm font-medium">
                  Click to upload photos
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  JPG, PNG, WebP · Multiple files supported · Max 5MB each
                </p>
                <input
                  ref={multiFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = e.target.files
                    if (!files?.length) return
                    await handleImageUpload(selectedVehicle.id, files)
                    // Refresh selected vehicle images
                    const { data } = await supabase
                      .from('vehicle_images')
                      .select('id, url, is_primary')
                      .eq('vehicle_id', selectedVehicle.id)
                    setSelectedVehicle((v) => ({ ...v, vehicle_images: data ?? [] }))
                    e.target.value = ''
                  }}
                />
              </div>

              {/* Upload progress */}
              {uploadProgress.length > 0 && (
                <div className="space-y-1.5">
                  {uploadProgress.map((p) => (
                    <div key={p.name} className="flex items-center gap-2 text-sm">
                      {p.status === 'done' && <CheckCircle size={14} className="text-green-400 shrink-0" />}
                      {p.status === 'error' && <XCircle size={14} className="text-red-400 shrink-0" />}
                      {p.status === 'uploading' && <Loader2 size={14} className="animate-spin text-blue-400 shrink-0" />}
                      <span className="text-slate-300 truncate text-xs">{p.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Existing images */}
              {selectedVehicle.vehicle_images?.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Current Photos ({selectedVehicle.vehicle_images.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedVehicle.vehicle_images.map((img) => (
                      <div key={img.id} className="relative group/thumb rounded-lg overflow-hidden border border-slate-700 aspect-video">
                        <img src={img.url} alt="Vehicle"
                          className="w-full h-full object-cover" />

                        {/* Primary badge */}
                        {img.is_primary && (
                          <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                            Primary
                          </div>
                        )}

                        {/* Actions on hover */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                          {!img.is_primary && (
                            <button
                              onClick={async () => {
                                // Set as primary
                                await supabase
                                  .from('vehicle_images')
                                  .update({ is_primary: false })
                                  .eq('vehicle_id', selectedVehicle.id)
                                await supabase
                                  .from('vehicle_images')
                                  .update({ is_primary: true })
                                  .eq('id', img.id)

                                const { data } = await supabase
                                  .from('vehicle_images')
                                  .select('id, url, is_primary')
                                  .eq('vehicle_id', selectedVehicle.id)
                                setSelectedVehicle((v) => ({ ...v, vehicle_images: data ?? [] }))
                                fetchVehicles()
                                toast.success('Primary image updated')
                              }}
                              className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-1 transition-colors"
                            >
                              Set Primary
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (!confirm('Delete this image?')) return
                              await supabase
                                .from('vehicle_images')
                                .delete()
                                .eq('id', img.id)

                              const { data } = await supabase
                                .from('vehicle_images')
                                .select('id, url, is_primary')
                                .eq('vehicle_id', selectedVehicle.id)
                              setSelectedVehicle((v) => ({ ...v, vehicle_images: data ?? [] }))
                              fetchVehicles()
                              toast.success('Image deleted')
                            }}
                            className="w-full text-xs bg-red-600/80 hover:bg-red-600 text-white rounded px-2 py-1 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm">
                  No photos yet. Upload some above.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}