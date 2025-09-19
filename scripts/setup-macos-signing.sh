#!/bin/bash

# macOS Code Signing Setup Script for Ottokode
# This script helps you set up Apple Developer certificates and keys

set -e

echo "🍎 Setting up macOS Code Signing for Ottokode"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command -v xcode-select &> /dev/null; then
    echo -e "${RED}❌ Xcode Command Line Tools not found${NC}"
    echo "Please install with: xcode-select --install"
    exit 1
fi

if ! command -v security &> /dev/null; then
    echo -e "${RED}❌ Security tool not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites satisfied${NC}"

# Get team information
echo -e "${BLUE}🔍 Getting Apple Developer Team information...${NC}"

# Check existing certificates
echo -e "${YELLOW}📜 Current code signing identities:${NC}"
security find-identity -v -p codesigning

echo ""
echo -e "${BLUE}ℹ️  Next Steps Manual Setup Required:${NC}"
echo "=============================================="

echo -e "${YELLOW}1. Create Developer ID Application Certificate:${NC}"
echo "   a) Open Keychain Access"
echo "   b) Menu → Certificate Assistant → Request a Certificate From a Certificate Authority"
echo "   c) Enter your Apple Developer email address"
echo "   d) Choose 'Save to disk'"
echo "   e) Go to https://developer.apple.com/account/resources/certificates/list"
echo "   f) Click '+' to create new certificate"
echo "   g) Choose 'Developer ID Application'"
echo "   h) Upload the CSR file you saved"
echo "   i) Download and install the certificate"

echo ""
echo -e "${YELLOW}2. Export Certificate as .p12:${NC}"
echo "   a) Open Keychain Access"
echo "   b) Find 'Developer ID Application: Your Name (TEAM_ID)'"
echo "   c) Right-click → Export"
echo "   d) Choose .p12 format"
echo "   e) Set a strong password (save it!)"
echo "   f) Save to ~/Desktop/DeveloperIDApp.p12"

echo ""
echo -e "${YELLOW}3. Create App Store Connect API Key:${NC}"
echo "   a) Go to https://appstoreconnect.apple.com"
echo "   b) Users and Access → Keys → '+'"
echo "   c) Choose role: Admin or App Manager"
echo "   d) Download the .p8 file"
echo "   e) Save the Key ID and Issuer ID"

echo ""
echo -e "${YELLOW}4. Run the next script to configure GitHub secrets:${NC}"
echo "   ./scripts/configure-github-secrets.sh"

echo ""
echo -e "${GREEN}🔧 This script will help you encode the certificates for GitHub Actions${NC}"

# Function to encode p12 if it exists
encode_p12() {
    local p12_path="$1"
    if [[ -f "$p12_path" ]]; then
        echo -e "${GREEN}📦 Encoding .p12 certificate...${NC}"
        local encoded=$(base64 -i "$p12_path")
        echo -e "${BLUE}MAC_CERT_P12 (copy this):${NC}"
        echo "$encoded"
        echo ""
        return 0
    else
        echo -e "${YELLOW}⚠️  .p12 file not found at $p12_path${NC}"
        return 1
    fi
}

# Check if p12 exists and offer to encode it
P12_PATH="$HOME/Desktop/DeveloperIDApp.p12"
if [[ -f "$P12_PATH" ]]; then
    echo -e "${GREEN}✅ Found .p12 certificate at $P12_PATH${NC}"
    read -p "Do you want to encode it for GitHub Actions? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        encode_p12 "$P12_PATH"
    fi
else
    echo -e "${YELLOW}ℹ️  When you have the .p12 certificate, save it to $P12_PATH and run this script again${NC}"
fi

echo ""
echo -e "${BLUE}📚 Useful Commands:${NC}"
echo "  Check certificates: security find-identity -v -p codesigning"
echo "  Test signing: codesign -s 'Developer ID Application' /path/to/app"
echo "  Verify signature: codesign -dv --verbose=4 /path/to/app"
echo ""
echo -e "${GREEN}🎯 Next: After getting certificates, run ./scripts/configure-github-secrets.sh${NC}"