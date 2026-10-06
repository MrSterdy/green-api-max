import type { LucideIcon } from 'lucide-react'

export function Icon({
  icon: Component,
  className = '',
}: {
  icon: LucideIcon
  className?: string
}) {
  return <Component className={`icon ${className}`} strokeWidth={2} aria-hidden="true" />
}
