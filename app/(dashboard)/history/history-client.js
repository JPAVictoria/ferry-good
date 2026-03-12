'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { StatusBadge } from '@/components/ui/status-badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react'

function SortButton({ field, sortField, sortDir, onSort }) {
  const active = sortField === field
  return (
    <button
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 hover:text-slate-800 transition-colors"
    >
      {active ? (
        sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
      ) : (
        <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
      )}
    </button>
  )
}

export default function HistoryClient() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortField, setSortField] = useState('assigned_at')
  const [sortDir, setSortDir] = useState('desc')

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    const res = await fetch(`/api/history?${params}`)
    if (res.ok) {
      const data = await res.json()
      setRows(data.historyData || [])
    }
    setLoading(false)
  }, [search, statusFilter, startDate, endDate])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  function handleSort(field) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortField] ?? ''
      const bv = b[sortField] ?? ''
      const cmp = String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [rows, sortField, sortDir])

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9 h-9"
            placeholder="Search customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="min-w-36">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="FULL">Full</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Input type="date" className="h-9 w-36" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <Input type="date" className="h-9 w-36" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>
                Customer{' '}
                <SortButton field="customer_name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>
                Schedule Date{' '}
                <SortButton field="ferry_date" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              </TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned By</TableHead>
              <TableHead>
                Assigned At{' '}
                <SortButton field="assigned_at" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-400">Loading…</TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-400">No records found</TableCell>
              </TableRow>
            ) : (
              sorted.map((row, i) => (
                <TableRow key={`${row.customer_id}-${row.schedule_id ?? i}`}>
                  <TableCell className="font-medium">{row.customer_name}</TableCell>
                  <TableCell className="text-slate-500">{row.contact || <span className="italic text-slate-300">no contact</span>}</TableCell>
                  <TableCell className="text-slate-600">
                    {row.ferry_date
                      ? new Date(row.ferry_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                      : <span className="italic text-slate-300">—</span>
                    }
                  </TableCell>
                  <TableCell className="text-slate-500">{row.ferry_time || '—'}</TableCell>
                  <TableCell>
                    {row.schedule_status
                      ? <StatusBadge status={row.schedule_status} />
                      : <span className="italic text-slate-300 text-xs">unassigned</span>
                    }
                  </TableCell>
                  <TableCell className="text-slate-500">{row.assigned_by || '—'}</TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {row.assigned_at
                      ? new Date(row.assigned_at).toLocaleString()
                      : '—'
                    }
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-slate-400 mt-3">{sorted.length} record(s)</p>
    </div>
  )
}
