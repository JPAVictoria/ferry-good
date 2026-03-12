'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Calendar, Clock, Plus } from 'lucide-react'

export default function SchedulesClient({ role }) {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newSchedule, setNewSchedule] = useState({ ferryDate: '', ferryTime: '', maxCapacity: '' })
  const [createError, setCreateError] = useState('')

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    const res = await fetch(`/api/schedules?${params}`)
    if (res.ok) {
      const data = await res.json()
      setSchedules(data)
    }
    setLoading(false)
  }, [statusFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  async function handleCreate(e) {
    e.preventDefault()
    setCreateError('')
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSchedule),
    })
    if (res.ok) {
      setShowCreate(false)
      setNewSchedule({ ferryDate: '', ferryTime: '', maxCapacity: '' })
      fetchSchedules()
    } else {
      const data = await res.json()
      setCreateError(data.error || 'Failed to create schedule')
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <div className="flex-1 min-w-36">
          <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
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
          <label className="text-xs font-medium text-slate-600 mb-1 block">From</label>
          <Input type="date" className="h-9 w-36" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">To</label>
          <Input type="date" className="h-9 w-36" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        {role === 'ADMIN' && (
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white h-9 ml-auto"
          >
            <Plus className="w-4 h-4 mr-1" /> New Schedule
          </Button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-slate-500 text-sm">Loading schedules…</div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No schedules found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((s) => {
            const pct = s.max_capacity > 0
              ? Math.round((s.assignment_count / s.max_capacity) * 100)
              : 0
            const date = new Date(s.ferry_date).toLocaleDateString('en-US', {
              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
            })
            return (
              <Link key={s.id} href={`/schedules/${s.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border border-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <StatusBadge status={s.status} />
                      <span className="text-xs text-slate-400">#{s.id}</span>
                    </div>
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Calendar className="w-4 h-4 text-teal-600 flex-shrink-0" />
                        {date}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Clock className="w-4 h-4 text-teal-600 flex-shrink-0" />
                        {s.ferry_time}
                      </div>
                    </div>
                    {/* Capacity bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {s.assignment_count} / {s.max_capacity}
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-teal-500'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Create Schedule Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Schedule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ferryDate">Ferry Date</Label>
              <Input
                id="ferryDate"
                type="date"
                value={newSchedule.ferryDate}
                onChange={(e) => setNewSchedule({ ...newSchedule, ferryDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ferryTime">Ferry Time</Label>
              <Input
                id="ferryTime"
                type="time"
                value={newSchedule.ferryTime}
                onChange={(e) => setNewSchedule({ ...newSchedule, ferryTime: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxCapacity">Max Capacity</Label>
              <Input
                id="maxCapacity"
                type="number"
                min="1"
                value={newSchedule.maxCapacity}
                onChange={(e) => setNewSchedule({ ...newSchedule, maxCapacity: e.target.value })}
                required
              />
            </div>
            {createError && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{createError}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
