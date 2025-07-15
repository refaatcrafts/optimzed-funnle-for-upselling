import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { CartProvider } from "@/components/cart-context"
import { Toaster } from "@/components/ui/toaster"
import { APP_CONFIG } from "@/lib/constants/app"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Premium Italian Coffee Products`,
  description: APP_CONFIG.tagline,
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
