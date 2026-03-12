'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/status-badge'
import AssignCustomerModal from '@/components/assign-customer-modal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import AddCustomerForm from '@/components/add-customer-form'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar, Clock, Users, ArrowLeft, Trash2, UserPlus, Plus } from 'lucide-react'

export default function ScheduleDetailClient({ scheduleId, role }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [assignOpen, setAssignOpen] = useState(false)
  const [newCustomerOpen, setNewCustomerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/schedules/${scheduleId}`)
    if (res.ok) {
      setData(await res.json())
    }
    setLoading(false)
  }, [scheduleId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleRemoveAssignment(assignmentId) {
    const res = await fetch(`/api/assignments?id=${assignmentId}`, { method: 'DELETE' })
    if (res.ok) {
      fetchData()
    }
    setDeleteTarget(null)
  }

  if (loading) return <div className="text-slate-500 text-sm">Loading…</div>
  if (!data) return <div className="text-red-500 text-sm">Schedule not found.</div>

  const { schedule, assignments } = data
  const date = new Date(schedule.ferryDate || schedule.ferry_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div>
      <div className="mb-6">
        <Link href="/schedules" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Schedules
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Schedule #{schedule.id}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />{date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />{schedule.ferryTime || schedule.ferry_time}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-600" />
                {assignments.length} / {schedule.maxCapacity || schedule.max_capacity}
              </span>
              <StatusBadge status={schedule.status} />
            </div>
          </div>
          {(role === 'ADMIN' || role === 'REGISTER') && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewCustomerOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" /> New Customer
              </Button>
              <Button
                size="sm"
                onClick={() => setAssignOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                <UserPlus className="w-4 h-4 mr-1" /> Assign Customer
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Assigned By</TableHead>
              <TableHead>Assigned At</TableHead>
              {role === 'ADMIN' && <TableHead className="w-16" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={role === 'ADMIN' ? 5 : 4} className="text-center py-10 text-slate-400">
                  No passengers assigned yet
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((a) => (
                <TableRow key={a.assignment_id}>
                  <TableCell className="font-medium">{a.customer_name}</TableCell>
                  <TableCell className="text-slate-500">{a.customer_contact || '—'}</TableCell>
                  <TableCell className="text-slate-500">{a.assigned_by_name}</TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {new Date(a.assigned_at).toLocaleString()}
                  </TableCell>
                  {role === 'ADMIN' && (
                    <TableCell>
                      <button
                        onClick={() => setDeleteTarget(a)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign Modal */}
      <AssignCustomerModal
        scheduleId={scheduleId}
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onAssigned={fetchData}
      />

      {/* New Customer Modal */}
      <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <AddCustomerForm
            onCreated={() => setNewCustomerOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Passenger?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 py-2">
            Remove <strong>{deleteTarget?.customer_name}</strong> from this schedule?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => handleRemoveAssignment(deleteTarget.assignment_id)}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
