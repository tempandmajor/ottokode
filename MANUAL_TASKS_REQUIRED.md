# 📋 Manual Tasks Required - Step by Step

## 🚨 **Critical Tasks (Must Complete Before Launch)**

### **TASK 1: Configure Production Environment**

**Priority:** 🔴 **BLOCKING**

**Steps:**
1. Copy the production environment template:
   ```bash
   cp .env.production.example .env.production
   ```

2. Get your Supabase credentials:
   - Go to https://supabase.com/dashboard
   - Select your project (or create one)
   - Go to Settings → API
   - Copy the Project URL and anon public key
   - Update in `.env.production`:
     ```bash
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your_real_anon_key_here
     ```

3. Get Stripe keys (for billing functionality):
   - Go to https://dashboard.stripe.com/
   - Go to Developers → API keys
   - Copy the Publishable key and Secret key
   - Update in `.env.production`:
     ```bash
     VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
     STRIPE_SECRET_KEY=sk_live_...
     ```

4. Generate security secrets:
   ```bash
   # Generate a 32-character JWT secret
   openssl rand -hex 16

   # Generate a 32-character encryption key
   openssl rand -hex 16

   # Add to .env.production:
   JWT_SECRET=your_generated_secret_here
   ENCRYPTION_KEY=your_generated_key_here
   ```

---

### **TASK 2: Setup GitHub Repository for Releases**

**Priority:** 🔴 **BLOCKING** - Desktop downloads won't work without this

**Steps:**
1. Create GitHub repository:
   ```bash
   # Install GitHub CLI if needed
   brew install gh  # macOS
   # or download from https://cli.github.com/

   # Login to GitHub
   gh auth login

   # Create repository
   gh repo create ottokode --public
   ```

2. Push your code:
   ```bash
   git remote add origin https://github.com/yourusername/ottokode.git
   git push -u origin main
   ```

3. Update download URLs in the code:
   - Open `web-app/src/components/download-section.tsx`
   - Replace `tempandmajor/ottokode` with `yourusername/ottokode` on lines 13, 23, and 33

---

### **TASK 3: Create Your First Release**

**Priority:** 🔴 **BLOCKING** - Desktop downloads won't work until you have releases

**Steps:**
1. Build the release:
   ```bash
   npm run release:prepare
   ```

   This will:
   - Clean old builds
   - Build the web app for production
   - Build the desktop app binaries

2. Create GitHub release:
   ```bash
   npm run release:github
   ```

   Or manually upload files:
   - Go to your GitHub repository
   - Click "Create a new release"
   - Tag: `v1.0.0`
   - Upload files from `src-tauri/target/release/bundle/`

---

### **TASK 4: Add AI Provider Keys (Optional but Recommended)**

**Priority:** 🟡 **HIGH** - AI chat will only show mock responses without this

**Steps:**
1. Get OpenAI API key:
   - Go to https://platform.openai.com/api-keys
   - Create new key
   - Add to `.env.production`: `VITE_OPENAI_API_KEY=sk-...`

2. Get Anthropic API key:
   - Go to https://console.anthropic.com/
   - Create new key
   - Add to `.env.production`: `VITE_ANTHROPIC_API_KEY=sk-ant-...`

3. (Optional) Get other provider keys:
   - Google AI: https://makersuite.google.com/app/apikey
   - Cohere: https://dashboard.cohere.ai/api-keys
   - Mistral: https://console.mistral.ai/

---

### **TASK 5: Setup Supabase Database**

**Priority:** 🟡 **HIGH** - User profiles won't work without this

**Steps:**
1. Go to your Supabase project dashboard
2. Go to SQL Editor
3. Run this SQL to create the users table:
   ```sql
   create table users (
     id uuid references auth.users on delete cascade primary key,
     email text not null,
     name text,
     color text,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     updated_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   alter table users enable row level security;

   create policy "Users can view own profile"
     on users for select using (auth.uid() = id);

   create policy "Users can update own profile"
     on users for update using (auth.uid() = id);
   ```

---

### **TASK 6: Deploy Web Application**

**Priority:** 🟡 **MEDIUM** - Choose one deployment method

**Option A: Vercel (Easiest)**
```bash
npm install -g vercel
cd web-app
vercel --prod
```

**Option B: Netlify**
1. Go to https://netlify.com/
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set publish directory: `out`

**Option C: Your Own Server**
```bash
cd web-app
npm run build:production
# Upload the 'out' folder to your web server
```

---

## 🧪 **Testing Your Deployment**

After completing the above tasks, test:

1. **Web App Test:**
   - Visit your deployed web app
   - Try to register/login
   - Test the IDE features
   - Check that AI chat works

2. **Desktop App Test:**
   - Go to your website
   - Try downloading the desktop app
   - Install and run it
   - Test that it connects to your web services

---

## 🆘 **If You Get Stuck**

**Common Issues:**

1. **"No releases found" error:**
   - Make sure you completed Task 3 (GitHub releases)
   - Check that release files uploaded correctly

2. **Authentication not working:**
   - Verify Supabase URL and keys in `.env.production`
   - Make sure you completed Task 5 (database setup)

3. **AI chat not working:**
   - Check console for API key errors
   - Verify Task 4 (AI provider keys)
   - App will work with mock responses if no keys provided

4. **Desktop app won't connect:**
   - Make sure web app is deployed (Task 6)
   - Check that domain matches in `.env.production`

**Getting Help:**
- Check browser console for detailed error messages
- Look at Supabase dashboard logs
- Verify all environment variables are set correctly

---

## ✅ **Success Checklist**

Once everything is working, you should have:

- [ ] Web app deployed and accessible
- [ ] Desktop app downloadable from your website
- [ ] Users can register and login
- [ ] AI chat responds (real AI or mock)
- [ ] IDE features work (editor, file explorer)
- [ ] No console errors in browser

**Your Ottokode IDE is ready for users! 🎉**