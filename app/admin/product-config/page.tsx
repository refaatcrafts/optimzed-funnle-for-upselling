"use client"

import { ProductConfigurationPanel } from '@/components/admin/ProductConfigurationPanel'

export default function ProductConfigPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductConfigurationPanel />
      </div>
    </div>
  )
}