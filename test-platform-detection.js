// Simple test script to verify platform detection
const { PlatformDetector } = require('./lib/storage/platform-detector.ts')

console.log('Testing platform detection...')

// Test local environment (should detect SQLite)
console.log('Current platform:', PlatformDetector.detect())
console.log('Platform info:', PlatformDetector.getPlatformInfo())

// Test Netlify environment simulation
process.env.NETLIFY = 'true'
console.log('Netlify simulation:', PlatformDetector.detect())
console.log('Netlify platform info:', PlatformDetector.getPlatformInfo())

// Test Vercel environment simulation
delete process.env.NETLIFY
process.env.VERCEL = '1'
console.log('Vercel simulation:', PlatformDetector.detect())
console.log('Vercel platform info:', PlatformDetector.getPlatformInfo())

console.log('Platform detection test completed!')