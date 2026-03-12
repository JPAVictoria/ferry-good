import { cn } from '@/lib/utils'

const STATUS_STYLES = {
  OPEN: 'bg-green-100 text-green-800 border-green-200',
  FULL: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
}

export function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        STATUS_STYLES[status] || STATUS_STYLES.CANCELLED,
        className
      )}
    >
      {status}
    </span>
  )
}
