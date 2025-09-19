# How to Change the Desktop App Logo

## 📁 Icon Files Location

The desktop app icons are located in:
```
/Users/emmanuelakangbou/ai-ide/src-tauri/icons/
```

## 🎨 Required Icon Formats

To change the logo, you need to replace these files with your new logo:

### **Required Files:**
```
src-tauri/icons/
├── 32x32.png          # Small icon (32x32 pixels)
├── 128x128.png        # Medium icon (128x128 pixels)
├── 128x128@2x.png     # High-DPI medium icon (256x256 pixels)
├── icon.icns          # macOS app bundle icon
├── icon.ico           # Windows executable icon
└── icon.png           # Source icon (recommended 512x512 or larger)
```

### **Windows Store Icons (optional):**
```
├── Square107x107Logo.png
├── Square142x142Logo.png
├── Square150x150Logo.png
├── Square284x284Logo.png
├── Square30x30Logo.png
├── Square310x310Logo.png
├── Square44x44Logo.png
├── Square71x71Logo.png
├── Square89x89Logo.png
└── StoreLogo.png
```

## 🛠️ Step-by-Step Instructions

### **Option 1: Replace Existing Files (Quick)**

1. **Prepare your logo:**
   - Create a high-resolution version (at least 512x512 pixels)
   - Use PNG format with transparent background
   - Make sure it looks good at small sizes

2. **Generate all required sizes:**
   ```bash
   # Install imagemagick if you don't have it
   brew install imagemagick

   # Navigate to icons directory
   cd /Users/emmanuelakangbou/ai-ide/src-tauri/icons/

   # Replace 'your-logo.png' with your logo file
   # Generate PNG icons
   convert your-logo.png -resize 32x32 32x32.png
   convert your-logo.png -resize 128x128 128x128.png
   convert your-logo.png -resize 256x256 128x128@2x.png
   convert your-logo.png -resize 512x512 icon.png

   # Generate macOS .icns file
   mkdir icon.iconset
   convert your-logo.png -resize 16x16 icon.iconset/icon_16x16.png
   convert your-logo.png -resize 32x32 icon.iconset/icon_16x16@2x.png
   convert your-logo.png -resize 32x32 icon.iconset/icon_32x32.png
   convert your-logo.png -resize 64x64 icon.iconset/icon_32x32@2x.png
   convert your-logo.png -resize 128x128 icon.iconset/icon_128x128.png
   convert your-logo.png -resize 256x256 icon.iconset/icon_128x128@2x.png
   convert your-logo.png -resize 256x256 icon.iconset/icon_256x256.png
   convert your-logo.png -resize 512x512 icon.iconset/icon_256x256@2x.png
   convert your-logo.png -resize 512x512 icon.iconset/icon_512x512.png
   convert your-logo.png -resize 1024x1024 icon.iconset/icon_512x512@2x.png
   iconutil -c icns icon.iconset
   rm -rf icon.iconset

   # Generate Windows .ico file (requires png2ico or similar)
   # Alternative: use online converter or graphic design software
   ```

### **Option 2: Use Tauri Icon Generator (Recommended)**

1. **Install tauri-cli if not already installed:**
   ```bash
   npm install -g @tauri-apps/cli
   ```

2. **Generate icons from a source image:**
   ```bash
   cd /Users/emmanuelakangbou/ai-ide

   # Replace 'path/to/your-logo.png' with your logo file
   # The source image should be at least 512x512 pixels
   tauri icon path/to/your-logo.png
   ```

   This command will automatically:
   - Generate all required PNG sizes
   - Create the .icns file for macOS
   - Create the .ico file for Windows
   - Place them in the correct `src-tauri/icons/` directory

### **Option 3: Manual Replacement**

1. **Create your icons manually using design software:**
   - Use tools like Photoshop, GIMP, Sketch, or Figma
   - Export the required sizes listed above
   - Save with transparent backgrounds (PNG format)

2. **Replace the files:**
   ```bash
   cd /Users/emmanuelakangbou/ai-ide/src-tauri/icons/

   # Back up existing icons (optional)
   mkdir backup
   cp *.png *.icns *.ico backup/

   # Copy your new icons
   cp /path/to/your/icons/* .
   ```

## ⚙️ Configuration

The icon configuration is in `src-tauri/tauri.conf.json`:

```json
{
  "bundle": {
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

You typically don't need to modify this unless you're adding custom icon paths.

## 🔄 Apply Changes

After replacing the icon files:

1. **Clean previous builds:**
   ```bash
   cd /Users/emmanuelakangbou/ai-ide
   npm run clean
   ```

2. **Rebuild the desktop app:**
   ```bash
   npm run tauri:build
   ```

3. **Test with development mode:**
   ```bash
   npm run tauri:dev
   ```

## 📱 Icon Guidelines

### **Design Best Practices:**
- **Size**: Start with at least 1024x1024 pixels
- **Format**: PNG with transparent background
- **Style**: Simple, recognizable at small sizes
- **Colors**: High contrast, works on both light and dark backgrounds
- **Shape**: Square with rounded corners (macOS will automatically apply corner radius)

### **Platform-Specific Notes:**
- **macOS**: Uses .icns format, automatically applies rounded corners
- **Windows**: Uses .ico format, supports multiple sizes in one file
- **Linux**: Uses PNG format

## 🎯 Quick Test

To quickly test your new icon:

```bash
# Build and launch desktop app
cd /Users/emmanuelakangbou/ai-ide
npm run tauri:build
open src-tauri/target/release/bundle/macos/Ottokode.app
```

Your new logo should appear in:
- Dock (when app is running)
- Applications folder
- App switcher (Cmd+Tab)
- Title bar (if configured)

## 🔧 Troubleshooting

**Icon not updating:**
- Clear icon cache: `sudo rm -rf /Library/Caches/com.apple.iconservices.store`
- Restart Finder: `killall Finder`
- Rebuild the app completely

**Wrong sizes:**
- Ensure you have all required dimensions
- Check that files aren't corrupted
- Verify transparent backgrounds

**File format issues:**
- Use PNG for individual icons
- Use .icns for macOS bundle
- Use .ico for Windows executable

The new logo will be applied to all desktop app instances after rebuilding!