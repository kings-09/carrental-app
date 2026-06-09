export default function VehicleDetailPage({ params }) {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-bold text-white">Vehicle Detail</h1>
      <p className="text-slate-400 text-sm">ID: {params.id}</p>
    </div>
  )
}