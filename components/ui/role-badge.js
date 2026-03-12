import { cn } from '@/lib/utils'

const ROLE_STYLES = {
  ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  REGISTER: 'bg-blue-100 text-blue-800 border-blue-200',
  CLIENT: 'bg-green-100 text-green-800 border-green-200',
}

export function RoleBadge({ role, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        ROLE_STYLES[role] || 'bg-gray-100 text-gray-600',
        className
      )}
    >
      {role}
    </span>
  )
}
