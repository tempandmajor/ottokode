# 🚀 GitHub Release Setup for tempandmajor/ottokode

## ✅ **What I've Already Updated**

1. **Download URLs Updated** - All download links now point to `tempandmajor/ottokode`
2. **Release Script Updated** - `npm run release:github` now targets your repository
3. **Repository Configuration** - Everything is configured for your GitHub repo

## 🔧 **What You Need to Do**

### **Step 1: Verify Repository Access**

Make sure you have the GitHub repository set up:

```bash
# Check if you're already connected to the repo
git remote -v

# If you see tempandmajor/ottokode, you're good!
# If not, add it:
git remote add origin https://github.com/tempandmajor/ottokode.git

# Push your latest changes
git add .
git commit -m "Update configuration for GitHub releases"
git push -u origin main
```

### **Step 2: Install and Setup GitHub CLI**

```bash
# Install GitHub CLI (if not already installed)
# macOS:
brew install gh

# Windows (with Chocolatey):
choco install gh

# Or download from: https://cli.github.com/

# Login to GitHub
gh auth login
# Follow prompts to authenticate with your account
```

### **Step 3: Build Desktop App Binaries**

```bash
# From your project root directory
npm run release:prepare
```

This will:
- Clean old builds
- Build the web app for Tauri
- Compile desktop app binaries for your platform

**Expected Output:**
```
✓ Built web app
✓ Compiling desktop app...
✓ Bundle created at src-tauri/target/release/bundle/
```

### **Step 4: Create GitHub Release (Automated)**

```bash
# This creates the release and uploads all files automatically
npm run release:github
```

**What this does:**
1. Creates a new GitHub release with tag `v1.0.0`
2. Uploads all built binaries (`.dmg`, `.msi`, `.AppImage`)
3. Sets title: "Ottokode v1.0.0"
4. Adds description: "🎉 Ottokode v1.0.0 - AI-powered IDE for modern development"

### **Step 5: Verify Release was Created**

1. **Go to your GitHub repository:**
   https://github.com/tempandmajor/ottokode

2. **Click "Releases"** (should show 1 release)

3. **Verify download links work:**
   - Windows: https://github.com/tempandmajor/ottokode/releases/latest/download/ottokode-windows-x64.exe
   - macOS: https://github.com/tempandmajor/ottokode/releases/latest/download/ottokode-macos-universal.dmg
   - Linux: https://github.com/tempandmajor/ottokode/releases/latest/download/ottokode-linux-x64.AppImage

### **Step 6: Test Download Flow**

1. **Build and test web app:**
   ```bash
   cd web-app
   NODE_ENV=production npm run build
   npm run start
   ```

2. **Visit http://localhost:3001**
3. **Go to download section**
4. **Verify buttons show real download links** (not "Coming Soon")

## 🔍 **Expected File Locations**

After building, you should see these files:

**macOS:**
```
src-tauri/target/release/bundle/dmg/Ottokode_1.0.0_x64.dmg
```

**Windows (if building on Windows):**
```
src-tauri/target/release/bundle/msi/Ottokode_1.0.0_x64_en-US.msi
```

**Linux (if building on Linux):**
```
src-tauri/target/release/bundle/appimage/ottokode_1.0.0_amd64.AppImage
```

## 🚨 **Troubleshooting**

**Error: "gh: command not found"**
- Install GitHub CLI: https://cli.github.com/

**Error: "Permission denied"**
- Run `gh auth login` and authenticate

**Error: "No such file or directory" during build**
- Make sure you're in the project root directory
- Install Rust if needed: https://rustup.rs/

**Error: Release already exists**
- Delete the existing release on GitHub, or
- Update the version in `package.json` to create v1.0.1

**Download links return 404**
- Make sure the release was created successfully
- Check that file names match exactly (case-sensitive)

## 🎯 **What Happens After Release**

Once you complete these steps:

1. **Your website download buttons will work** - Users can download desktop apps
2. **GitHub hosts your binaries** - No need for separate file hosting
3. **Automatic updates possible** - You can create new releases easily
4. **Professional distribution** - Users get signed downloads from GitHub

## 🔄 **For Future Releases**

To create new releases:

1. Update version in `package.json`
2. Run `npm run release:prepare`
3. Run `npm run release:github`

That's it! Your desktop download system is ready to go. 🚀