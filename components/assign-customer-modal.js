'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'

export default function AssignCustomerModal({ scheduleId, open, onClose, onAssigned }) {
  const [search, setSearch] = useState('')
  const [customers, setCustomers] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setSearch('')
      setSelected(null)
      setError('')
      return
    }
    fetchCustomers('')
  }, [open])

  useEffect(() => {
    const timer = setTimeout(() => fetchCustomers(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  async function fetchCustomers(q) {
    const res = await fetch(`/api/customers?search=${encodeURIComponent(q)}`)
    if (res.ok) {
      const data = await res.json()
      setCustomers(data)
    }
  }

  async function handleAssign() {
    if (!selected) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: selected.id, scheduleId }),
    })

    setLoading(false)

    if (res.ok) {
      onAssigned?.()
      onClose()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to assign customer')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Customer to Schedule</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Search Customer</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Type customer name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="border rounded-lg max-h-48 overflow-y-auto">
            {customers.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No customers found</p>
            ) : (
              <ul>
                {customers.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(c)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 ${
                        selected?.id === c.id ? 'bg-teal-50 text-teal-700 font-medium' : ''
                      }`}
                    >
                      <span className="block font-medium">{c.customer_name || c.full_name}</span>
                      {(c.contact) && (
                        <span className="text-xs text-slate-400">{c.contact}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selected && (
            <p className="text-sm text-teal-700 bg-teal-50 px-3 py-2 rounded-md">
              Selected: <strong>{selected.customer_name || selected.full_name}</strong>
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleAssign}
            disabled={!selected || loading}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {loading ? 'Assigning…' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
