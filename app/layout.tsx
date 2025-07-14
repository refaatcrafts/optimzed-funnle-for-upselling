import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { CartProvider } from "@/components/cart-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Coffee Shop - Premium Italian Coffee Products",
  description: "Discover authentic Italian coffee products including mocha pots, coffee blenders, and premium beans.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <Navigation />
          <main>{children}</main>
          <Toaster />
        </CartProvider>
      </body>
    </html>
  )
}
