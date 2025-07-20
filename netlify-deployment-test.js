// Simple test script to verify Netlify deployment
console.log('Testing Netlify deployment configuration...');

// Check if we're in a Netlify build environment
const isNetlify = process.env.NETLIFY === 'true';
console.log('Is Netlify environment:', isNetlify);

// Check Node version
console.log('Node version:', process.version);

// Check environment variables
console.log('Environment variables:');
console.log('- NETLIFY:', process.env.NETLIFY);
console.log('- NETLIFY_DEV:', process.env.NETLIFY_DEV);
console.log('- NODE_ENV:', process.env.NODE_ENV);

// Test basic functionality
try {
  console.log('✅ Basic JavaScript execution works');
  
  // Test async/await
  (async () => {
    console.log('✅ Async/await works');
  })();
  
  console.log('✅ Deployment test completed successfully');
} catch (error) {
  console.error('❌ Deployment test failed:', error);
  process.exit(1);
}