#!/bin/bash
# Build and Deploy SDK Script
# This script builds the JavaScript SDK and makes it available to the backend for serving

set -e  # Exit on error

echo "🔨 Building Affiliate Tracking SDK..."

# Navigate to SDK directory
cd "$(dirname "$0")/../sdk"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing SDK dependencies..."
    npm install
fi

# Build the SDK
echo "⚙️  Building SDK files..."
npm run build

# Check if build was successful
if [ ! -f "dist/affiliate-sdk.min.js" ]; then
    echo "❌ Build failed! SDK files not found in dist/"
    exit 1
fi

echo "✅ SDK built successfully!"
echo ""
echo "📊 Built files:"
ls -lh dist/*.js dist/*.d.ts

echo ""
echo "🚀 SDK is ready to be served!"
echo ""
echo "Next steps:"
echo "1. Start/restart the backend: docker-compose restart backend"
echo "2. SDK will be available at: http://localhost:8000/sdk/affiliate-sdk.min.js"
echo "3. Check SDK info at: http://localhost:8000/"
echo ""
echo "For production deployment:"
echo "- Ensure sdk/dist/ is included in your deployment"
echo "- Backend will automatically serve files from /sdk endpoint"
