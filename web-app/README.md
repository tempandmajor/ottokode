# Ottokode Information Platform

The web-based information platform for Ottokode - manage your account, billing, and access resources while coding happens on the desktop app.

## Overview

Ottokode follows a **desktop-first development** approach:
- **Web Platform**: Authentication, billing, documentation, community, support
- **Desktop App**: AI-assisted coding, file management, terminals, project creation

## Architecture

This web platform serves as an information hub similar to cursor.com or windsurf.com, providing:
- User dashboard with usage analytics
- Subscription and billing management
- Documentation and community access
- Desktop app downloads
- Account settings and preferences

## Platform Features

### Information Platform (Web)
✅ **Authentication** - Login, signup, password reset
✅ **User Dashboard** - Usage analytics and quick actions
✅ **Billing** - Subscription management and payment history
✅ **Documentation** - Guides and API references
✅ **Desktop Downloads** - Platform-specific app downloads
✅ **Community** - Forums and support channels
✅ **Settings** - Account and preference management

### Development Features (Desktop Only)
❌ **Web IDE** - Redirects to desktop download
❌ **Monaco Editor** - Removed from web platform
❌ **File Management** - Desktop app exclusive
❌ **Project Creation** - Desktop app exclusive
❌ **Terminal Access** - Desktop app exclusive

## Development

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e076dc16-92b1-4a27-929c-3e36bde0b725) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
