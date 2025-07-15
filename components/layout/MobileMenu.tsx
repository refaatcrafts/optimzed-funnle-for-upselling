import Link from 'next/link'
import { NavigationItem } from '@/lib/types'

interface MobileMenuProps {
  items: readonly NavigationItem[]
  isOpen: boolean
  onItemClick: () => void
}

export function MobileMenu({ items, isOpen, onItemClick }: MobileMenuProps) {
  if (!isOpen) return null

  return (
    <div className="md:hidden border-t border-gray-200 py-4">
      <div className="flex flex-col space-y-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-gray-700 hover:text-orange-600 transition-colors"
            onClick={onItemClick}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}