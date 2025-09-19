#!/bin/bash

# GitHub Secrets Configuration Script for Ottokode
# This script helps you prepare and set GitHub repository secrets for code signing

set -e

echo "🔐 GitHub Secrets Configuration for Ottokode"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to encode file to base64
encode_file() {
    local file_path="$1"
    local secret_name="$2"

    if [[ -f "$file_path" ]]; then
        echo -e "${GREEN}📦 Encoding $file_path...${NC}"
        local encoded=$(base64 -i "$file_path")
        echo -e "${BLUE}$secret_name:${NC}"
        echo "$encoded"
        echo ""
        return 0
    else
        echo -e "${RED}❌ File not found: $file_path${NC}"
        return 1
    fi
}

# Function to read file contents
read_file() {
    local file_path="$1"
    local secret_name="$2"

    if [[ -f "$file_path" ]]; then
        echo -e "${GREEN}📄 Reading $file_path...${NC}"
        echo -e "${BLUE}$secret_name:${NC}"
        cat "$file_path"
        echo ""
        echo ""
        return 0
    else
        echo -e "${RED}❌ File not found: $file_path${NC}"
        return 1
    fi
}

echo -e "${BLUE}🔍 Looking for required files...${NC}"

# Check for .p12 certificate
P12_PATH="$HOME/Desktop/DeveloperIDApp.p12"
P8_PATH="$HOME/Desktop/AuthKey_*.p8"

echo ""
echo -e "${YELLOW}📋 Required GitHub Secrets for macOS Code Signing:${NC}"
echo "=================================================="

# 1. MAC_CERT_P12
echo -e "${BLUE}1. MAC_CERT_P12${NC}"
if encode_file "$P12_PATH" "MAC_CERT_P12"; then
    echo -e "${GREEN}✅ MAC_CERT_P12 ready${NC}"
else
    echo -e "${YELLOW}ℹ️  Please export your Developer ID Application certificate as .p12 to $P12_PATH${NC}"
fi

# 2. MAC_CERT_PASSWORD
echo -e "${BLUE}2. MAC_CERT_PASSWORD${NC}"
echo "Enter the password you used when exporting the .p12 certificate"
echo "This will be stored as a GitHub secret"
echo ""

# 3. Apple API Key
echo -e "${BLUE}3. APPLE_API_KEY${NC}"
# Look for .p8 files
P8_FILES=($(ls $HOME/Desktop/AuthKey_*.p8 2>/dev/null || true))
if [ ${#P8_FILES[@]} -gt 0 ]; then
    echo -e "${GREEN}✅ Found Apple API Key files:${NC}"
    for p8_file in "${P8_FILES[@]}"; do
        echo "  - $p8_file"
        read_file "$p8_file" "APPLE_API_KEY"
    done
else
    echo -e "${YELLOW}ℹ️  Please download your App Store Connect API key (.p8) to $HOME/Desktop/${NC}"
    echo "   The file should be named like AuthKey_ABCDEFGHIJ.p8"
fi

echo ""
echo -e "${BLUE}4. Additional Required Secrets:${NC}"
echo "APPLE_API_KEY_ID     - The Key ID from App Store Connect (10 characters, e.g., ABCDEFGHIJ)"
echo "APPLE_API_ISSUER_ID  - The Issuer ID from App Store Connect (UUID format)"
echo "APPLE_TEAM_ID        - Your Apple Developer Team ID (10 characters, e.g., ABCDE12345)"

echo ""
echo -e "${YELLOW}📝 How to add these secrets to GitHub:${NC}"
echo "1. Go to https://github.com/tempandmajor/ottokode/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Add each secret with the exact name and value shown above"

echo ""
echo -e "${YELLOW}🔍 Finding your Team ID:${NC}"
echo "Method 1: Visit https://developer.apple.com/account → Membership → Team ID"
echo "Method 2: Look at your existing certificates:"
security find-identity -v -p codesigning | grep "Developer ID Application" | head -1

echo ""
echo -e "${BLUE}📚 Optional: Windows Code Signing${NC}"
echo "If you have a Windows code signing certificate (.pfx):"
echo "WIN_CERT_PFX      - base64 encoded .pfx file"
echo "WIN_CERT_PASSWORD - password for the .pfx file"

echo ""
echo -e "${GREEN}🎯 Next Steps:${NC}"
echo "1. Add all the secrets to GitHub Actions"
echo "2. Run: git tag v1.0.1 && git push origin v1.0.1"
echo "3. Check the GitHub Actions workflow results"
echo "4. Download and test the signed .dmg"

echo ""
echo -e "${BLUE}🧪 Local Testing Commands:${NC}"
cat << 'EOF'
# Test code signing locally:
codesign -s "Developer ID Application" --timestamp --options runtime src-tauri/target/release/bundle/macos/Ottokode.app

# Verify signature:
codesign -dv --verbose=4 src-tauri/target/release/bundle/macos/Ottokode.app

# Test Gatekeeper:
spctl -a -vv -t install src-tauri/target/release/bundle/macos/Ottokode.app

# Check for hardened runtime:
codesign -d --entitlements - src-tauri/target/release/bundle/macos/Ottokode.app
EOF

echo ""
echo -e "${GREEN}✨ Setup complete! Add the secrets to GitHub and create a release tag.${NC}"