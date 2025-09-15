#!/bin/bash

# Branchcode AI - Production Build Script
set -e

echo "🚀 Starting Branchcode AI production build..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Please create one based on .env.example"
    print_warning "The build will continue but may not work correctly without proper environment variables."
fi

# Check Node.js version
NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm --version)
print_status "npm version: $NPM_VERSION"

# Clean previous builds
print_status "Cleaning previous builds..."
npm run clean || true
rm -rf src-tauri/target || true

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Type check
print_status "Running type check..."
npm run type-check

# Build frontend
print_status "Building frontend for production..."
npm run build

# Check if dist directory was created
if [ ! -d "dist" ]; then
    print_error "Frontend build failed - dist directory not created"
    exit 1
fi

print_success "Frontend build completed successfully"

# Build Tauri app
print_status "Building Tauri application..."
npm run tauri:build

# Check if build artifacts were created
if [ -d "src-tauri/target/release" ]; then
    print_success "Tauri build completed successfully"

    # List build artifacts
    print_status "Build artifacts:"
    if [ "$(uname)" == "Darwin" ]; then
        # macOS
        if [ -d "src-tauri/target/release/bundle/macos" ]; then
            ls -la src-tauri/target/release/bundle/macos/
        fi
        if [ -d "src-tauri/target/release/bundle/dmg" ]; then
            print_status "DMG files:"
            ls -la src-tauri/target/release/bundle/dmg/
        fi
    elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
        # Linux
        if [ -d "src-tauri/target/release/bundle/deb" ]; then
            print_status "DEB files:"
            ls -la src-tauri/target/release/bundle/deb/
        fi
        if [ -d "src-tauri/target/release/bundle/appimage" ]; then
            print_status "AppImage files:"
            ls -la src-tauri/target/release/bundle/appimage/
        fi
    elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ] || [ "$(expr substr $(uname -s) 1 10)" == "MINGW64_NT" ]; then
        # Windows
        if [ -d "src-tauri/target/release/bundle/msi" ]; then
            print_status "MSI files:"
            ls -la src-tauri/target/release/bundle/msi/
        fi
        if [ -d "src-tauri/target/release/bundle/nsis" ]; then
            print_status "NSIS installer files:"
            ls -la src-tauri/target/release/bundle/nsis/
        fi
    fi
else
    print_error "Tauri build failed - no release artifacts found"
    exit 1
fi

# Calculate build size
DIST_SIZE=$(du -sh dist | cut -f1)
print_status "Frontend bundle size: $DIST_SIZE"

# Build summary
print_success "✅ Production build completed successfully!"
echo ""
echo "📊 Build Summary:"
echo "   • Frontend bundle size: $DIST_SIZE"
echo "   • Platform: $(uname)"
echo "   • Node.js: $NODE_VERSION"
echo "   • Build time: $(date)"
echo ""
echo "📦 Next steps:"
echo "   1. Test the application thoroughly"
echo "   2. Sign the executables (if required)"
echo "   3. Create release notes"
echo "   4. Upload to distribution platform"
echo ""
print_status "Build artifacts are located in src-tauri/target/release/bundle/"