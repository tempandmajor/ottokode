#!/bin/bash

echo "🔧 Force updating Ottokode desktop app icon..."

# Stop all instances
echo "1. Killing all Ottokode processes..."
pkill -f "Ottokode" 2>/dev/null || true
pkill -f "tauri-app" 2>/dev/null || true

# Remove all cached versions
echo "2. Removing all cached app instances..."
rm -rf "/Applications/Ottokode.app" 2>/dev/null || true
rm -rf "$HOME/Applications/Ottokode.app" 2>/dev/null || true
rm -rf "/Users/Shared/Applications/Ottokode.app" 2>/dev/null || true

# Clear all possible caches
echo "3. Clearing all icon caches..."
sudo rm -rf /Library/Caches/com.apple.iconservices.store 2>/dev/null || true
rm -rf "$HOME/Library/Caches/com.apple.iconservices" 2>/dev/null || true
rm -rf "$HOME/Library/Caches/com.apple.dock" 2>/dev/null || true

# Reset LaunchServices completely
echo "4. Resetting LaunchServices database..."
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user 2>/dev/null || true

# Touch the icon files to update timestamps
echo "5. Updating icon file timestamps..."
cd "/Users/emmanuelakangbou/ai-ide/src-tauri/icons/"
touch *.png *.icns *.ico 2>/dev/null || true

# Rebuild the app completely
echo "6. Rebuilding desktop app..."
cd "/Users/emmanuelakangbou/ai-ide"
npm run clean >/dev/null 2>&1

# Build just the app, not the DMG (since DMG was failing)
echo "7. Building app bundle..."
tauri build --bundles app >/dev/null 2>&1

# Copy to Applications with a new timestamp
echo "8. Installing fresh app bundle..."
cp -R "/Users/emmanuelakangbou/ai-ide/src-tauri/target/release/bundle/macos/Ottokode.app" "/Applications/"
touch "/Applications/Ottokode.app"

# Force register the new app
echo "9. Force registering new app..."
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "/Applications/Ottokode.app"

# Restart everything that could be caching
echo "10. Restarting system services..."
killall Finder 2>/dev/null || true
killall Dock 2>/dev/null || true
killall SystemUIServer 2>/dev/null || true

echo "✅ Done! Wait 5 seconds for services to restart..."
sleep 5

echo "🚀 Launching Ottokode..."
open "/Applications/Ottokode.app"

echo "📱 If the icon still doesn't update, try logging out and back in."