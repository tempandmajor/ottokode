# macOS Code Signing & Notarization Guide for Ottokode

## Overview

This guide walks you through setting up Apple Developer certificates and configuring GitHub Actions for automatic code signing and notarization of your Ottokode desktop app.

## Prerequisites ✅

- [x] **Xcode Command Line Tools** (You have this: `xcode-select version 2412`)
- [x] **Apple Developer Program membership** (Required for notarization)
- [ ] **Team ID** from Apple Developer account
- [ ] **Developer ID Application certificate**
- [ ] **App Store Connect API key**

## Current Status

### Existing Certificates Found:
```
1) Apple Development: Emmanuel Akangbou (V2P22P279X)
2) iPhone Distribution: Ajolla Inc. (KDJ28YA9Z7)
3) Apple Development: hello@ajolla.com (B3C59ZJ287)
```

**Note**: You have development certificates, but you need a **Developer ID Application** certificate for macOS app distribution outside the App Store.

## Step-by-Step Setup

### 🚀 Quick Start

Run the automated setup script:

```bash
./scripts/setup-macos-signing.sh
```

This script will:
- ✅ Check your prerequisites
- 📋 Show you existing certificates
- 📝 Provide step-by-step instructions
- 🔧 Help encode certificates for GitHub

### 📜 Manual Steps Required

#### 1. Create Developer ID Application Certificate

**Using Xcode (Recommended):**
1. Open **Xcode**
2. Go to **Xcode** → **Preferences** → **Accounts**
3. Select your Apple Developer account
4. Click **Manage Certificates...**
5. Click **+** → **Developer ID Application**
6. Certificate will be created and installed automatically

