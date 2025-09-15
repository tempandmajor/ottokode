# 🚀 Branchcode AI - Production Deployment Guide

## 📋 Overview

This guide covers deploying both the **desktop application** (Tauri) and **web application** (Next.js) to production environments with automated CI/CD pipelines.

## 🌐 Web App Deployment (Vercel)

### Prerequisites
- GitHub repository connected to Vercel
- Supabase project set up
- Vercel account with team/pro plan (recommended)

### Step 1: Vercel Setup

1. **Import Project to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login to Vercel
   vercel login

   # Import project (run from web-app directory)
   cd web-app
   vercel
   ```

2. **Configure Build Settings**
   - **Framework Preset**: Next.js
   - **Root Directory**: `web-app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm ci`

### Step 2: Environment Variables (Vercel Dashboard)

Configure these in Vercel Dashboard > Project > Settings > Environment Variables:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_ENV=production

# Optional: AI Provider Keys
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id

# Support
NEXT_PUBLIC_SUPPORT_EMAIL=support@branchcode.ai
```

### Step 3: Domain Configuration

1. **Custom Domain** (Optional)
   - Add custom domain in Vercel Dashboard
   - Configure DNS records
   - Enable automatic HTTPS

2. **Supabase Configuration**
   - Add your Vercel domain to Supabase Auth settings
   - Update site URL and redirect URLs

## 🖥️ Desktop App Distribution

### GitHub Releases (Automated)

The desktop app uses GitHub Actions for automated builds and releases.

### Step 1: Repository Secrets

Add these secrets in GitHub Repository > Settings > Secrets:

```env
# Tauri Code Signing (Optional but Recommended)
TAURI_PRIVATE_KEY=your_private_key_here
TAURI_KEY_PASSWORD=your_key_password

# For macOS notarization (if distributing to Mac App Store)
APPLE_CERTIFICATE=your_apple_certificate
APPLE_CERTIFICATE_PASSWORD=your_certificate_password
APPLE_SIGNING_IDENTITY=your_signing_identity
APPLE_ID=your_apple_id
APPLE_PASSWORD=your_app_specific_password

# For Windows code signing
WINDOWS_CERTIFICATE=your_windows_certificate
WINDOWS_CERTIFICATE_PASSWORD=your_certificate_password
```

### Step 2: Create Release

1. **Tag-based Release**
   ```bash
   # Create and push a tag
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Manual Release**
   - Go to GitHub Actions
   - Run "Release Desktop App" workflow
   - Enter version number (e.g., v1.0.0)

## 🔄 Automated CI/CD Pipeline

### Web App Pipeline

**Triggers:**
- Push to `main` → Production deployment
- Push to `develop` → Preview deployment
- Pull Requests → Preview deployment

**Process:**
1. Lint & type checking
2. Build verification
3. Automated deployment to Vercel
4. Preview URL generation

### Desktop App Pipeline

**Triggers:**
- Git tags (v*) → Release build
- Manual workflow dispatch

**Process:**
1. Multi-platform builds (Windows, macOS, Linux)
2. Code signing (if configured)
3. GitHub Releases creation
4. Artifact upload

## 🚀 Quick Deployment Commands

### Web App to Vercel
```bash
# From web-app directory
cd web-app

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Desktop App Release
```bash
# Create and push a release tag
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will automatically build and release
```

## 📊 Production Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Supabase database ready
- [ ] Domain configuration complete
- [ ] SSL certificates active
- [ ] Analytics tracking implemented

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Authentication working
- [ ] AI integrations functional
- [ ] File operations working
- [ ] Performance metrics baseline

---

**🎉 Your Branchcode AI is production-ready!**

**Web App**: Ready for Vercel deployment
**Desktop App**: Ready for automated releases
**GitHub Repository**: https://github.com/tempandmajor/ottokode