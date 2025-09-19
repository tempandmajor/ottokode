#!/bin/bash

echo "🔧 Fixing macOS icon cache for Ottokode desktop app..."

# Kill the app if it's running
echo "1. Closing Ottokode app..."
pkill -f "Ottokode" 2>/dev/null || true

# Remove the app from Applications to clear cache
echo "2. Removing old app bundle..."
rm -rf "/Applications/Ottokode.app" 2>/dev/null || true

# Clear icon cache
echo "3. Clearing macOS icon cache..."
sudo rm -rf /Library/Caches/com.apple.iconservices.store 2>/dev/null || true

# Clear LaunchServices database
echo "4. Clearing LaunchServices database..."
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -seed 2>/dev/null || true

# Restart Finder and Dock
echo "5. Restarting Finder and Dock..."
killall Finder 2>/dev/null || true
killall Dock 2>/dev/null || true

# Copy the new app to Applications
echo "6. Installing updated app..."
cp -R "/Users/emmanuelakangbou/ai-ide/src-tauri/target/release/bundle/macos/Ottokode.app" "/Applications/"

# Register the new app
echo "7. Registering new app..."
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister "/Applications/Ottokode.app"

echo "✅ Done! The new icon should now appear."
echo "📱 Launch Ottokode from Applications folder or Spotlight."

# Wait a moment for services to restart
sleep 2

# Launch the app
echo "🚀 Launching Ottokode..."
open "/Applications/Ottokode.app"