**Using Keychain Access (Alternative):**
1. Open **Keychain Access**
2. **Keychain Access** → **Certificate Assistant** → **Request a Certificate From a Certificate Authority**
3. Enter your Apple Developer email
4. Choose **Save to disk**
5. Go to [developer.apple.com/certificates](https://developer.apple.com/account/resources/certificates/list)
6. Click **+** → **Developer ID Application**
7. Upload the CSR file
8. Download and install the certificate

#### 2. Export Certificate as .p12

1. Open **Keychain Access**
2. Find **"Developer ID Application: Your Name (TEAM_ID)"**
3. Right-click → **Export**
4. Choose **.p12** format
5. Set a **strong password** (save it!)
6. Save to `~/Desktop/DeveloperIDApp.p12`

#### 3. Create App Store Connect API Key

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. **Users and Access** → **Keys** → **+**
3. Name: "Ottokode CI/CD"
4. Role: **Admin** or **App Manager**
5. Click **Generate**
6. Save these values:
   - **Key ID** (e.g., `ABCDEFGHIJ`)
   - **Issuer ID** (UUID format)
7. **Download** the `.p8` file to `~/Desktop/`

#### 4. Find Your Team ID

**Method 1:** Visit [developer.apple.com/account](https://developer.apple.com/account) → **Membership** → **Team ID**

**Method 2:** Look at your certificates:
```bash
security find-identity -v -p codesigning | grep "Ajolla Inc"
```
Your Team ID appears to be: **KDJ28YA9Z7** (from iPhone Distribution certificate)

### 🔐 Configure GitHub Secrets

Run the configuration script:

```bash
./scripts/configure-github-secrets.sh
```

Then add these secrets to GitHub at:
`https://github.com/tempandmajor/ottokode/settings/secrets/actions`

#### Required Secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `MAC_CERT_P12` | base64 encoded .p12 certificate | `MIIKXgIBAzCCCi...` |
| `MAC_CERT_PASSWORD` | Password for .p12 certificate | `your-strong-password` |
| `APPLE_API_KEY` | Contents of .p8 file | `-----BEGIN PRIVATE KEY-----...` |
| `APPLE_API_KEY_ID` | Key ID from App Store Connect | `ABCDEFGHIJ` |
| `APPLE_API_ISSUER_ID` | Issuer ID from App Store Connect | `12345678-1234-1234-1234-123456789012` |
| `APPLE_TEAM_ID` | Your Apple Developer Team ID | `KDJ28YA9Z7` |

#### Optional (Windows):

| Secret Name | Description |
|-------------|-------------|
| `WIN_CERT_PFX` | base64 encoded Windows .pfx certificate |
| `WIN_CERT_PASSWORD` | Password for .pfx certificate |

### 🎯 Testing the Setup

#### 1. Create a Release

Once secrets are configured, create a release:

```bash
git tag v1.0.1
git push origin v1.0.1
```

#### 2. Monitor GitHub Actions

Go to: `https://github.com/tempandmajor/ottokode/actions`

Watch for:
- ✅ Certificate import successful
- ✅ App signing successful
- ✅ Notarization successful
- ✅ Stapling successful

#### 3. Download and Test

Download the `.dmg` from the release and test:

```bash
# Verify signature
codesign -dv --verbose=4 /Applications/Ottokode.app

# Test Gatekeeper
spctl -a -vv -t install /path/to/Ottokode.dmg

# Validate notarization
xcrun stapler validate /path/to/Ottokode.dmg
```

## 🔧 Local Development Testing

Test signing locally before pushing:

```bash
# Build the app locally
cd src-tauri
cargo build --release

# Sign the app
codesign -s "Developer ID Application" --timestamp --options runtime target/release/bundle/macos/Ottokode.app

# Verify signature
codesign -dv --verbose=4 target/release/bundle/macos/Ottokode.app

# Test with Gatekeeper
spctl -a -vv -t install target/release/bundle/macos/Ottokode.app
```

## 🐛 Troubleshooting

### Common Issues:

#### "No identity found" error
```bash
# Check available identities
security find-identity -v -p codesigning

# If empty, you need to create/install Developer ID Application certificate
```

#### "Certificate not trusted" error
```bash
# Trust the certificate
sudo security add-trusted-cert -d root -r trustRoot ~/Desktop/DeveloperIDApp.cer
```

#### Notarization fails
- Verify API key permissions (must be Admin or App Manager)
- Check Team ID matches your certificate
- Ensure app has hardened runtime enabled

#### Build artifacts not found
- Check tauri.conf.json target configuration
- Verify build completed successfully
- Look for artifacts in `src-tauri/target/release/bundle/`

### Debug Commands:

```bash
# List keychains
security list-keychains

# Check certificate details
openssl pkcs12 -info -in ~/Desktop/DeveloperIDApp.p12

# Test notarization command
xcrun notarytool submit app.dmg --keychain-profile "PROFILE_NAME" --wait

# Check app entitlements
codesign -d --entitlements - /path/to/app.app
```

## 📚 What Happens in CI

The GitHub Actions workflow:

1. **Setup Phase:**
   - Creates temporary keychain
   - Imports Developer ID certificate
   - Sets up Apple API key for notarization

2. **Build Phase:**
   - Builds Tauri app with Rust
   - Signs app with hardened runtime
   - Creates DMG installer
   - Signs DMG

3. **Notarization Phase:**
   - Uploads to Apple for notarization
   - Waits for approval
   - Staples notarization ticket to DMG

4. **Verification Phase:**
   - Verifies code signature
   - Tests Gatekeeper acceptance
   - Validates notarization ticket

5. **Cleanup Phase:**
   - Removes temporary keychain
   - Deletes API key file
   - Cleans up certificates

## 📋 Next Steps

1. **Run setup script**: `./scripts/setup-macos-signing.sh`
2. **Create certificates** following the guide above
3. **Configure GitHub secrets** using the configuration script
4. **Create test release**: `git tag v1.0.1 && git push origin v1.0.1`
5. **Download and verify** the signed DMG

## 🎉 Success Indicators

When everything works correctly, you'll see:

- ✅ **Signed app**: `codesign -dv` shows valid signature
- ✅ **Notarized DMG**: `xcrun stapler validate` passes
- ✅ **Gatekeeper approved**: `spctl -a` allows installation
- ✅ **Users can install** without security warnings

Your users will be able to download and install Ottokode without any "unidentified developer" warnings!