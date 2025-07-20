# Netlify Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 2. Build and Test Locally
```bash
npm run build
npm start
```

### 3. Deploy to Netlify

#### Option A: Netlify CLI (Recommended)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

#### Option B: Git Integration
1. Push your code to GitHub/GitLab
2. Connect your repository in Netlify dashboard
3. Netlify will auto-deploy on push

## 🔧 Configuration Files

### netlify.toml
- ✅ Configured for Next.js API routes
- ✅ Uses @netlify/plugin-nextjs
- ✅ Proper redirects for API endpoints

### next.config.mjs
- ✅ Optimized for Netlify deployment
- ✅ API routes enabled (no static export)
- ✅ Image optimization disabled for compatibility

### package.json
- ✅ @netlify/plugin-nextjs added as dev dependency
- ✅ Build scripts configured

## 🧪 Testing Deployment

### 1. Test API Routes
After deployment, test these endpoints:
- `https://your-site.netlify.app/api/test` - Basic API test
- `https://your-site.netlify.app/api/config` - Configuration endpoint
- `https://your-site.netlify.app/api/admin/taager-credentials` - Admin API (requires auth)

### 2. Test Admin Panel
- Visit: `https://your-site.netlify.app/admin`
- Login with your credentials
- Configure Taager API credentials
- Test SKU validation

### 3. Test Dynamic Content
- Visit home page - should show dynamic product
- Visit product page - should show real product data
- Check recommendations and bundles

## 🔍 Troubleshooting

### API Routes Return 404
- Check netlify.toml configuration
- Ensure @netlify/plugin-nextjs is installed
- Verify build logs for errors

### Storage Issues
- System automatically falls back from SQLite to file storage on Netlify
- Check browser console for storage-related errors
- Admin configuration should work with file-based storage

### Environment Variables
Set these in Netlify dashboard (if needed):
- `NODE_ENV=production`
- Any custom environment variables your app uses

### Build Errors
Common fixes:
- Update Node.js version to 20 in Netlify settings
- Check for TypeScript/ESLint errors (currently ignored in config)
- Verify all dependencies are in package.json

## 📊 Performance Optimization

### Caching
- API responses are cached for 30 minutes
- Product images use Next.js optimization
- Static assets cached by Netlify CDN

### Storage
- Uses Netlify Blobs for configuration storage
- Automatic fallback to file-based storage
- Graceful error handling for storage failures

## 🔐 Security

### API Protection
- Admin routes protected with authentication
- Sensitive data not exposed in public endpoints
- API credentials encrypted in storage

### CORS
- Configured for your domain
- API routes handle cross-origin requests properly

## 📝 Deployment Checklist

- [ ] Code pushed to repository
- [ ] Dependencies installed (`npm install`)
- [ ] Build successful (`npm run build`)
- [ ] netlify.toml configured
- [ ] @netlify/plugin-nextjs installed
- [ ] Environment variables set (if any)
- [ ] Domain configured in Netlify
- [ ] SSL certificate enabled
- [ ] Test all API endpoints
- [ ] Test admin panel functionality
- [ ] Verify dynamic content loading

## 🆘 Support

If you encounter issues:
1. Check Netlify build logs
2. Test API endpoints with curl or Postman
3. Check browser console for JavaScript errors
4. Verify network requests in browser dev tools

## 🎯 Expected Behavior After Deployment

✅ **Working Features:**
- Home page with dynamic product data
- Product page with real images and features
- Admin panel for configuration
- API credential management
- SKU validation
- Dynamic recommendations and bundles
- Upsell offers on thank you page

✅ **Automatic Fallbacks:**
- SQLite → File storage on serverless
- API failures → Static content
- Missing configuration → Default values
- Network errors → Cached data