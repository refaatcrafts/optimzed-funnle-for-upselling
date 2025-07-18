"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Coffee, User, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CartSheet } from "@/components/cart/CartSheet"
import { MobileMenu } from "@/components/layout/MobileMenu"
import { useCart } from "@/lib/hooks/useCart"
import { APP_CONFIG, NAVIGATION_ITEMS, ADMIN_NAVIGATION_ITEM } from "@/lib/constants/app"
import { AdminAuthService } from "@/lib/services/admin-auth"

export function Navigation() {
  const cart = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)

  useEffect(() => {
    // Check admin authentication status
    const checkAdminAuth = () => {
      setIsAdminAuthenticated(AdminAuthService.validateSession())
    }

    checkAdminAuth()
    
    // Check periodically for session changes
    const interval = setInterval(checkAdminAuth, 5000)
    
    return () => clearInterval(interval)
  }, [])

  // Create navigation items with conditional admin link
  const navigationItems = isAdminAuthenticated 
    ? [...NAVIGATION_ITEMS, ADMIN_NAVIGATION_ITEM]
    : NAVIGATION_ITEMS

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Coffee className="w-8 h-8 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">{APP_CONFIG.name}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-orange-600 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Cart and User Actions */}
          <div className="flex items-center gap-4">
            <CartSheet
              cart={cart}
              isOpen={isCartOpen}
              onOpenChange={setIsCartOpen}
            />

            <Button variant="ghost" size="sm">
              <User className="w-5 h-5" />
            </Button>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <MobileMenu
          items={navigationItems}
          isOpen={isMenuOpen}
          onItemClick={() => setIsMenuOpen(false)}
        />
      </div>
    </nav>
  )
}
