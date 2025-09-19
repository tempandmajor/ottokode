# 📋 Manual Tasks Guide for Ottokode Desktop Release

This guide covers all the manual setup tasks required to complete your desktop app deployment pipeline. Follow these steps in order to get your GitHub Actions working and enable automatic code signing.

## 🎯 Overview of What You Need to Do

1. **Apple Developer Setup** (for macOS signing)
2. **GitHub Repository Configuration**
3. **GitHub Secrets Configuration**
4. **Testing & Verification**

---

## 1. 🍎 Apple Developer Setup (macOS Code Signing)

### Prerequisites
- Apple Developer Program membership ($99/year)
- Xcode installed on your Mac
- Your Team ID: **KDJ28YA9Z7** (based on your existing certificates)

### Step 1.1: Create Developer ID Application Certificate

**Using Xcode (Recommended):**

1. Open **Xcode**
2. Go to **Xcode** → **Settings** (or **Preferences** in older versions) → **Accounts**
3. Select your Apple Developer account
4. Click **Manage Certificates...**
5. Click the **+** button → **Developer ID Application**
6. The certificate will be created and installed automatically

**Alternative - Using Apple Developer Website:**

1. Go to [developer.apple.com/certificates](https://developer.apple.com/account/resources/certificates/list)
2. Click **+** to create a new certificate
3. Select **Developer ID Application**
4. Follow the prompts to create and download the certificate

### Step 1.2: Export Certificate as .p12 File

1. Open **Keychain Access** application
2. Find **"Developer ID Application: Your Name (KDJ28YA9Z7)"** in the certificates
3. Right-click the certificate → **Export "Developer ID Application..."**
4. Choose file format: **Personal Information Exchange (.p12)**
5. Save to `~/Desktop/DeveloperIDApp.p12`
6. **Set a strong password** and remember it! You'll need this for GitHub secrets

### Step 1.3: Create App Store Connect API Key

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **Users and Access** → **Keys**
3. Click the **+** button
4. Enter:
   - **Name**: "Ottokode CI/CD"
   - **Role**: **Admin** or **App Manager**
5. Click **Generate**
6. **Important**: Save these values immediately:
   - **Key ID** (e.g., `ABCDEFGHIJ`)
   - **Issuer ID** (UUID format like `12345678-1234-1234-1234-123456789012`)
7. **Download** the `.p8` file to `~/Desktop/AuthKey_XXXXXXXXXX.p8`

---

## 2. 🔧 GitHub Repository Configuration

### Step 2.1: Verify Repository Setup

```bash
# Check your current remote
git remote -v

# You should see something like:
# origin  https://github.com/tempandmajor/ottokode.git

# If not set correctly, add the remote:
git remote add origin https://github.com/tempandmajor/ottokode.git

# Push your latest changes
git add .
git commit -m "Prepare for GitHub Actions setup"
git push -u origin main
```

### Step 2.2: Enable GitHub Actions

1. Go to your repository: https://github.com/tempandmajor/ottokode
2. Click **Settings** tab
3. Click **Actions** → **General** in the left sidebar
4. Under **Actions permissions**, select **Allow all actions and reusable workflows**
5. Click **Save**

---

## 3. 🔐 GitHub Secrets Configuration

### Step 3.1: Convert Certificates to Base64

Run these commands in Terminal:

```bash
# Convert .p12 certificate to base64
base64 -i ~/Desktop/DeveloperIDApp.p12 | pbcopy
# The base64 string is now in your clipboard
```

```bash
# Convert API key to proper format
cat ~/Desktop/AuthKey_XXXXXXXXXX.p8 | pbcopy
# The API key content is now in your clipboard
```

### Step 3.2: Add GitHub Secrets

1. Go to: https://github.com/tempandmajor/ottokode/settings/secrets/actions
2. Click **New repository secret** for each of these:

#### Required macOS Secrets:

| Secret Name | Value | Where to Get It |
|-------------|-------|-----------------|
| `MAC_CERT_P12` | Base64 encoded .p12 file | Output from `base64 -i ~/Desktop/DeveloperIDApp.p12` |
| `MAC_CERT_PASSWORD` | Password you set for .p12 | The password you created when exporting the certificate |
| `APPLE_API_KEY` | Contents of .p8 file | Output from `cat ~/Desktop/AuthKey_XXXXXXXXXX.p8` |
| `APPLE_API_KEY_ID` | Key ID from App Store Connect | The 10-character Key ID (e.g., `ABCDEFGHIJ`) |
| `APPLE_API_ISSUER_ID` | Issuer ID from App Store Connect | The UUID from App Store Connect API |
| `APPLE_TEAM_ID` | Your Apple Developer Team ID | `KDJ28YA9Z7` (from your existing certificates) |

**Steps to add each secret:**
1. Click **New repository secret**
2. Enter the **Name** (e.g., `MAC_CERT_P12`)
3. Paste the **Value**
4. Click **Add secret**
5. Repeat for all 6 secrets

#### Optional - Windows Code Signing (if you plan to support Windows):

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `WIN_CERT_PFX` | Base64 encoded .pfx certificate | Windows code signing certificate |
| `WIN_CERT_PASSWORD` | Password for .pfx certificate | Certificate password |

#### Optional - Tauri Auto-updater:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `TAURI_PRIVATE_KEY` | Tauri updater private key | For app auto-updates |
| `TAURI_KEY_PASSWORD` | Password for Tauri key | Key protection password |

---

## 4. 🧪 Testing & Verification

### Step 4.1: Test Local Signing (Optional but Recommended)

Before pushing to GitHub, test that signing works locally:

```bash
# Build the app locally
npm run tauri:build

# Check if the app was signed
find src-tauri/target -name "*.app" -exec codesign -dv {} \;

# Test with Gatekeeper
find src-tauri/target -name "*.app" -exec spctl -a -vv {} \;
```

### Step 4.2: Create Your First Release

1. **Create a git tag:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Watch GitHub Actions:**
   - Go to: https://github.com/tempandmajor/ottokode/actions
   - You should see a new workflow run for "Release Desktop App"
   - Click on it to monitor progress

3. **Expected workflow steps:**
   - ✅ Checkout repository
   - ✅ Setup Node.js and Rust
   - ✅ macOS codesign setup (importing your certificate)
   - ✅ Build the desktop app
   - ✅ Code signing (with your Developer ID)
   - ✅ Notarization (submitting to Apple)
   - ✅ Stapling (attaching notarization ticket)
   - ✅ Creating GitHub release

### Step 4.3: Verify the Release

1. **Check the release page:**
   https://github.com/tempandmajor/ottokode/releases

2. **Download and test the .dmg file:**
   ```bash
   # Download the DMG (replace with actual filename)
   curl -L -o ~/Downloads/Ottokode.dmg https://github.com/tempandmajor/ottokode/releases/latest/download/Ottokode.dmg

   # Verify the signature
   codesign -dv --verbose=4 ~/Downloads/Ottokode.dmg

   # Test notarization
   xcrun stapler validate ~/Downloads/Ottokode.dmg

   # Test Gatekeeper
   spctl -a -vv -t install ~/Downloads/Ottokode.dmg
   ```

3. **Install and run the app:**
   - Double-click the DMG
   - Drag the app to Applications
   - Launch it - should open without security warnings

---

## 5. 🔍 Troubleshooting Common Issues

### Issue: "No Developer ID Application certificate found"

**Solution:**
1. Make sure you created the certificate in step 1.1
2. Check it exists: `security find-identity -v -p codesigning`
3. You should see: `"Developer ID Application: Your Name (KDJ28YA9Z7)"`

### Issue: "Failed to import certificate in GitHub Actions"

**Solution:**
1. Verify the `MAC_CERT_P12` secret contains the correct base64 string
2. Verify the `MAC_CERT_PASSWORD` matches what you set when exporting
3. Check the GitHub Actions logs for specific error messages

### Issue: "Notarization failed"

**Solution:**
1. Verify your `APPLE_API_KEY_ID` and `APPLE_API_ISSUER_ID` are correct
2. Make sure the API key has **Admin** or **App Manager** role
3. Verify `APPLE_TEAM_ID` matches your certificate (`KDJ28YA9Z7`)

### Issue: "App won't open - 'damaged or incomplete'"

**Solution:**
1. The app signature is invalid
2. Check that hardened runtime is enabled in `tauri.conf.json`
3. Verify notarization completed successfully

### Issue: GitHub Actions workflow doesn't trigger

**Solution:**
1. Make sure you pushed the tag: `git push origin v1.0.0`
2. Check that GitHub Actions are enabled in repository settings
3. Verify the workflow file is in `.github/workflows/release-desktop.yml`

---

## 6. 🎉 Success Checklist

When everything is working correctly, you should have:

- [ ] ✅ Developer ID Application certificate installed
- [ ] ✅ All 6 GitHub secrets configured correctly
- [ ] ✅ GitHub Actions workflow runs without errors
- [ ] ✅ Signed .dmg file in GitHub releases
- [ ] ✅ App installs and runs without security warnings
- [ ] ✅ `codesign -dv` shows valid signature
- [ ] ✅ `xcrun stapler validate` passes
- [ ] ✅ `spctl -a` allows installation

---

## 7. 🔄 For Future Releases

Once everything is set up, creating new releases is easy:

```bash
# Update version in package.json, then:
git add .
git commit -m "Bump version to v1.0.1"
git tag v1.0.1
git push origin v1.0.1
```

The GitHub Actions will automatically:
1. Build the app
2. Sign it with your certificate
3. Submit to Apple for notarization
4. Create a GitHub release with the signed binaries

---

## 📞 Need Help?

If you run into issues:

1. **Check GitHub Actions logs** for specific error messages
2. **Run the setup script**: `./scripts/setup-macos-signing.sh` for guided help
3. **Test locally first** before pushing to GitHub
4. **Verify all secrets** are entered correctly (no extra spaces/characters)

Your desktop app deployment will be fully automated once these manual steps are complete! 🚀