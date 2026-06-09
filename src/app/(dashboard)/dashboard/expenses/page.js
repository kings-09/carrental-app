'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { createExpense, deleteExpense } from '@/app/actions/expenses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus, Search, TrendingDown, MoreVertical, Trash2, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

const EXPENSE_CATEGORIES = [
  'Vehicle Maintenance',
  'Fuel',
  'Insurance',
  'Staff Salary',
  'Driver Payment',
  'Office Rent',
  'Utilities',
  'Marketing',
  'Taxes',
  'Miscellaneous',
]

const categoryColors = {
  'Vehicle Maintenance': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Fuel':               'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Insurance':          'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Staff Salary':       'bg-green-500/10 text-green-400 border-green-500/20',
  'Driver Payment':     'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'Taxes':              'bg-red-500/10 text-red-400 border-red-500/20',
  'Miscellaneous':      'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

const inputClass = 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-10 text-sm'
const labelClass = 'text-slate-300 text-xs sm:text-sm'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [vehicles, setVehicles] = useState([])
  const [form, setForm] = useState({
    category: '',
    description: '',
    amount: '',
    vehicle_id: '',
    vendor: '',
    expense_date: new Date().toISOString().split('T')[0],
  })

  const supabase = createClient()

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('expenses')
      .select(`
        id, category, description, amount, vendor,
        expense_date, created_at,
        vehicles(make, model, plate_number)
      `)
      .eq('is_deleted', false)
      .order('expense_date', { ascending: false })

    if (categoryFilter !== 'all') query = query.eq('category', categoryFilter)
    if (search) {
      query = query.or(
        `description.ilike.%${search}%,vendor.ilike.%${search}%`
      )
    }

    const { data } = await query
    setExpenses(data ?? [])
    setLoading(false)
  }, [search, categoryFilter])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  useEffect(() => {
    supabase.from('vehicles')
      .select('id, make, model, plate_number')
      .eq('is_deleted', false)
      .then(({ data }) => setVehicles(data ?? []))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const result = await createExpense(form)
    setSubmitting(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Expense recorded!')
    setShowForm(false)
    setForm({
      category: '',
      description: '',
      amount: '',
      vehicle_id: '',
      vendor: '',
      expense_date: new Date().toISOString().split('T')[0],
    })
    fetchExpenses()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    const result = await deleteExpense(id)
    if (result.error) { toast.error(result.error); return }
    toast.success('Expense deleted.')
    fetchExpenses()
  }

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const handleChange = (e) => set(e.target.name, e.target.value)

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount ?? 0), 0)

  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    category: cat,
    total: expenses
      .filter((e) => e.category === cat)
      .reduce((s, e) => s + (e.amount ?? 0), 0),
  })).filter((c) => c.total > 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Expenses</h1>
          <p className="text-slate-400 text-sm mt-0.5">{expenses.length} records</p>
        </div>
        <Button onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
          <Plus size={16} className="mr-2" /> Record Expense
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
          <p className="text-xs text-slate-500 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-400">
            ${totalExpenses.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
          <p className="text-xs text-slate-500 mb-1">Total Records</p>
          <p className="text-2xl font-bold text-white">{expenses.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
          <p className="text-xs text-slate-500 mb-1">Categories Used</p>
          <p className="text-2xl font-bold text-white">{byCategory.length}</p>
        </div>
      </div>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Breakdown by Category
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {byCategory.map((c) => (
              <div key={c.category}
                className={`rounded-lg border px-3 py-2 ${categoryColors[c.category] ?? 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                <p className="text-xs font-medium truncate">{c.category}</p>
                <p className="text-sm font-bold mt-0.5">${c.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search by description or vendor..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-10" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-10 w-full sm:w-52">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">All Categories</SelectItem>
            {EXPENSE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <TrendingDown size={40} className="text-slate-600" />
            <p className="text-slate-400 font-medium">No expenses recorded</p>
            <Button onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white mt-2">
              <Plus size={15} className="mr-2" /> Record First Expense
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/40">
                  {['Date', 'Category', 'Description', 'Vehicle', 'Vendor', 'Amount', ''].map((h) => (
                    <th key={h} className="text-left py-3 px-3 sm:px-4 text-slate-500 font-medium text-xs uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 sm:px-4 text-slate-400 text-xs whitespace-nowrap">
                      {format(new Date(exp.expense_date), 'dd MMM yyyy')}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${categoryColors[exp.category] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-slate-300 max-w-xs truncate">
                      {exp.description}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-slate-400 text-xs whitespace-nowrap">
                      {exp.vehicles
                        ? `${exp.vehicles.make} ${exp.vehicles.model}`
                        : '—'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-slate-400 whitespace-nowrap">
                      {exp.vendor ?? '—'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-red-400 font-semibold whitespace-nowrap">
                      ${exp.amount?.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                            <MoreVertical size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-36">
                          <DropdownMenuItem onClick={() => handleDelete(exp.id)}
                            className="text-red-400 hover:text-red-300 text-sm gap-2 cursor-pointer">
                            <Trash2 size={13} /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Record Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className={labelClass}>Category *</Label>
                <Select value={form.category} onValueChange={(v) => set('category', v)} required>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Amount ($) *</Label>
                <Input name="amount" type="number" value={form.amount}
                  onChange={handleChange} placeholder="0.00" step="0.01"
                  min="0" required className={inputClass} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className={labelClass}>Description *</Label>
                <Input name="description" value={form.description}
                  onChange={handleChange} placeholder="Brief description of expense"
                  required className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Vendor / Supplier</Label>
                <Input name="vendor" value={form.vendor}
                  onChange={handleChange} placeholder="Vendor name" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Date *</Label>
                <Input name="expense_date" type="date" value={form.expense_date}
                  onChange={handleChange} required className={inputClass} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className={labelClass}>Related Vehicle (optional)</Label>
                <Select value={form.vehicle_id} onValueChange={(v) => set('vehicle_id', v)}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Link to a vehicle" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-48">
                    <SelectItem value="none" className="text-slate-400">No vehicle</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id} className="text-white">
                        {v.make} {v.model} — {v.plate_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10">
              {submitting
                ? <><Loader2 size={15} className="animate-spin mr-2" />Saving...</>
                : 'Record Expense'
              }
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}