import { NextResponse } from 'next/server'

// Simple test endpoint to verify API routes work on Netlify
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'API routes are working on Netlify!',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        netlify: process.env.NETLIFY,
        platform: process.platform
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'API test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'POST method works too!',
    timestamp: new Date().toISOString()
  })
}