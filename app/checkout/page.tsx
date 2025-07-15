"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { ArrowLeft, CreditCard, Truck, Shield, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

const cartItems = [
  {
    id: "mocha-pot",
    name: "Classic Italian Mocha Pot",
    price: 89,
    originalPrice: 129,
    image: "/images/mocha-pot.jpg",
    quantity: 1,
  },
  {
    id: "coffee-blender",
    name: "High-Performance Coffee Blender",
    price: 299,
    originalPrice: 399,
    image: "/images/coffee-blender.jpg",
    quantity: 1,
  },
  {
    id: "coffee-beans",
    name: "Premium Arabica Coffee Beans (1kg)",
    price: 29,
    image: "/images/coffee-beans.jpg",
    quantity: 2,
  },
]

export default function CheckoutPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const savings = cartItems.reduce(
    (sum, item) => sum + ((item.originalPrice || item.price) - item.price) * item.quantity,
    0,
  )
  const shipping = subtotal >= 400 ? 0 : 15
  const tax = Math.round(subtotal * 0.08 * 100) / 100
  const total = subtotal + shipping + tax

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsProcessing(false)
    setOrderComplete(true)
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for your purchase. Your order #CF-2024-001 has been confirmed and will be shipped within 2-3
              business days.
            </p>
            <div className="space-y-3">
              <Link href="/">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">Continue Shopping</Button>
              </Link>
              <Button variant="outline" className="w-full bg-transparent">
                Track Your Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/product" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Product
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@example.com" />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="123 Main St" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="New York" />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input id="zipCode" placeholder="10001" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input id="expiryDate" placeholder="MM/YY" />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cardName">Name on Card</Label>
                  <Input id="cardName" placeholder="John Doe" />
                </div>
              </CardContent>
            </Card>

            {/* Security Badge */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4" />
              Your payment information is secure and encrypted
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <span>${item.price}</span>
                        {item.originalPrice && (
                          <span className="text-gray-500 line-through">${item.originalPrice}</span>
                        )}
                        <span className="text-gray-600">× {item.quantity}</span>
                      </div>
                    </div>
                    <div className="font-medium">${item.price * item.quantity}</div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Savings</span>
                      <span>-${savings}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "Free" : `$${shipping}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax}</span>
                  </div>
                  {subtotal >= 600 && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <Check className="w-4 h-4" />
                      <span>Free shipping applied!</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total}</span>
                </div>

                <form onSubmit={handleSubmit}>
                  <Button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-3"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </div>
                    ) : (
                      `Complete Order - $${total}`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <Shield className="w-6 h-6 text-green-600" />
                    <span className="text-gray-600">Secure Payment</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Truck className="w-6 h-6 text-blue-600" />
                    <span className="text-gray-600">Fast Shipping</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Check className="w-6 h-6 text-orange-600" />
                    <span className="text-gray-600">Quality Guarantee</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
