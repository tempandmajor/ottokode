# Information Architecture - Ottokode Platform

## Overview
This document maps out the complete Information Architecture (IA) for the Ottokode AI-powered IDE platform, including page structures, user flows, navigation hierarchies, and content organization.

## Sitemap

### Public Pages (Unauthenticated)
```
ottokode.ai/
├── / (Home/Landing Page)
├── /about
├── /pricing
├── /docs
├── /getting-started
├── /help
├── /support
├── /community
├── /extensions
├── /changelog
├── /desktop (Desktop app download)
├── /login (Authentication)
├── /terms
├── /privacy
└── /user-agreement
```

### Authenticated User Pages
```
ottokode.ai/
├── /ide (Main IDE Interface)
├── /settings/
│   ├── /profile
│   ├── /ai
│   ├── /billing
│   ├── /notifications
│   └── /security
└── /admin/
    └── /indexing (Admin only)
```

## User Flows

### 1. New User Onboarding Flow
```
Landing Page → Sign Up → Email Verification →
First Login → Project Start Dialog →
Choose: New File | Clone Repository | Recent →
Template Selection (if New File) → IDE Interface
```

### 2. Returning User Flow
```
Login → IDE Interface (auto-loads recent project) OR
Login → Project Start Dialog (if no recent projects)
```

### 3. Project Creation Flow
```
IDE → New Project Button → Project Start Dialog →
[Option A] New File → Template Selection → Template Configuration → Project Created
[Option B] Clone Repository → Git URL Input → Repository Cloned
[Option C] Recent Projects → Select Project → Project Loaded
```

### 4. Template Selection Flow (New)
```
Project Start → New File → Template Selection Dialog →
Filter by: Category | Difficulty | Technology | Sort →
Select Template → Template Configuration → Project Created
```

## Navigation Hierarchy

### Primary Navigation
1. **IDE Interface** (Main workspace)
2. **Project Management** (File explorer, project switching)
3. **AI Chat** (Right panel)
4. **User Menu** (Settings, logout)

### Secondary Navigation
#### Settings Pages
- Profile Management
- AI Configuration
- Billing & Subscriptions
- Notifications
- Security & Privacy

#### Public Information
- Documentation
- Help & Support
- Community
- Extensions Marketplace

## Component Architecture

### Core IDE Components
```
IDE Page (/ide)
├── Header
│   ├── Logo & Branding
│   ├── Project Selector
│   ├── New Project Button
│   └── User Menu
├── Left Panel (Resizable)
│   ├── File Explorer Tab
│   └── Terminal Tab
├── Main Editor Area
│   ├── File Tabs
│   ├── Monaco Editor
│   └── Status Bar
├── Right Panel (Resizable)
│   └── AI Chat
└── Dialogs
    ├── Project Start Dialog
    ├── Template Selection Dialog
    └── Template Configuration Dialog
```

### Dialog Flows
```
Project Start Dialog
├── New File Card → Template Selection
├── Clone Repository Card → Git URL Input
└── Recent Projects Card → Project List

Template Selection Dialog
├── Search Bar
├── Filter Controls (4 dropdowns)
│   ├── Category Filter
│   ├── Difficulty Filter
│   ├── Technology Filter
│   └── Sort Options
├── Results Count & Clear Filters
└── Template Grid
```

## Content Organization

### Template Categories
- **Web Development**: React, Vue, Angular, HTML/CSS
- **Backend**: Node.js, Python, Java, PHP
- **Mobile**: React Native, Flutter, Ionic
- **Desktop**: Electron, Tauri, Qt
- **Data Science**: Jupyter, Python Analytics
- **Machine Learning**: TensorFlow, PyTorch
- **DevOps**: Docker, Kubernetes configs
- **Blockchain**: Smart contracts, DApps

### Filter Dimensions
1. **Category**: Functional grouping of templates
2. **Difficulty**: Beginner, Intermediate, Advanced
3. **Technology**: Programming languages and frameworks
4. **Sort Options**: Popular, Name, Difficulty, Setup Time

## User Experience Improvements

### Template Selection Enhancements
✅ **Fixed Issues:**
- Removed overlapping text in category tabs
- Replaced cramped tab layout with organized dropdowns
- Added comprehensive filtering system
- Improved visual hierarchy and spacing
- Added clear filters functionality
- Better responsive design

### Project Start Flow Improvements
✅ **Enhanced Flow:**
- Template selection now nested under "New File"
- Primary options clearly presented: New File, Clone Git, Recent
- Better visual organization with card-based layout
- Recent projects easily accessible

## Information Scent & Findability

### Primary Actions (High Frequency)
1. **Create New Project** - Prominent in header
2. **Open Recent Project** - Available in project start dialog
3. **File Management** - Left panel file explorer
4. **AI Assistance** - Right panel chat

### Secondary Actions (Medium Frequency)
1. **Settings Configuration** - User menu
2. **Project Switching** - Project selector dropdown
3. **Template Browsing** - Organized filter system
4. **Git Operations** - Clone repository option

### Tertiary Actions (Low Frequency)
1. **Account Management** - Settings pages
2. **Help & Documentation** - Public pages
3. **Community Features** - Community page
4. **Extensions** - Extensions marketplace

## Mobile & Responsive Considerations

### Mobile Navigation
- Collapsible left/right panels
- Touch-friendly buttons and controls
- Responsive dropdown filters
- Simplified template grid layout

### Tablet Experience
- Optimized panel widths
- Better use of screen real estate
- Gesture-friendly interactions

## Accessibility & Usability

### Navigation Patterns
- Consistent header navigation
- Breadcrumbs where appropriate
- Clear visual hierarchy
- Keyboard navigation support

### Content Discovery
- Powerful search and filtering
- Category-based organization
- Visual cues and icons
- Progressive disclosure

## Future IA Considerations

### Potential Additions
- Project collaboration features
- Advanced file organization
- Plugin marketplace integration
- Team workspace management
- Version control integration
- Cloud project storage

### Scalability
- Modular component architecture
- Flexible navigation system
- Extensible filter categories
- Dynamic content loading

---

**Last Updated**: December 2024
**Version**: 1.0
**Maintained By**: Development Team