#!/bin/bash

# Script to take screenshots of the Ottokode desktop app
# Usage: ./scripts/take-screenshot.sh

echo "Taking screenshot of Ottokode desktop app..."

# Wait 3 seconds for user to focus the window
echo "Focus the Ottokode window and wait 3 seconds..."
sleep 3

# Take window screenshot
screencapture -w -o "/Users/emmanuelakangbou/ai-ide/web-app/public/screenshots/desktop-app-$(date +%Y%m%d_%H%M%S).png"

echo "Screenshot saved to web-app/public/screenshots/"

# Also create a symbolic link for the latest screenshot
cd "/Users/emmanuelakangbou/ai-ide/web-app/public/screenshots"
latest=$(ls -t desktop-app-*.png | head -1)
if [ -n "$latest" ]; then
    ln -sf "$latest" "desktop-app-latest.png"
    echo "Latest screenshot linked as desktop-app-latest.png"
fi