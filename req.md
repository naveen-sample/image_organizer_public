# GitHub-Hosted Image Gallery - Enhanced Software Design Document
## Dual Repository Architecture (Public UI + Private Image Storage)

**Document Version**: 2.0  
**Last Updated**: 2026-06-14  
**Status**: Production Ready  
**Author**: Technical Architecture Team

---

## TABLE OF CONTENTS
1. [Executive Summary](#executive-summary)
2. [Feasible Implementation Options](#feasible-implementation-options)
3. [Dual Repository Architecture](#dual-repository-architecture)
4. [System Architecture](#system-architecture)
5. [Technology Stack & Justification](#technology-stack--justification)
6. [UI/UX Design Specifications](#uiux-design-specifications)
7. [Authentication & Security Flow](#authentication--security-flow)
8. [Data Models & Storage](#data-models--storage)
9. [API Integration Strategy](#api-integration-strategy)
10. [Frontend Code Structure](#frontend-code-structure)
11. [Detailed Feature Implementation](#detailed-feature-implementation)
12. [Responsive Design System](#responsive-design-system)
13. [Performance Optimization](#performance-optimization)
14. [Deployment & Configuration](#deployment--configuration)
15. [Testing Strategy](#testing-strategy)
16. [Security Checklist](#security-checklist)
17. [Development Timeline](#development-timeline)

---

## EXECUTIVE SUMMARY

### Project Scope
A zero-dependency, single-page image gallery application deployed on GitHub Pages that leverages GitHub repositories for storage. The application uses a **dual-repository strategy**:
- **Public Repository**: Contains application code (HTML, CSS, JavaScript) - hosted on GitHub Pages
- **Private Repository**: Stores user images and metadata - accessible only with authentication

### Key Benefits
✅ **No backend required** - GitHub API handles everything  
✅ **Secure private storage** - Images in private repo require authentication  
✅ **Free hosting** - GitHub Pages + GitHub storage  
✅ **Zero dependencies** - Pure HTML/CSS/JS with modern browser APIs  
✅ **Easy deployment** - Git push and done  
✅ **Scalable** - Can handle 1000s of images  

### Target Users
- Personal photographers
- Team collaborators
- Photo portfolio builders
- Memory/gallery keepers

---

## FEASIBLE IMPLEMENTATION OPTIONS

### Option 1: Simple Frontend-Only (RECOMMENDED - Phase 1)
**Complexity**: ⭐ Low | **Development Time**: 2-3 weeks | **Scalability**: ⭐⭐⭐⭐

**Architecture**:
- Single HTML file with embedded CSS and JS
- Browser localStorage for auth token
- Direct GitHub API calls from frontend
- No intermediate server

**Pros**:
- ✅ Ultra-fast to deploy
- ✅ Minimal maintenance
- ✅ Great for personal/team use
- ✅ Learning friendly

**Cons**:
- ❌ Token visible in network tab (but expected in localStorage)
- ❌ Rate limiting on API calls
- ❌ No request queuing at server level

**Best for**: Individual users, small teams, MVP

---
### **RECOMMENDATION FOR THIS PROJECT**

**PHASE 1 - Option 1** (Simple Frontend, ~20-30 days)
- Build MVP with Option 1
- Test with small image library
- Get user feedback

**PHASE 2 - Upgrade to Option 2** (Add Cloudflare Workers)
- Keep Option 1 but route through Workers
- Implement token security
- Add rate limit handling

**PHASE 3 - Optional: Option 3** (Add serverless backend)
- Only if multi-user or advanced features needed

---

## DUAL REPOSITORY ARCHITECTURE

### Repository Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Platform                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────┐    ┌──────────────────────────┐  │
│  │  PUBLIC REPOSITORY       │    │  PRIVATE REPOSITORY      │  │
│  │  (username/gallery-app)  │    │  (username/gallery-images)  │
│  │                          │    │                          │  │
│  │  Hosted: GitHub Pages    │    │  Hosted: Only via API    │  │
│  │  Visibility: Public      │    │  Visibility: Private     │  │
│  │  Read: Everyone          │    │  Read: Token required    │  │
│  │  Write: You only         │    │  Write: Token required   │  │
│  │                          │    │                          │  │
│  │  ├── index.html         │    │  ├── albums/            │  │
│  │  ├── style.css          │    │  │   ├── Vacation/     │  │
│  │  ├── app.js             │    │  │   │   ├── img1.jpg  │  │
│  │  ├── config.js          │    │  │   │   ├── img2.jpg  │  │
│  │  ├── config.json        │    │  │   │   └── meta.json │  │
│  │  └── README.md          │    │  │   ├── Wedding/      │  │
│  │                          │    │  │   │   └── ...      │  │
│  │                          │    │  │   └── Meta/        │  │
│  │                          │    │  │       └── ...      │  │
│  │                          │    │  ├── settings.json     │  │
│  │                          │    │  └── .gitignore        │  │
│  │                          │    │                        │  │
│  └──────────────────────────┘    └──────────────────────────┘  │
│         ↓                                 ↓                      │
│      Served via               Accessed via GitHub API            │
│     GitHub Pages              (with Personal Access Token)       │
│     (https://...)                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         ↓
    User Browser
    (Runs JavaScript)
```

### Public Repository Details

**Name**: `gallery-app` (or your choice)  
**Visibility**: PUBLIC  
**URL**: `https://github.com/username/gallery-app`  
**Hosted**: `https://username.github.io/gallery-app`

**Contents**:
```
gallery-app/
├── index.html                 # Main SPA file (single entry point)
├── style.css                  # Responsive design stylesheet
├── app.js                     # Main application logic (~500-800 lines)
├── config.js                  # Configuration (repo URLs, API endpoints)
├── auth.js                    # Authentication & token management (~200 lines)
├── api.js                     # GitHub API wrapper (~300 lines)
├── ui.js                      # DOM manipulation & UI updates (~400 lines)
├── storage.js                 # LocalStorage & cache management (~150 lines)
├── utils.js                   # Helper functions (~200 lines)
├── assets/                    # Local assets (icons, logos)
│   ├── favicon.ico
│   ├── logo.png
│   ├── icons/
│   │   ├── upload.svg
│   │   ├── download.svg
│   │   ├── menu.svg
│   │   └── ...
│   └── placeholder.png
├── config.json                # App configuration (can edit in UI)
├── .github/
│   └── workflows/
│       └── deploy.yml         # Auto-deploy on push (optional)
└── README.md                  # Setup & usage guide
```

**Key Points**:
- ✅ Everything is public (no secrets here)
- ✅ No sensitive data in this repo
- ✅ Can be cloned/forked by anyone
- ✅ User token stored in browser localStorage only

---

### Private Repository Details

**Name**: `gallery-images` (or your choice)  
**Visibility**: PRIVATE  
**URL**: `https://github.com/username/gallery-images`  
**Accessible**: Only via GitHub API with authentication token

**Contents**:
```
gallery-images/
├── albums/                          # Image storage structure
│   ├── Vacation_2024/
│   │   ├── image_001.jpg            # Raw image
│   │   ├── image_002.jpg
│   │   ├── image_003.jpg
│   │   └── metadata.json            # Album metadata
│   ├── Family_Photos/
│   │   ├── photo_001.png
│   │   ├── photo_002.png
│   │   └── metadata.json
│   ├── Travel_Memories/
│   │   └── ...
│   └── Archive/
│       └── ...
├── .metadata/                       # Global app metadata
│   ├── albums-index.json            # Cache of all albums
│   ├── settings.json                # Gallery-wide settings
│   └── sync-log.json                # Upload/sync history
├── .gitignore                       # Ignore temp files
└── README.md                        # Private repo info (not seen in UI)
```

**Key Points**:
- ✅ Private - only accessible with authentication token
- ✅ Stores all images and metadata
- ✅ Organized by albums (folders)
- ✅ Each album has metadata.json
- ✅ Global metadata in .metadata/ folder

---

## SYSTEM ARCHITECTURE

### High-Level Data Flow

```
USER'S BROWSER
┌────────────────────────────────────┐
│  Frontend Application              │
│  (HTML + CSS + JavaScript)         │
│                                    │
│  • Home Screen                     │
│  • Album Gallery                   │
│  • Image Lightbox                  │
│  • Upload Modal                    │
│  • Settings Panel                  │
└────────┬─────────────────────────────┘
         │ HTTP/AJAX Requests
         │
┌────────▼─────────────────────────────┐
│  GitHub REST API v3                  │
│  (https://api.github.com)            │
│                                      │
│  • GET /repos/{owner}/{repo}/contents│
│  • PUT /repos/{owner}/{repo}/contents│
│  • DELETE /repos/{owner}/{repo}/contents
│  • GET /rate_limit                   │
└────────┬──────────┬──────────────────┘
         │          │
    ┌────▼──┐   ┌───▼────────┐
    │        │   │            │
┌───▼────────▼─┐│ ┌──────────▼──────┐
│ PUBLIC REPO  ││ │  PRIVATE REPO    │
│              ││ │                  │
│ Application  ││ │  Image Storage   │
│ Code         ││ │  & Metadata      │
│              ││ │                  │
│ READ: Anyone ││ │ READ: Token only │
│ WRITE: Owner ││ │ WRITE: Token only
└──────────────┘│ └──────────────────┘
               └─┘
```

### Authentication Flow

```
PHASE 1: TOKEN SETUP
User opens app → Checks localStorage → Token missing
                                       ↓
                              Shows login modal
                                       ↓
                    User pastes GitHub Personal Access Token
                                       ↓
                    App validates token against GitHub API
                                       ↓
                    Token stored in localStorage
                    (marked with expiry timestamp)


PHASE 2: API REQUESTS
Every GitHub API call:
  1. Get token from localStorage
  2. Add to Authorization header: "token {PAT}"
  3. Send request to GitHub API
  4. Check response headers for rate limit
  5. Handle 401 (token invalid) or 403 (rate limited)


PHASE 3: LOGOUT
User clicks "Logout" → Clears localStorage → Removes token → Redirects to login
```

### State Management Pattern

```
Application State Tree
│
├── auth
│   ├── token          (string)
│   ├── isAuthenticated (boolean)
│   ├── tokenExpiry    (timestamp)
│   └── tokenRepoName  (string - which repo this token is for)
│
├── repos
│   ├── publicRepo
│   │   ├── name       (string)
│   │   ├── owner      (string)
│   │   └── url        (string)
│   └── privateRepo
│       ├── name       (string)
│       ├── owner      (string)
│       └── url        (string)
│
├── albums
│   ├── all            (array of album objects)
│   ├── selected       (current album object)
│   ├── loading        (boolean)
│   ├── error          (string or null)
│   └── lastFetch      (timestamp)
│
├── images
│   ├── all            (array of image objects for current album)
│   ├── selected       (current image index)
│   ├── loading        (boolean)
│   ├── error          (string or null)
│   └── cache          (map of album → images)
│
├── upload
│   ├── inProgress     (boolean)
│   ├── files          (array of files to upload)
│   ├── selectedAlbum  (string - album name)
│   ├── progress       (0-100)
│   ├── errors         (array of error objects)
│   └── completed      (array of uploaded images)
│
├── ui
│   ├── theme          ("light" or "dark")
│   ├── mobileMenuOpen (boolean)
│   ├── lightboxOpen   (boolean)
│   ├── modalOpen      (string - "upload", "settings", null)
│   ├── searchQuery    (string)
│   ├── sortBy         (string - "date", "name", "size")
│   └── viewMode       ("grid" or "list")
│
└── settings
    ├── autoRefresh    (boolean)
    ├── cacheEnabled   (boolean)
    ├── cacheDuration  (number - minutes)
    ├── theme          (string)
    └── defaultSort    (string)
```

---

## TECHNOLOGY STACK & JUSTIFICATION

### Core Technologies

| Layer | Technology | Reason |
|-------|-----------|--------|
| **Frontend Framework** | Vanilla HTML5 + CSS3 + ES6+ JavaScript | Zero dependencies, maximum simplicity, maximum performance |
| **Styling** | CSS3 with CSS Variables & Grid/Flexbox | Modern, responsive, no preprocessor needed |
| **State Management** | JavaScript Object + localStorage | Simple, performant for SPA |
| **HTTP Client** | Fetch API | Built-in, modern, no library needed |
| **Build Tool** | None | Direct deployment, no build step |
| **Hosting** | GitHub Pages | Free, integrated, automatic deployment |
| **Image Storage** | GitHub Repository | Free, private/public control, version history |
| **Database** | GitHub as storage + JSON files | Leverages GitHub, no external DB needed |

### Browser APIs Used

✅ **Fetch API** - HTTP requests  
✅ **LocalStorage API** - Token & cache storage  
✅ **FileReader API** - File upload reading  
✅ **Blob API** - File handling  
✅ **Canvas API** - Image preview/thumbnail generation  
✅ **URL API** - Object URL generation  
✅ **History API** - Navigation without page reload  
✅ **IntersectionObserver** - Lazy loading  
✅ **FormData API** - File upload preparation  

### No External Dependencies Required

```javascript
// ❌ NOT using:
// - React, Vue, Angular
// - jQuery or other DOM libraries
// - Bootstrap or Tailwind (writing custom CSS)
// - Lodash or Underscore (ES6+ has everything)
// - Webpack, Parcel, or build tools
// - npm packages (zero complexity)

// ✅ Using:
// - Browser built-in APIs
// - Modern CSS features
// - ES6+ JavaScript
// - GitHub API directly
```

---

## UI/UX DESIGN SPECIFICATIONS

### Design System Overview

#### Color Palette

```
Primary Colors:
  ├── Primary Blue:      #007AFF (iOS-inspired)
  ├── Secondary Blue:    #0051D5 (darker for hover)
  ├── Accent Purple:     #9D4EDD
  └── Error Red:         #FF3B30

Neutral Colors:
  ├── Dark:              #1A1A1A (text on light bg)
  ├── Gray:              #8E8E93 (secondary text)
  ├── Light Gray:        #F2F2F7 (bg)
  ├── White:             #FFFFFF
  └── Border:            #E5E5EA

Semantic Colors:
  ├── Success:           #34C759
  ├── Warning:           #FF9500
  ├── Info:              #007AFF
  └── Danger:            #FF3B30

Dark Mode (Inverted):
  ├── Bg Dark:           #121212
  ├── Card Dark:         #1E1E1E
  └── Text Dark:         #FFFFFF
```

#### Typography

```
Font Family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif
(System fonts - zero loading time)

Sizes:
  ├── H1 (Headings):     32px, 700 weight, line-height 1.2
  ├── H2:                24px, 700 weight, line-height 1.3
  ├── H3:                20px, 600 weight, line-height 1.4
  ├── Body:              16px, 400 weight, line-height 1.5
  ├── Small:             14px, 400 weight, line-height 1.4
  ├── Tiny:              12px, 400 weight, line-height 1.3
  └── Button:            14px, 600 weight

Letter Spacing:
  ├── Normal:            0px
  ├── Titles:            -0.3px
  └── Small text:        0.3px
```

#### Spacing System (8px baseline)

```
0px, 4px, 8px, 12px, 16px, 24px, 32px, 40px, 48px, 56px, 64px, 72px, 80px

Used for:
  ├── Padding:           8px, 12px, 16px, 24px
  ├── Margin:            8px, 12px, 16px, 24px, 32px
  ├── Gap (flex):        8px, 12px, 16px
  ├── Border Radius:     4px, 8px, 12px, 16px
  └── Shadow offset:     0, 2px, 4px, 8px
```

#### Shadows (Elevation System)

```
Shadow 1 (Low):    0 1px 2px rgba(0, 0, 0, 0.05)
Shadow 2 (Medium): 0 2px 4px rgba(0, 0, 0, 0.1)
Shadow 3 (High):   0 4px 8px rgba(0, 0, 0, 0.15)
Shadow 4 (Very):   0 8px 16px rgba(0, 0, 0, 0.2)
```

---

### Screen Mockups & Layouts

#### SCREEN 1: Home/Login Screen
*When user first opens app without token*

```
┌─────────────────────────────────────┐
│         GALLERY APP                 │  ← Header (sticky)
│     🖼️  Photo Gallery                │
├─────────────────────────────────────┤
│                                     │
│                                     │
│           [APP LOGO]                │
│                                     │
│      Welcome to Your Gallery        │
│                                     │
│  To get started, you need to        │
│  authenticate with GitHub.          │
│                                     │
│    ┌──────────────────────────┐    │
│    │ Enter GitHub Token       │    │  ← Text input (password style)
│    │ [________________]       │    │
│    │ This is your Personal    │    │
│    │ Access Token (PAT)       │    │
│    │ Settings → Developer     │    │
│    │ Settings → PAT           │    │
│    │                          │    │
│    │ [  AUTHENTICATE  ]       │    │  ← Primary button
│    │ [  Learn More  ]         │    │  ← Secondary button
│    └──────────────────────────┘    │
│                                     │
│                                     │
│  ⓘ Token stored locally only        │  ← Info text
│    Never shared or logged            │
│                                     │
├─────────────────────────────────────┤
│  Settings ⚙️  Help ?  Privacy 🔒    │  ← Footer links
└─────────────────────────────────────┘
```

#### SCREEN 2: Home/Album Grid Screen
*After successful authentication*

```
┌──────────────────────────────────────────────┐
│  ☰  GALLERY       🔍 [Search...] ⚙️ 🌙  ✕  │  ← Header (sticky)
├──────────────────────────────────────────────┤
│                                              │
│  Albums                                      │
│                                              │
│  ┌──────────────────┐  ┌──────────────────┐ │
│  │ [Thumbnail]      │  │ [Thumbnail]      │ │
│  │ Vacation 2024    │  │ Family Photos    │ │
│  │ 24 images        │  │ 18 images        │ │
│  │ Updated 2 days   │  │ Updated 1 week   │ │
│  │ ago              │  │ ago              │ │
│  │ [⋮]              │  │ [⋮]              │ │
│  └──────────────────┘  └──────────────────┘ │
│                                              │
│  ┌──────────────────┐  ┌──────────────────┐ │
│  │ [Thumbnail]      │  │ [Thumbnail]      │ │
│  │ Wedding          │  │ Travel Memories  │ │
│  │ 45 images        │  │ 32 images        │ │
│  │ Updated 3 weeks  │  │ Updated 5 weeks  │ │
│  │ ago              │  │ ago              │ │
│  │ [⋮]              │  │ [⋮]              │ │
│  └──────────────────┘  └──────────────────┘ │
│                                              │
│            ┌──────────────────┐              │
│            │  [New Album +]   │              │
│            └──────────────────┘              │
│                                              │
├──────────────────────────────────────────────┤
│  [Upload Button] ───────── [Refresh]         │
│       (Bottom bar)                           │
└──────────────────────────────────────────────┘
```

#### SCREEN 3: Album Detail/Image Grid Screen

```
┌──────────────────────────────────────────────┐
│  ← Home   VACATION 2024    🔍 [Filter] ⚙️ 🌙 │  ← Header
├──────────────────────────────────────────────┤
│                                              │
│  Showing 24 images  |  Sort: [Newest ↓]     │
│                                              │
│  ┌─────────────────┐  ┌─────────────────┐   │
│  │  [IMG]          │  │  [IMG]          │   │
│  │ image_001.jpg   │  │ image_002.jpg   │   │
│  │ 2.4 MB          │  │ 3.1 MB          │   │
│  │ May 15, 2024    │  │ May 15, 2024    │   │
│  │                 │  │                 │   │
│  └─────────────────┘  └─────────────────┘   │
│                                              │
│  ┌─────────────────┐  ┌─────────────────┐   │
│  │  [IMG]          │  │  [IMG]          │   │
│  │ image_003.jpg   │  │ image_004.jpg   │   │
│  │ 2.8 MB          │  │ 2.9 MB          │   │
│  │ May 15, 2024    │  │ May 15, 2024    │   │
│  └─────────────────┘  └─────────────────┘   │
│                                              │
│  ┌─────────────────┐  ┌─────────────────┐   │
│  │  [IMG]          │  │  [IMG]          │   │
│  │ image_005.jpg   │  │ image_006.jpg   │   │
│  │ 3.5 MB          │  │ 2.6 MB          │   │
│  │ May 15, 2024    │  │ May 15, 2024    │   │
│  └─────────────────┘  └─────────────────┘   │
│                                              │
├──────────────────────────────────────────────┤
│  [Upload More]         [Download All]       │
└──────────────────────────────────────────────┘
```

#### SCREEN 4: Image Lightbox/Viewer

```
┌──────────────────────────────────────────────────┐
│                                                  │
│                                                  │
│              [ ◀ ]     IMAGE VIEWER     [ ▶ ]    │
│                                                  │
│                                                  │
│         ┌────────────────────────────┐           │
│         │                            │           │
│         │                            │           │
│         │        [ IMAGE ]           │           │
│         │        (Full size)         │           │
│         │                            │           │
│         │        (Click to zoom)     │           │
│         │                            │           │
│         └────────────────────────────┘           │
│                                                  │
│            12 of 24 images                      │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ ◀  [Thumb] [Thumb] [Thumb] [Thumb] ▶   │  │ ← Thumbnail strip
│  └──────────────────────────────────────────┘  │
│                                                  │
│  Filename: image_012.jpg                        │
│  Size: 3.2 MB  |  Dimensions: 4000x3000px      │
│  Uploaded: May 15, 2024 at 3:45 PM             │
│                                                  │
│  [ Download ] [ Share ] [ Delete ] [ ✕ Close ] │
│                                                  │
└──────────────────────────────────────────────────┘
```

#### SCREEN 5: Upload Modal

```
┌──────────────────────────────────────────┐
│          Upload Images      ✕             │
├──────────────────────────────────────────┤
│                                          │
│  Step 1/3: Select Photos                │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │   📁 Click to select or           │  │
│  │   drag and drop files here       │  │
│  │                                  │  │
│  │   Supported: JPG, PNG, GIF, etc. │  │
│  └──────────────────────────────────┘  │
│                                          │
│  Selected files: 0                      │
│                                          │
│  ┌────────────────────────────────────┐│
│  │ No files selected yet             ││
│  └────────────────────────────────────┘│
│                                          │
│                                          │
│                      [Back] [Continue]  │
│                                          │
└──────────────────────────────────────────┘


[After file selection - Step 2/3]

│          Upload Images      ✕             │
├──────────────────────────────────────────┤
│                                          │
│  Step 2/3: Select Album                 │
│                                          │
│  Where should these go?                 │
│                                          │
│  Album:  [Vacation 2024 ↓]              │
│          [Family Photos]                 │
│          [Wedding]                      │
│          [Travel Memories]              │
│          ─────────────────              │
│          [+ Create New Album]           │
│                                          │
│  New Album Name:                        │
│  [_________________________]             │
│                                          │
│  3 files selected:                      │
│  ✓ photo1.jpg (2.4 MB)                  │
│  ✓ photo2.jpg (3.1 MB)                  │
│  ✓ photo3.jpg (2.8 MB)                  │
│                                          │
│                      [Back] [Upload]    │
│                                          │
└──────────────────────────────────────────┘


[During Upload - Step 3/3]

│          Upload Progress    ✕             │
├──────────────────────────────────────────┤
│                                          │
│  Uploading to: Vacation 2024             │
│                                          │
│  photo1.jpg                              │
│  [████████░░░░░░░░░░░░░░░░░░░░░░] 35%   │
│  Uploading...                            │
│                                          │
│  photo2.jpg                              │
│  [██████████████░░░░░░░░░░░░░░░░] 50%   │
│  Uploading...                            │
│                                          │
│  photo3.jpg                              │
│  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 0%   │
│  Waiting...                              │
│                                          │
│  Total Progress:                         │
│  [███████████░░░░░░░░░░░░░░░░░░░] 35%   │
│                                          │
│  Estimated time: 2 min 30 sec            │
│                                          │
│              [Cancel Upload]             │
│                                          │
└──────────────────────────────────────────┘
```

---

### Responsive Breakpoints

```
Mobile Phone:    320px - 480px   (portrait)
Tablet:          480px - 768px   (portrait)
Landscape:       768px - 1024px  (landscape)
Desktop:         1024px - 1280px
Large Desktop:   1280px+

Grid Columns:
  Mobile:        1 column
  Tablet:        2 columns
  Desktop:       3 columns
  Large:         4 columns

Image Thumbnail Sizes:
  Mobile:        100px × 100px
  Tablet:        120px × 120px
  Desktop:       140px × 140px
  Large:         160px × 160px
```

---

## AUTHENTICATION & SECURITY FLOW

### Token Management System

#### Phase 1: Initial Setup (First Time)

```
User opens app
    ↓
JavaScript checks: localStorage.getItem('gh_token')
    ├─→ Found && Not Expired? → Go to Home screen
    └─→ Not Found || Expired? → Show Login Modal
            ↓
    Modal displays:
    - Token input field (password type)
    - Link to GitHub PAT creation
    - Warnings about security
            ↓
    User pastes token from GitHub
            ↓
    JavaScript validates:
    - Token format check (40 hex chars)
    - API call to GET /user with token
    - Check rate limit headers
            ↓
    ├─→ Valid? → Store in localStorage
    │          → Store timestamp + metadata
    │          → Redirect to Home
    └─→ Invalid? → Show error message
               → Allow retry
```

#### Phase 2: Token Storage Structure

```javascript
// In localStorage:
{
  "gh_token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "gh_token_created": 1718362800000,
  "gh_token_expires": 1718366400000,  // 1 hour from now
  "gh_token_scope": "repo",
  "gh_token_for_user": "username",
  "gh_token_for_repos": {
    "public": "username/gallery-app",
    "private": "username/gallery-images"
  }
}
```

#### Phase 3: API Request Interceptor

```javascript
// Every API call goes through this:

async function apiCall(method, endpoint, data = null) {
  // 1. Get token from localStorage
  const token = localStorage.getItem('gh_token');
  
  if (!token) {
    // Token missing → show login modal
    showLoginModal();
    throw new Error('No authentication token');
  }
  
  // 2. Check expiry
  const tokenExpiry = parseInt(localStorage.getItem('gh_token_expires'));
  if (Date.now() > tokenExpiry) {
    // Token expired → clear and show login
    localStorage.removeItem('gh_token');
    showLoginModal('Token expired, please re-authenticate');
    throw new Error('Token expired');
  }
  
  // 3. Build request with auth header
  const options = {
    method: method,
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    }
  };
  
  if (data) options.body = JSON.stringify(data);
  
  // 4. Make request
  try {
    const response = await fetch(`https://api.github.com${endpoint}`, options);
    
    // 5. Check response
    if (response.status === 401) {
      // Token invalid → clear and show login
      localStorage.removeItem('gh_token');
      showLoginModal('Token invalid or revoked');
      throw new Error('Unauthorized');
    }
    
    if (response.status === 403) {
      // Check if it's rate limit
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      if (rateLimitRemaining === '0') {
        const resetTime = response.headers.get('X-RateLimit-Reset');
        showRateLimitError(resetTime);
        throw new Error('Rate limited');
      }
    }
    
    // 6. Return response
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`API error: ${response.status}`);
    }
  } catch (error) {
    showError(error.message);
    throw error;
  }
}
```

#### Phase 4: Logout & Token Removal

```javascript
function logout() {
  // 1. Clear all token data
  localStorage.removeItem('gh_token');
  localStorage.removeItem('gh_token_created');
  localStorage.removeItem('gh_token_expires');
  localStorage.removeItem('gh_token_scope');
  localStorage.removeItem('gh_token_for_user');
  localStorage.removeItem('gh_token_for_repos');
  
  // 2. Clear all user data cache
  localStorage.removeItem('albums_cache');
  localStorage.removeItem('images_cache');
  
  // 3. Clear app state
  appState = {
    auth: { token: null, isAuthenticated: false },
    albums: { all: [], selected: null, loading: false },
    images: { all: [], selected: null, loading: false },
    ui: { theme: 'light', mobileMenuOpen: false }
  };
  
  // 4. Redirect to login
  showLoginModal();
  
  // 5. Show confirmation
  showNotification('Logged out successfully', 'success');
}
```

---

### Security Checklist

✅ **Token Storage**
- [ ] Token stored in localStorage only (not in code/env files)
- [ ] Token never logged or sent to external services
- [ ] Token cleared on logout
- [ ] Token has expiry mechanism

✅ **API Security**
- [ ] All API calls use HTTPS
- [ ] Authorization header on every request
- [ ] Proper error handling (no sensitive info in errors)
- [ ] Rate limit monitoring

✅ **Input Validation**
- [ ] Album names sanitized (no special chars)
- [ ] Filenames cleaned before upload
- [ ] File type validation (magic number check)
- [ ] File size validation before upload

✅ **XSS Prevention**
- [ ] No innerHTML usage (use textContent)
- [ ] All user inputs escaped
- [ ] No eval() or Function() calls
- [ ] Content Security Policy headers

✅ **CORS Handling**
- [ ] GitHub API allows CORS for public data
- [ ] Proper Authorization headers for private access
- [ ] Handle CORS errors gracefully

---

## DATA MODELS & STORAGE

### Data Structures

#### Album Object

```javascript
{
  // Returned by GitHub API
  id: 12345678,
  name: "Vacation_2024",               // Folder name
  path: "albums/Vacation_2024",
  type: "dir",
  sha: "abcd1234...",
  size: null,                          // Null for folders
  url: "https://api.github.com/repos/username/gallery-images/contents/albums/Vacation_2024",
  html_url: "https://github.com/username/gallery-images/tree/main/albums/Vacation_2024",
  
  // Computed by frontend
  displayName: "Vacation 2024",         // Cleaned-up name
  imageCount: 24,
  thumbnailUrl: "https://raw.githubusercontent.com/username/gallery-images/main/albums/Vacation_2024/image_001.jpg",
  lastUpdated: "2024-05-15T10:30:00Z",
  createdDate: "2024-05-01T08:00:00Z",
  
  // Metadata from metadata.json (if exists)
  metadata: {
    description: "Our summer vacation in Greece",
    tags: ["travel", "beach", "2024"],
    coverImage: "image_001.jpg",
    isArchived: false,
    sortOrder: 1
  }
}
```

#### Image Object

```javascript
{
  // From GitHub API
  id: 87654321,
  name: "image_012.jpg",
  path: "albums/Vacation_2024/image_012.jpg",
  type: "file",
  sha: "efgh5678...",
  size: 3355443,                       // In bytes
  url: "https://api.github.com/repos/username/gallery-images/contents/albums/Vacation_2024/image_012.jpg",
  html_url: "https://github.com/username/gallery-images/blob/main/albums/Vacation_2024/image_012.jpg",
  download_url: "https://raw.githubusercontent.com/username/gallery-images/main/albums/Vacation_2024/image_012.jpg",
  
  // Computed by frontend
  displayName: "image_012",
  extension: "jpg",
  sizeMB: 3.2,
  
  // From file metadata
  mimeType: "image/jpeg",
  dimensions: {
    width: 4000,
    height: 3000
  },
  uploadedDate: "2024-05-15T10:30:00Z",
  
  // Metadata from JSON (if exists)
  metadata: {
    caption: "Sunset at Santorini",
    description: "Beautiful sunset photo",
    tags: ["sunset", "greece", "santorini"],
    favorite: true,
    viewCount: 45
  }
}
```

#### Album Metadata JSON

```json
{
  "version": "1.0",
  "album": {
    "name": "Vacation_2024",
    "displayName": "Vacation 2024",
    "description": "Our summer vacation in Greece",
    "location": "Greece",
    "dates": {
      "start": "2024-05-01",
      "end": "2024-05-15"
    },
    "tags": ["travel", "beach", "2024", "greece"],
    "coverImage": "image_001.jpg",
    "createdAt": "2024-05-01T08:00:00Z",
    "updatedAt": "2024-05-15T10:30:00Z",
    "isPrivate": false,
    "isArchived": false,
    "sortOrder": 1,
    "collaborators": ["user1", "user2"],
    "statistics": {
      "totalImages": 24,
      "totalSize": "80.5 MB",
      "viewCount": 342
    }
  },
  "images": [
    {
      "filename": "image_001.jpg",
      "displayName": "image_001",
      "caption": "Landing at Athens",
      "description": "Our plane landing at Athens International Airport",
      "tags": ["airport", "athens"],
      "favorite": false,
      "uploadedAt": "2024-05-01T10:30:00Z",
      "dimensions": "4000x3000"
    },
    {
      "filename": "image_002.jpg",
      "displayName": "image_002",
      "caption": "Acropolis View",
      "description": "The beautiful Acropolis of Athens",
      "tags": ["acropolis", "athens", "history"],
      "favorite": true,
      "uploadedAt": "2024-05-02T14:15:00Z",
      "dimensions": "3840x2560"
    }
  ]
}
```

#### Browser Storage Structure (localStorage)

```javascript
{
  // Authentication
  "gh_token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "gh_token_expires": "1718449200000",
  
  // Configuration
  "config": {
    "publicRepo": "username/gallery-app",
    "privateRepo": "username/gallery-images",
    "theme": "light",
    "autoRefresh": true,
    "cacheEnabled": true,
    "cacheDuration": 300000  // 5 minutes in ms
  },
  
  // Cache - Albums list
  "albums_cache": {
    "data": [
      { "id": 1, "name": "Vacation_2024", ... },
      { "id": 2, "name": "Family_Photos", ... }
    ],
    "timestamp": 1718362800000,
    "ttl": 300000
  },
  
  // Cache - Images for each album
  "images_cache_vacation_2024": {
    "data": [
      { "name": "image_001.jpg", ... },
      { "name": "image_002.jpg", ... }
    ],
    "timestamp": 1718362800000,
    "ttl": 600000  // 10 minutes for images
  },
  
  // Cache - Metadata
  "metadata_cache": {
    "vacation_2024": { ... },
    "family_photos": { ... }
  },
  
  // User preferences
  "preferences": {
    "sortBy": "date",
    "sortOrder": "desc",
    "viewMode": "grid",
    "imagesPerPage": 20,
    "theme": "light",
    "language": "en",
    "notifications": true
  },
  
  // UI state (volatile)
  "ui_state": {
    "currentAlbum": "vacation_2024",
    "currentImage": 5,
    "lightboxOpen": false,
    "mobileMenuOpen": false,
    "modalOpen": null,
    "searchQuery": ""
  }
}
```

---

## API INTEGRATION STRATEGY

### GitHub API Endpoints Mapping

#### 1. Authentication & Rate Limit

```javascript
// Check if token is valid & get rate limit info
GET /user
Headers: { Authorization: token {PAT} }

Response:
{
  "login": "username",
  "id": 12345,
  "avatar_url": "...",
  "type": "User",
  ...
}

// Check rate limit status
GET /rate_limit
Response:
{
  "resources": {
    "core": {
      "limit": 5000,
      "remaining": 4999,
      "reset": 1718449200
    }
  }
}
```

#### 2. List Albums (Folders)

```javascript
// Get all folders in albums/ directory
GET /repos/{owner}/{repo}/contents/albums

Response: Array of objects
[
  {
    "name": "Vacation_2024",
    "path": "albums/Vacation_2024",
    "sha": "...",
    "size": null,
    "type": "dir",
    "url": "https://api.github.com/repos/username/gallery-images/contents/albums/Vacation_2024",
    "html_url": "https://github.com/username/gallery-images/tree/main/albums/Vacation_2024",
    "download_url": null,
    "_links": {
      "self": "...",
      "html": "...",
      "git": "..."
    }
  },
  ... more albums
]

// Filter only directories
const albums = response.filter(item => item.type === 'dir');
```

#### 3. List Images in Album

```javascript
// Get all files in a specific album
GET /repos/{owner}/{repo}/contents/albums/{albumName}

Response: Array including both files and folders
[
  {
    "name": "image_001.jpg",
    "path": "albums/Vacation_2024/image_001.jpg",
    "sha": "...",
    "size": 3355443,
    "type": "file",
    "url": "https://api.github.com/repos/username/gallery-images/contents/albums/Vacation_2024/image_001.jpg",
    "html_url": "https://github.com/username/gallery-images/blob/main/albums/Vacation_2024/image_001.jpg",
    "download_url": "https://raw.githubusercontent.com/username/gallery-images/main/albums/Vacation_2024/image_001.jpg"
  },
  {
    "name": "metadata.json",
    "path": "albums/Vacation_2024/metadata.json",
    "type": "file",
    ...
  }
]

// Filter only image files
const images = response.filter(item => 
  item.type === 'file' && 
  /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(item.name)
);
```

#### 4. Get Image Metadata

```javascript
// Get metadata.json content for album
GET /repos/{owner}/{repo}/contents/albums/{albumName}/metadata.json

Response:
{
  "name": "metadata.json",
  "path": "albums/Vacation_2024/metadata.json",
  "sha": "...",
  "size": 2048,
  "type": "file",
  "content": "eyJhbGJ1bSI6eyJuYW1lIjoiVmFjYXRpb24yMDI0In19",  // Base64
  "encoding": "base64",
  "url": "...",
  "html_url": "...",
  "download_url": "..."
}

// Decode content
const content = JSON.parse(atob(response.content));
```

#### 5. Upload Image (Create/Update Blob)

```javascript
// PUT request to create/update file
PUT /repos/{owner}/{repo}/contents/{path}

Request Body:
{
  "message": "Upload: image_001.jpg",
  "content": "base64-encoded-image-data",
  "branch": "main"
}

Response:
{
  "content": {
    "name": "image_001.jpg",
    "path": "albums/Vacation_2024/image_001.jpg",
    "sha": "new-sha",
    ...
  },
  "commit": {
    "sha": "commit-sha",
    "url": "...",
    "message": "Upload: image_001.jpg",
    ...
  }
}
```

#### 6. Delete Image/Album

```javascript
// DELETE file
DELETE /repos/{owner}/{repo}/contents/{path}

Request Body:
{
  "message": "Delete: image_001.jpg",
  "sha": "current-file-sha",  // Must match current state
  "branch": "main"
}

Response:
{
  "content": null,
  "commit": {
    "sha": "...",
    "message": "Delete: image_001.jpg",
    ...
  }
}
```

#### 7. Create Directory/Album

```javascript
// GitHub doesn't have explicit mkdir
// Solution: Create a .gitkeep file in the new folder
PUT /repos/{owner}/{repo}/contents/albums/{newAlbumName}/.gitkeep

Request Body:
{
  "message": "Create album: {newAlbumName}",
  "content": "",  // Empty file
  "branch": "main"
}

// Then delete .gitkeep after uploading first image
```

### API Call Wrapper Function

```javascript
// File: api.js

class GitHubAPI {
  constructor(token, ownerUsername, publicRepo, privateRepo) {
    this.token = token;
    this.owner = ownerUsername;
    this.publicRepo = publicRepo;
    this.privateRepo = privateRepo;
    this.baseURL = 'https://api.github.com';
    this.rateLimitRemaining = 5000;
  }
  
  async request(method, endpoint, data = null) {
    const url = `${this.baseURL}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'X-GitHub-Media-Type': 'github.v3'
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      
      // Update rate limit
      this.rateLimitRemaining = parseInt(
        response.headers.get('X-RateLimit-Remaining') || '5000'
      );
      
      // Handle different status codes
      if (response.status === 401) {
        // Token invalid
        this.emit('auth-error', 'Token invalid or revoked');
        throw new Error('Unauthorized');
      }
      
      if (response.status === 403) {
        if (this.rateLimitRemaining === 0) {
          const resetTime = response.headers.get('X-RateLimit-Reset');
          this.emit('rate-limit', { resetTime });
          throw new Error('Rate limit exceeded');
        }
      }
      
      if (response.status === 404) {
        throw new Error('Not found');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      this.emit('error', error.message);
      throw error;
    }
  }
  
  // Convenience methods
  async listAlbums() {
    return this.request('GET', `/repos/${this.owner}/${this.privateRepo}/contents/albums`);
  }
  
  async listImages(albumName) {
    return this.request('GET', `/repos/${this.owner}/${this.privateRepo}/contents/albums/${albumName}`);
  }
  
  async uploadImage(albumName, filename, imageData) {
    const path = `/repos/${this.owner}/${this.privateRepo}/contents/albums/${albumName}/${filename}`;
    return this.request('PUT', path, {
      message: `Upload: ${filename}`,
      content: this.arrayBufferToBase64(imageData),
      branch: 'main'
    });
  }
  
  async deleteImage(albumName, filename, sha) {
    const path = `/repos/${this.owner}/${this.privateRepo}/contents/albums/${albumName}/${filename}`;
    return this.request('DELETE', path, {
      message: `Delete: ${filename}`,
      sha: sha,
      branch: 'main'
    });
  }
  
  // Utility
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  emit(event, data) {
    document.dispatchEvent(new CustomEvent(`github-api:${event}`, { detail: data }));
  }
}

// Usage:
const api = new GitHubAPI(token, 'username', 'gallery-app', 'gallery-images');
const albums = await api.listAlbums();
```

---

## FRONTEND CODE STRUCTURE

### File Organization

```
/public-repo/
├── index.html                 (400-600 lines)
│   └── Contains:
│       - DOCTYPE & head
│       - Meta tags (responsive, icons, og:)
│       - CSS embedded or linked
│       - HTML structure (containers, modals, templates)
│       - JavaScript modules loaded before </body>
│
├── style.css                  (800-1200 lines)
│   └── Sections:
│       - CSS Variables (colors, spacing, fonts)
│       - Reset & Base styles
│       - Utility classes
│       - Component styles
│       - Layout (header, nav, main, footer)
│       - Responsive media queries
│
├── app.js                     (600-800 lines)
│   └── Main controller:
│       - App initialization
│       - State management
│       - Event listeners
│       - Router/navigation logic
│       - Main app loop
│
├── config.js                  (80-120 lines)
│   └── Configuration:
│       - API endpoints
│       - Repository names
│       - Feature flags
│       - Constants
│
├── auth.js                    (200-300 lines)
│   └── Authentication:
│       - Token validation
│       - Login/logout
│       - Token storage
│       - Session management
│
├── api.js                     (300-400 lines)
│   └── GitHub API wrapper:
│       - API request methods
│       - Error handling
│       - Rate limit tracking
│       - Response parsing
│
├── ui.js                      (400-600 lines)
│   └── UI/DOM manipulation:
│       - Render functions for each screen
│       - Modal management
│       - DOM updates
│       - Event bindings
│
├── storage.js                 (150-200 lines)
│   └── Browser storage:
│       - Cache management
│       - localStorage helpers
│       - Cache invalidation
│
├── utils.js                   (150-250 lines)
│   └── Utility functions:
│       - String manipulation
│       - Date formatting
│       - File handling
│       - Array/object helpers
│
└── assets/
    ├── favicon.ico
    ├── logo.svg
    ├── icons/
    │   ├── upload.svg
    │   ├── download.svg
    │   ├── menu.svg
    │   ├── close.svg
    │   ├── back.svg
    │   ├── next.svg
    │   ├── prev.svg
    │   └── ...
    └── placeholder.png
```

---

### HTML Structure Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Your GitHub-powered image gallery">
  <meta name="theme-color" content="#007AFF">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta property="og:title" content="My Photo Gallery">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://...">
  
  <title>Gallery | Photo Manager</title>
  <link rel="icon" type="image/svg+xml" href="./assets/favicon.svg">
  <link rel="stylesheet" href="./style.css">
</head>
<body>
  <!-- HEADER -->
  <header id="header" class="header sticky">
    <div class="header__container">
      <div class="header__left">
        <button id="menuBtn" class="header__menu-btn" aria-label="Menu">
          <svg class="icon icon--menu"><use href="#icon-menu"></use></svg>
        </button>
        <h1 class="header__title">Gallery</h1>
      </div>
      
      <div class="header__center">
        <input type="search" id="globalSearch" class="header__search" 
               placeholder="Search albums & images..." aria-label="Search">
      </div>
      
      <div class="header__right">
        <button id="themeBtn" class="header__theme-btn" aria-label="Toggle theme">
          <svg class="icon icon--moon"><use href="#icon-moon"></use></svg>
        </button>
        <button id="settingsBtn" class="header__settings-btn" aria-label="Settings">
          <svg class="icon icon--settings"><use href="#icon-settings"></use></svg>
        </button>
        <button id="closeBtn" class="header__close-btn" aria-label="Close">
          <svg class="icon icon--close"><use href="#icon-close"></use></svg>
        </button>
      </div>
    </div>
  </header>

  <!-- MOBILE MENU (SIDEBAR) -->
  <nav id="mobileMenu" class="mobile-menu" aria-label="Navigation">
    <div class="mobile-menu__content">
      <button class="mobile-menu__close">&times;</button>
      <ul class="mobile-menu__list">
        <li><a href="#" class="mobile-menu__link" data-action="home">Home</a></li>
        <li><a href="#" class="mobile-menu__link" data-action="search">Search</a></li>
        <li><a href="#" class="mobile-menu__link" data-action="settings">Settings</a></li>
        <li><a href="#" class="mobile-menu__link" data-action="about">About</a></li>
        <li><a href="#" class="mobile-menu__link" data-action="logout">Logout</a></li>
      </ul>
    </div>
  </nav>

  <!-- MAIN CONTENT -->
  <main id="main" class="main">
    <!-- SCREEN 1: LOGIN -->
    <section id="loginScreen" class="screen screen--login hidden">
      <!-- Login form will be rendered here -->
    </section>

    <!-- SCREEN 2: HOME (Album Grid) -->
    <section id="homeScreen" class="screen screen--home hidden">
      <!-- Album grid will be rendered here -->
    </section>

    <!-- SCREEN 3: ALBUM (Image Grid) -->
    <section id="albumScreen" class="screen screen--album hidden">
      <!-- Image grid will be rendered here -->
    </section>

    <!-- SCREEN 4: LIGHTBOX (Image Viewer) -->
    <section id="lightboxScreen" class="screen screen--lightbox hidden">
      <!-- Lightbox viewer will be rendered here -->
    </section>
  </main>

  <!-- BOTTOM ACTION BAR (Mobile) -->
  <div id="actionBar" class="action-bar">
    <button id="uploadBtn" class="action-bar__btn action-bar__btn--primary" aria-label="Upload">
      <svg class="icon"><use href="#icon-upload"></use></svg>
      <span>Upload</span>
    </button>
    <button id="refreshBtn" class="action-bar__btn" aria-label="Refresh">
      <svg class="icon"><use href="#icon-refresh"></use></svg>
      <span>Refresh</span>
    </button>
  </div>

  <!-- MODALS -->
  
  <!-- Upload Modal -->
  <dialog id="uploadModal" class="modal modal--upload">
    <div class="modal__overlay" id="uploadModalOverlay"></div>
    <div class="modal__content">
      <!-- Upload form will be rendered here -->
    </div>
  </dialog>

  <!-- Settings Modal -->
  <dialog id="settingsModal" class="modal modal--settings">
    <div class="modal__overlay" id="settingsModalOverlay"></div>
    <div class="modal__content">
      <!-- Settings form will be rendered here -->
    </div>
  </dialog>

  <!-- Confirm Dialog -->
  <dialog id="confirmDialog" class="modal modal--confirm">
    <div class="modal__overlay"></div>
    <div class="modal__content">
      <!-- Confirm dialog will be rendered here -->
    </div>
  </dialog>

  <!-- NOTIFICATIONS -->
  <div id="notificationContainer" class="notification-container"></div>

  <!-- SVG ICONS SPRITE -->
  <svg style="display: none;">
    <defs>
      <symbol id="icon-menu"><path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/></symbol>
      <symbol id="icon-close"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></symbol>
      <symbol id="icon-upload"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></symbol>
      <!-- More icons... -->
    </defs>
  </svg>

  <!-- SCRIPT MODULES -->
  <script src="./config.js"></script>
  <script src="./utils.js"></script>
  <script src="./storage.js"></script>
  <script src="./auth.js"></script>
  <script src="./api.js"></script>
  <script src="./ui.js"></script>
  <script src="./app.js"></script>
</body>
</html>
```

---

### CSS Architecture

```css
/* ===== CSS VARIABLES ===== */
:root {
  /* Colors */
  --color-primary: #007AFF;
  --color-secondary: #0051D5;
  --color-accent: #9D4EDD;
  --color-error: #FF3B30;
  --color-success: #34C759;
  --color-warning: #FF9500;
  --color-info: #007AFF;
  
  --color-dark: #1A1A1A;
  --color-gray: #8E8E93;
  --color-light-gray: #F2F2F7;
  --color-white: #FFFFFF;
  --color-border: #E5E5EA;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-base: 16px;
  --font-size-sm: 14px;
  --font-size-xs: 12px;
  --font-size-lg: 20px;
  --font-size-xl: 24px;
  --font-size-2xl: 32px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.15);
  --shadow-xl: 0 8px 16px rgba(0, 0, 0, 0.2);
  
  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 300ms ease-in-out;
  --transition-slow: 500ms ease-in-out;
  
  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-dark: #FFFFFF;
    --color-light-gray: #121212;
    --color-white: #1E1E1E;
    --color-border: #2C2C2C;
  }
}

/* ===== BASE STYLES ===== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: 1.5;
  color: var(--color-dark);
  background: var(--color-light-gray);
  transition: background-color var(--transition-normal);
}

body.dark {
  background: var(--color-white);
}

/* ===== TYPOGRAPHY ===== */
h1 { font-size: var(--font-size-2xl); font-weight: 700; }
h2 { font-size: var(--font-size-xl); font-weight: 700; }
h3 { font-size: var(--font-size-lg); font-weight: 600; }
h4 { font-size: var(--font-size-base); font-weight: 600; }

a {
  color: var(--color-primary);
  text-decoration: none;
  cursor: pointer;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--color-secondary);
}

/* ===== COMPONENTS ===== */

/* Header */
.header {
  background: var(--color-white);
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-lg);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.header__container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.header__left, .header__right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.header__title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  margin-left: var(--space-md);
}

.header__search {
  flex: 1;
  max-width: 400px;
  padding: var(--space-sm) var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.header__btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.header__btn:hover {
  background: var(--color-light-gray);
}

/* Buttons */
.btn {
  padding: var(--space-sm) var(--space-lg);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
}

.btn--primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn--primary:hover {
  background: var(--color-secondary);
  box-shadow: var(--shadow-md);
}

.btn--secondary {
  background: var(--color-light-gray);
  color: var(--color-dark);
  border: 1px solid var(--color-border);
}

.btn--secondary:hover {
  background: var(--color-border);
}

.btn--danger {
  background: var(--color-error);
  color: var(--color-white);
}

.btn--danger:hover {
  background: #FF453A;
}

/* Grid */
.grid {
  display: grid;
  gap: var(--space-lg);
  margin: var(--space-lg) 0;
}

.grid--albums {
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
}

@media (min-width: 768px) {
  .grid--albums {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}

@media (min-width: 1024px) {
  .grid--albums {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

/* Cards */
.card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card__image {
  width: 100%;
  height: 140px;
  background: var(--color-light-gray);
  border-radius: var(--radius-md);
  object-fit: cover;
  margin-bottom: var(--space-md);
}

.card__title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin-bottom: var(--space-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card__meta {
  font-size: var(--font-size-xs);
  color: var(--color-gray);
  display: flex;
  justify-content: space-between;
}

/* More CSS... modals, forms, utility classes, etc. */

/* ===== RESPONSIVE ===== */

@media (max-width: 768px) {
  .header__search {
    display: none;
  }
  
  .header__center {
    display: none;
  }
  
  .grid--albums {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}

/* ===== UTILITIES ===== */

.hidden {
  display: none !important;
}

.flex {
  display: flex;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-center {
  text-align: center;
}

.mt-lg {
  margin-top: var(--space-lg);
}

/* ... more utilities ... */
```

---

### JavaScript Module: app.js

```javascript
// app.js - Main application controller

class GalleryApp {
  constructor(config) {
    this.config = config;
    this.state = this.initializeState();
    this.api = null;
    this.currentScreen = 'login';
    this.init();
  }
  
  initializeState() {
    return {
      auth: {
        token: null,
        isAuthenticated: false,
        user: null
      },
      repos: {
        public: this.config.publicRepo,
        private: this.config.privateRepo
      },
      albums: {
        all: [],
        selected: null,
        loading: false,
        error: null
      },
      images: {
        all: [],
        selected: null,
        loading: false,
        cache: {}
      },
      ui: {
        theme: localStorage.getItem('theme') || 'light',
        mobileMenuOpen: false,
        lightboxOpen: false,
        currentModal: null,
        searchQuery: ''
      }
    };
  }
  
  async init() {
    console.log('Initializing Gallery App...');
    
    // 1. Check if user is logged in
    const token = Storage.getToken();
    if (token) {
      this.state.auth.token = token;
      this.state.auth.isAuthenticated = true;
      
      // 2. Initialize API
      this.api = new GitHubAPI(
        token,
        this.config.owner,
        this.config.publicRepo,
        this.config.privateRepo
      );
      
      // 3. Go to home screen
      await this.showHomeScreen();
    } else {
      // 4. Show login
      this.showLoginScreen();
    }
    
    // 5. Setup event listeners
    this.setupEventListeners();
    
    // 6. Setup theme
    this.applyTheme(this.state.ui.theme);
  }
  
  setupEventListeners() {
    // Header buttons
    document.getElementById('menuBtn')?.addEventListener('click', () => this.toggleMobileMenu());
    document.getElementById('themeBtn')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('settingsBtn')?.addEventListener('click', () => this.showSettingsModal());
    
    // Upload button
    document.getElementById('uploadBtn')?.addEventListener('click', () => this.showUploadModal());
    document.getElementById('refreshBtn')?.addEventListener('click', () => this.refreshCurrentScreen());
    
    // Search
    document.getElementById('globalSearch')?.addEventListener('input', (e) => {
      this.state.ui.searchQuery = e.target.value;
      this.filterAndRender();
    });
    
    // Listen for authentication errors
    document.addEventListener('github-api:auth-error', (e) => {
      this.handleAuthError(e.detail);
    });
    
    document.addEventListener('github-api:rate-limit', (e) => {
      this.handleRateLimit(e.detail);
    });
  }
  
  async showLoginScreen() {
    console.log('Showing login screen');
    this.currentScreen = 'login';
    
    const loginHTML = `
      <div class="login-container">
        <h1>Welcome to Gallery</h1>
        <p>To get started, authenticate with GitHub</p>
        
        <div class="form-group">
          <label for="tokenInput">GitHub Personal Access Token</label>
          <input type="password" id="tokenInput" placeholder="ghp_..." class="form-control">
          <small>Create a token: Settings → Developer Settings → Personal Access Tokens</small>
        </div>
        
        <button class="btn btn--primary" id="authenticateBtn">Authenticate</button>
        <button class="btn btn--secondary" id="learnMoreBtn">Learn More</button>
        
        <div class="info-box">
          <p>🔒 Your token is stored locally in your browser only.</p>
          <p>Never shared or sent to external servers.</p>
        </div>
      </div>
    `;
    
    const loginScreen = document.getElementById('loginScreen');
    loginScreen.innerHTML = loginHTML;
    loginScreen.classList.remove('hidden');
    
    // Hide other screens
    document.getElementById('homeScreen')?.classList.add('hidden');
    document.getElementById('albumScreen')?.classList.add('hidden');
    document.getElementById('lightboxScreen')?.classList.add('hidden');
    
    // Setup login button
    document.getElementById('authenticateBtn').addEventListener('click', async () => {
      const token = document.getElementById('tokenInput').value.trim();
      await this.authenticate(token);
    });
  }
  
  async authenticate(token) {
    try {
      this.api = new GitHubAPI(
        token,
        this.config.owner,
        this.config.publicRepo,
        this.config.privateRepo
      );
      
      // Test token validity
      const response = await this.api.request('GET', '/user');
      
      // Store token
      Storage.setToken(token);
      this.state.auth.token = token;
      this.state.auth.isAuthenticated = true;
      this.state.auth.user = response;
      
      Notify.success(`Welcome, ${response.login}!`);
      
      // Go to home
      await this.showHomeScreen();
      
    } catch (error) {
      Notify.error('Authentication failed. Invalid token?');
    }
  }
  
  async showHomeScreen() {
    console.log('Showing home screen');
    this.currentScreen = 'home';
    
    const homeScreen = document.getElementById('homeScreen');
    homeScreen.innerHTML = '<div class="loading">Loading albums...</div>';
    homeScreen.classList.remove('hidden');
    
    document.getElementById('loginScreen')?.classList.add('hidden');
    document.getElementById('albumScreen')?.classList.add('hidden');
    document.getElementById('lightboxScreen')?.classList.add('hidden');
    
    try {
      // Fetch albums
      this.state.albums.loading = true;
      const albumsResponse = await this.api.listAlbums();
      
      const albums = albumsResponse
        .filter(item => item.type === 'dir')
        .map(album => ({
          name: album.name,
          displayName: Utils.formatAlbumName(album.name),
          path: album.path,
          lastUpdated: album.updated_at || new Date().toISOString(),
          imageCount: 0  // Will be fetched separately
        }));
      
      this.state.albums.all = albums;
      this.state.albums.loading = false;
      
      // Render albums
      this.renderAlbumGrid(albums);
      
    } catch (error) {
      console.error('Error loading albums:', error);
      Notify.error('Failed to load albums');
      homeScreen.innerHTML = `<div class="error">${error.message}</div>`;
    }
  }
  
  renderAlbumGrid(albums) {
    const grid = `
      <div class="screen-header">
        <h2>Albums (${albums.length})</h2>
        <button class="btn btn--secondary" onclick="app.refreshCurrentScreen()">🔄 Refresh</button>
      </div>
      
      <div class="grid grid--albums">
        ${albums.map(album => `
          <div class="card album-card" onclick="app.showAlbum('${album.name}')">
            <div class="card__image" style="background-image: url(''); background-size: cover;"></div>
            <h3 class="card__title">${Utils.escapeHtml(album.displayName)}</h3>
            <div class="card__meta">
              <span>${album.imageCount} images</span>
              <span>${Utils.formatDate(album.lastUpdated)}</span>
            </div>
          </div>
        `).join('')}
        
        <div class="card album-card album-card--new" onclick="app.createNewAlbum()">
          <div class="card__image" style="display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 32px;">+</span>
          </div>
          <h3 class="card__title">New Album</h3>
        </div>
      </div>
    `;
    
    document.getElementById('homeScreen').innerHTML = grid;
  }
  
  async showAlbum(albumName) {
    console.log('Showing album:', albumName);
    this.currentScreen = 'album';
    this.state.albums.selected = albumName;
    
    const albumScreen = document.getElementById('albumScreen');
    albumScreen.innerHTML = '<div class="loading">Loading images...</div>';
    albumScreen.classList.remove('hidden');
    
    document.getElementById('homeScreen')?.classList.add('hidden');
    document.getElementById('lightboxScreen')?.classList.add('hidden');
    
    try {
      const imagesResponse = await this.api.listImages(albumName);
      
      const images = imagesResponse
        .filter(item => 
          item.type === 'file' && 
          /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(item.name)
        )
        .map(img => ({
          name: img.name,
          path: img.path,
          size: img.size,
          downloadUrl: img.download_url,
          sha: img.sha
        }));
      
      this.state.images.all = images;
      this.renderImageGrid(images, albumName);
      
    } catch (error) {
      console.error('Error loading images:', error);
      Notify.error('Failed to load images');
    }
  }
  
  renderImageGrid(images, albumName) {
    const grid = `
      <div class="screen-header">
        <button class="btn btn--secondary" onclick="app.showHomeScreen()">← Back</button>
        <h2>${Utils.formatAlbumName(albumName)}</h2>
        <span>${images.length} images</span>
      </div>
      
      <div class="grid grid--images">
        ${images.map((img, idx) => `
          <div class="card image-card" onclick="app.showLightbox(${idx})">
            <img src="${img.downloadUrl}" alt="${img.name}" class="card__image" loading="lazy">
            <p class="card__title">${Utils.escapeHtml(img.name)}</p>
            <div class="card__meta">
              <span>${(img.size / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    document.getElementById('albumScreen').innerHTML = grid;
  }
  
  showLightbox(imageIndex) {
    console.log('Opening lightbox for image:', imageIndex);
    this.currentScreen = 'lightbox';
    this.state.images.selected = imageIndex;
    this.state.ui.lightboxOpen = true;
    
    const img = this.state.images.all[imageIndex];
    const albumName = this.state.albums.selected;
    
    const lightbox = `
      <div class="lightbox">
        <button class="lightbox__close" onclick="app.closeLightbox()">✕</button>
        
        <button class="lightbox__prev" onclick="app.prevImage()">◀</button>
        
        <img src="${img.downloadUrl}" alt="${img.name}" class="lightbox__image">
        
        <button class="lightbox__next" onclick="app.nextImage()">▶</button>
        
        <div class="lightbox__info">
          <h3>${Utils.escapeHtml(img.name)}</h3>
          <p>Image ${imageIndex + 1} of ${this.state.images.all.length}</p>
          <p>Size: ${(img.size / 1024 / 1024).toFixed(1)} MB</p>
          
          <div class="lightbox__actions">
            <button class="btn btn--primary" onclick="app.downloadImage('${img.downloadUrl}', '${img.name}')">
              Download
            </button>
            <button class="btn btn--secondary" onclick="app.shareImage()">
              Share
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('lightboxScreen').innerHTML = lightbox;
    document.getElementById('lightboxScreen').classList.remove('hidden');
    document.getElementById('albumScreen')?.classList.add('hidden');
  }
  
  toggleTheme() {
    const newTheme = this.state.ui.theme === 'light' ? 'dark' : 'light';
    this.state.ui.theme = newTheme;
    this.applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    Notify.info(`Switched to ${newTheme} mode`);
  }
  
  applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }
  
  toggleMobileMenu() {
    this.state.ui.mobileMenuOpen = !this.state.ui.mobileMenuOpen;
    document.getElementById('mobileMenu').classList.toggle('open');
  }
  
  logout() {
    if (confirm('Are you sure you want to logout?')) {
      Storage.clearToken();
      this.state.auth.isAuthenticated = false;
      this.api = null;
      this.showLoginScreen();
      Notify.info('Logged out');
    }
  }
  
  downloadImage(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    Notify.success('Download started');
  }
  
  shareImage() {
    const img = this.state.images.all[this.state.images.selected];
    const shareUrl = `${window.location.origin}${window.location.pathname}?album=${this.state.albums.selected}&image=${img.name}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      Notify.success('Link copied to clipboard');
    });
  }
  
  closeLightbox() {
    this.state.ui.lightboxOpen = false;
    document.getElementById('lightboxScreen').classList.add('hidden');
    document.getElementById('albumScreen').classList.remove('hidden');
    this.currentScreen = 'album';
  }
  
  prevImage() {
    if (this.state.images.selected > 0) {
      this.showLightbox(this.state.images.selected - 1);
    }
  }
  
  nextImage() {
    if (this.state.images.selected < this.state.images.all.length - 1) {
      this.showLightbox(this.state.images.selected + 1);
    }
  }
  
  async showUploadModal() {
    // Upload modal logic
  }
  
  async showSettingsModal() {
    // Settings modal logic
  }
  
  async refreshCurrentScreen() {
    if (this.currentScreen === 'home') {
      await this.showHomeScreen();
    } else if (this.currentScreen === 'album') {
      await this.showAlbum(this.state.albums.selected);
    }
  }
  
  async createNewAlbum() {
    const name = prompt('Enter album name:');
    if (name) {
      // Create album logic
    }
  }
  
  filterAndRender() {
    // Filter albums/images based on search query
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new GalleryApp(CONFIG);
});
```

---

## DETAILED FEATURE IMPLEMENTATION

### 1. Upload System - Complete Flow

```javascript
class UploadManager {
  constructor(api, appState) {
    this.api = api;
    this.appState = appState;
    this.uploadQueue = [];
    this.currentUploads = new Map();
    this.maxConcurrent = 3;
  }
  
  async handleFileSelection(files) {
    // 1. Validate files
    const validFiles = [];
    const errors = [];
    
    for (const file of files) {
      // Check size
      if (file.size > 10 * 1024 * 1024) { // 10MB
        errors.push(`${file.name} is too large (max 10MB)`);
        continue;
      }
      
      // Check type
      if (!this.isSupportedFormat(file.type, file.name)) {
        errors.push(`${file.name} is not a supported format`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (errors.length > 0) {
      Notify.error(errors.join('\n'));
    }
    
    return validFiles;
  }
  
  isSupportedFormat(mimeType, filename) {
    const supported = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return supported.includes(mimeType) || /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  }
  
  async uploadFiles(files, albumName) {
    // 2. Create album if new
    if (!this.appState.albums.all.find(a => a.name === albumName)) {
      await this.createAlbum(albumName);
    }
    
    // 3. Queue uploads
    for (const file of files) {
      const uploadTask = {
        file: file,
        albumName: albumName,
        progress: 0,
        status: 'pending',
        error: null
      };
      
      this.uploadQueue.push(uploadTask);
    }
    
    // 4. Process queue
    await this.processUploadQueue();
  }
  
  async processUploadQueue() {
    while (this.uploadQueue.length > 0 || this.currentUploads.size > 0) {
      // Fill up to maxConcurrent
      while (this.uploadQueue.length > 0 && this.currentUploads.size < this.maxConcurrent) {
        const task = this.uploadQueue.shift();
        this.uploadFile(task);
      }
      
      // Wait for one to complete
      if (this.currentUploads.size > 0) {
        await Promise.race(Array.from(this.currentUploads.values()));
      }
      
      // Emit progress update
      this.emit('progress-update');
    }
    
    Notify.success('All uploads complete!');
    this.emit('uploads-complete');
  }
  
  async uploadFile(task) {
    const taskId = Math.random().toString(36);
    const promise = this._doUpload(task, taskId);
    this.currentUploads.set(taskId, promise);
    
    try {
      await promise;
    } finally {
      this.currentUploads.delete(taskId);
    }
  }
  
  async _doUpload(task, taskId) {
    try {
      task.status = 'uploading';
      
      const reader = new FileReader();
      const data = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(task.file);
      });
      
      // Sanitize filename
      const filename = this.sanitizeFilename(task.file.name);
      
      // Upload
      await this.api.uploadImage(task.albumName, filename, data);
      
      task.status = 'completed';
      task.progress = 100;
      
      Notify.success(`Uploaded ${filename}`);
      
    } catch (error) {
      task.status = 'error';
      task.error = error.message;
      Notify.error(`Failed to upload ${task.file.name}`);
    }
  }
  
  sanitizeFilename(filename) {
    // Remove special characters, keep only alphanumeric, dash, underscore
    let cleaned = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Avoid duplicates by adding timestamp
    const name = cleaned.split('.')[0];
    const ext = cleaned.split('.').pop();
    return `${name}_${Date.now()}.${ext}`;
  }
  
  async createAlbum(name) {
    // Create .gitkeep file to create folder
    try {
      await this.api.request('PUT', `/repos/${this.api.owner}/${this.api.privateRepo}/contents/albums/${name}/.gitkeep`, {
        message: `Create album: ${name}`,
        content: '',
        branch: 'main'
      });
      
      // Add to state
      this.appState.albums.all.push({
        name: name,
        displayName: Utils.formatAlbumName(name),
        imageCount: 0,
        lastUpdated: new Date().toISOString()
      });
      
      Notify.success(`Album '${name}' created`);
    } catch (error) {
      throw new Error(`Failed to create album: ${error.message}`);
    }
  }
  
  emit(event) {
    document.dispatchEvent(new CustomEvent(`upload:${event}`, {
      detail: {
        totalFiles: this.uploadQueue.length + this.currentUploads.size,
        completedFiles: 0,
        failedFiles: 0
      }
    }));
  }
}
```

---

### 2. Image Lazy Loading Implementation

```javascript
class LazyImageLoader {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.images = [];
    this.observer = null;
    this.init();
  }
  
  init() {
    // Use IntersectionObserver for lazy loading
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '50px',
      threshold: 0.01
    });
    
    // Observe all images
    this.container.querySelectorAll('img[data-lazy]').forEach(img => {
      this.observer.observe(img);
    });
  }
  
  loadImage(img) {
    const src = img.dataset.src;
    const placeholder = img.dataset.placeholder || 'data:image/svg+xml...';
    
    const realImg = new Image();
    realImg.onload = () => {
      img.src = src;
      img.removeAttribute('data-lazy');
      img.removeAttribute('data-src');
      this.observer.unobserve(img);
    };
    realImg.onerror = () => {
      img.src = placeholder;
      console.error(`Failed to load: ${src}`);
    };
    realImg.src = src;
  }
  
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Usage in HTML:
// <img data-lazy data-src="https://..." data-placeholder="..." class="card__image">
```

---

### 3. Responsive Image Grid

```css
/* Responsive grid with auto-fit */
.grid--images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--space-lg);
  padding: var(--space-lg);
  max-width: 1200px;
  margin: 0 auto;
}

@media (min-width: 640px) {
  .grid--images {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}

@media (min-width: 768px) {
  .grid--images {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}

@media (min-width: 1024px) {
  .grid--images {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}

.card__image {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: var(--radius-md);
  background: var(--color-light-gray);
  transition: transform var(--transition-normal);
}

.image-card:hover .card__image {
  transform: scale(1.05);
}
```

---

### 4. Mobile Touch Gestures in Lightbox

```javascript
class LightboxGestureHandler {
  constructor(lightboxElement) {
    this.element = lightboxElement;
    this.touchStart = { x: 0, y: 0 };
    this.touchEnd = { x: 0, y: 0 };
    this.setup();
  }
  
  setup() {
    this.element.addEventListener('touchstart', (e) => {
      this.touchStart = {
        x: e.changedTouches[0].screenX,
        y: e.changedTouches[0].screenY,
        time: Date.now()
      };
    });
    
    this.element.addEventListener('touchend', (e) => {
      this.touchEnd = {
        x: e.changedTouches[0].screenX,
        y: e.changedTouches[0].screenY,
        time: Date.now()
      };
      this.handleSwipe();
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (app.state.ui.lightboxOpen) {
        if (e.key === 'ArrowLeft') app.prevImage();
        if (e.key === 'ArrowRight') app.nextImage();
        if (e.key === 'Escape') app.closeLightbox();
      }
    });
  }
  
  handleSwipe() {
    const deltaX = this.touchEnd.x - this.touchStart.x;
    const deltaTime = this.touchEnd.time - this.touchStart.time;
    
    // Must be fast enough (< 500ms) and far enough (> 50px)
    if (Math.abs(deltaX) > 50 && deltaTime < 500) {
      if (deltaX > 0) {
        // Swiped right → previous image
        app.prevImage();
      } else {
        // Swiped left → next image
        app.nextImage();
      }
    }
  }
}
```

---

## RESPONSIVE DESIGN SYSTEM

### Mobile-First Approach

```css
/* BASE (Mobile First) */
:root {
  --header-height: 56px;
  --footer-height: 60px;
  --main-padding: var(--space-lg);
}

body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
  overflow-y: auto;
  padding-bottom: var(--footer-height);
}

.header {
  position: fixed;
  top: 0;
  width: 100%;
  height: var(--header-height);
  z-index: 100;
}

body {
  padding-top: var(--header-height);
}

.action-bar {
  position: fixed;
  bottom: 0;
  width: 100%;
  height: var(--footer-height);
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: var(--color-white);
  border-top: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
}

/* TABLET (768px) */
@media (min-width: 768px) {
  :root {
    --main-padding: var(--space-xl);
  }
  
  .action-bar {
    display: none;  /* Use header buttons instead */
  }
  
  main {
    padding-bottom: 0;  /* Remove footer padding */
  }
  
  .header {
    position: sticky;
  }
  
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* DESKTOP (1024px) */
@media (min-width: 1024px) {
  :root {
    --main-padding: var(--space-2xl);
  }
  
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .header__center {
    display: flex;  /* Show search on desktop */
  }
}

/* LARGE DESKTOP (1280px) */
@media (min-width: 1280px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  main {
    max-width: 1400px;
    margin: 0 auto;
  }
}
```

---

## PERFORMANCE OPTIMIZATION

### 1. Image Optimization Strategy

```javascript
class ImageOptimizer {
  // Generate WebP versions (server-side or client-side)
  static async optimizeImage(file) {
    // Option 1: Use browser's canvas to compress
    const canvas = await this.compressImage(file);
    
    // Option 2: Convert to WebP if supported
    if (this.supportsWebP()) {
      return this.canvasToWebP(canvas);
    }
    
    // Fallback: JPEG
    return this.canvasToJPEG(canvas);
  }
  
  static async compressImage(file, maxWidth = 2048, maxHeight = 2048, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          resolve(canvas);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
  
  static supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
  }
  
  static canvasToWebP(canvas) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.8);
    });
  }
  
  static canvasToJPEG(canvas) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.85);
    });
  }
}
```

### 2. Caching Strategy

```javascript
class CacheManager {
  static CACHE_DURATION = {
    ALBUMS: 5 * 60 * 1000,      // 5 minutes
    IMAGES: 10 * 60 * 1000,     // 10 minutes
    METADATA: 30 * 60 * 1000,   // 30 minutes
    RATE_LIMIT: 60 * 1000       // 1 minute
  };
  
  static setCache(key, data, duration = CACHE_DURATION.ALBUMS) {
    const cache = {
      data: data,
      timestamp: Date.now(),
      expiry: Date.now() + duration
    };
    localStorage.setItem(`cache:${key}`, JSON.stringify(cache));
  }
  
  static getCache(key) {
    const cached = localStorage.getItem(`cache:${key}`);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    if (Date.now() > parsed.expiry) {
      localStorage.removeItem(`cache:${key}`);
      return null;
    }
    
    return parsed.data;
  }
  
  static clearCache(key = null) {
    if (key) {
      localStorage.removeItem(`cache:${key}`);
    } else {
      // Clear all caches
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k.startsWith('cache:')) {
          localStorage.removeItem(k);
        }
      });
    }
  }
}
```

### 3. Request Debouncing

```javascript
class RequestDebouncer {
  static debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
  
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Usage
const debouncedSearch = RequestDebouncer.debounce((query) => {
  filterAlbums(query);
}, 300);

document.getElementById('search').addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});
```

---

## DEPLOYMENT & CONFIGURATION

### GitHub Pages Deployment Checklist

```markdown
1. CREATE PUBLIC REPOSITORY
   [ ] Create new public repo: `username/gallery-app`
   [ ] Clone to local machine
   [ ] Create `index.html`, `style.css`, `app.js` files
   [ ] Commit and push to main branch

2. ENABLE GITHUB PAGES
   [ ] Go to Settings → Pages
   [ ] Source: Deploy from a branch
   [ ] Branch: main (or docs/ folder)
   [ ] Save

3. VERIFY DEPLOYMENT
   [ ] Wait 1-2 minutes
   [ ] Visit https://username.github.io/gallery-app
   [ ] Check console for errors

4. CREATE PRIVATE REPOSITORY
   [ ] Create new private repo: `username/gallery-images`
   [ ] Create `albums/` folder (via .gitkeep file)
   [ ] Keep empty for now (users will upload images)

5. GENERATE PERSONAL ACCESS TOKEN
   [ ] Go to Settings → Developer settings → Personal access tokens
   [ ] Click "Tokens (classic)"
   [ ] Generate new token
   [ ] Permissions: `repo` (full control of private repos)
   [ ] Copy token (shown only once!)
   [ ] Share with users or paste into app

6. UPDATE CONFIG.JS
   [ ] Update `owner` with GitHub username
   [ ] Update `publicRepo` with actual repo name
   [ ] Update `privateRepo` with actual repo name
   [ ] Commit and push

7. TEST
   [ ] Open app: https://username.github.io/gallery-app
   [ ] Paste token from step 5
   [ ] Click Authenticate
   [ ] Should redirect to home (no albums yet)
   [ ] Upload test images
   [ ] Verify images appear in gallery
   [ ] Check private repo - images should be there
```

### config.js Template

```javascript
// config.js
const CONFIG = {
  // GitHub Configuration
  owner: 'your-username',                    // Your GitHub username
  publicRepo: 'gallery-app',                 // Public app repository
  privateRepo: 'gallery-images',             // Private images repository
  
  // API Configuration
  apiBase: 'https://api.github.com',
  apiVersion: '2022-11-28',
  
  // Feature Flags
  features: {
    uploadEnabled: true,
    downloadEnabled: true,
    deleteEnabled: true,
    shareEnabled: true,
    darkModeEnabled: true,
    searchEnabled: true,
    lazLoadingEnabled: true
  },
  
  // File Configuration
  files: {
    maxFileSize: 10 * 1024 * 1024,           // 10MB
    maxTotalSize: 100 * 1024 * 1024,         // 100MB per session
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']
  },
  
  // Upload Configuration
  upload: {
    maxConcurrentUploads: 3,
    chunkSize: 1024 * 1024,                  // 1MB chunks
    autoCompress: true,
    compressQuality: 0.85,
    generateThumbnails: true
  },
  
  // Cache Configuration
  cache: {
    enabled: true,
    albumsTTL: 5 * 60 * 1000,                // 5 minutes
    imagesTTL: 10 * 60 * 1000,               // 10 minutes
    metadataTTL: 30 * 60 * 1000              // 30 minutes
  },
  
  // UI Configuration
  ui: {
    theme: 'light',                          // 'light' or 'dark'
    itemsPerPage: 24,
    albumGridColumns: 3,
    imageGridColumns: 4,
    animationsEnabled: true
  },
  
  // Rate Limiting
  rateLimit: {
    checkInterval: 1000,
    warningThreshold: 100,                   // Warn when remaining < 100
    retryAttempts: 3,
    retryDelay: 5000                        // 5 seconds
  },
  
  // Logging
  logging: {
    enabled: true,
    level: 'info',                           // 'debug', 'info', 'warn', 'error'
    logToConsole: true,
    logToLocalStorage: false
  }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
```

---

## TESTING STRATEGY

### Unit Tests (Local File Tests)

```javascript
// test.js - Simple test runner

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }
  
  test(name, fn) {
    this.tests.push({ name, fn });
  }
  
  async run() {
    console.log('🧪 Running tests...\n');
    
    for (const test of this.tests) {
      try {
        await test.fn();
        this.passed++;
        console.log(`✅ ${test.name}`);
      } catch (error) {
        this.failed++;
        console.error(`❌ ${test.name}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
  }
}

const runner = new TestRunner();

// Test: Filename sanitization
runner.test('Sanitize filename removes special chars', () => {
  const uploadMgr = new UploadManager();
  const result = uploadMgr.sanitizeFilename('photo@#$%.jpg');
  if (!result.includes('@')) {
    return;  // Pass
  }
  throw new Error('Special chars not removed');
});

// Test: Image format detection
runner.test('Detect supported image formats', () => {
  const uploadMgr = new UploadManager();
  const supported = ['image/jpeg', 'image/png', 'image/gif'];
  supported.forEach(mime => {
    if (!uploadMgr.isSupportedFormat(mime, 'test.jpg')) {
      throw new Error(`Format not supported: ${mime}`);
    }
  });
});

// Test: Cache expiry
runner.test('Cache expires after TTL', () => {
  CacheManager.setCache('test', { data: 'test' }, 100);  // 100ms TTL
  const cached = CacheManager.getCache('test');
  if (!cached) throw new Error('Cache not set');
  
  setTimeout(() => {
    const expired = CacheManager.getCache('test');
    if (expired !== null) throw new Error('Cache did not expire');
  }, 150);
});

// Run tests
runner.run();
```

### Manual Testing Checklist

```markdown
## AUTHENTICATION TESTS
- [ ] User can paste token
- [ ] Invalid token shows error
- [ ] Valid token authenticates successfully
- [ ] Token persists across page reload
- [ ] Logout clears token

## ALBUM TESTS
- [ ] Albums load from private repo
- [ ] Album names display correctly
- [ ] Album images count is correct
- [ ] Clicking album shows images
- [ ] Back button returns to home

## IMAGE TESTS
- [ ] Images load correctly
- [ ] Lazy loading works
- [ ] Clicking image opens lightbox
- [ ] Lightbox navigation works (prev/next)
- [ ] Download button downloads image
- [ ] Share button copies link

## UPLOAD TESTS
- [ ] File picker works
- [ ] Drag & drop works
- [ ] File validation shows errors
- [ ] Progress bar updates
- [ ] Uploaded images appear in gallery
- [ ] Multiple concurrent uploads work

## RESPONSIVE TESTS
- [ ] Mobile layout (< 480px)
- [ ] Tablet layout (480px - 768px)
- [ ] Desktop layout (> 768px)
- [ ] Touch gestures work on mobile
- [ ] Header/footer reposition correctly
- [ ] Images scale properly

## ACCESSIBILITY TESTS
- [ ] Keyboard navigation (Tab, Enter, Escape, Arrows)
- [ ] Screen reader announcements
- [ ] Alt text on images
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA

## PERFORMANCE TESTS
- [ ] Home page loads < 2s
- [ ] Album page loads < 1s
- [ ] 100+ albums load smoothly
- [ ] 1000+ images scroll smoothly
- [ ] API requests are debounced
- [ ] Cache invalidates correctly

## SECURITY TESTS
- [ ] Token not logged in console
- [ ] Token not sent to external services
- [ ] XSS prevention (no innerHTML)
- [ ] CSRF tokens (if needed)
- [ ] Input validation works
```

---

## SECURITY CHECKLIST

✅ **Authentication & Authorization**
- [ ] Personal Access Token validated on each request
- [ ] Token stored in localStorage only (encrypted in future versions)
- [ ] Token has expiry mechanism
- [ ] Logout clears all sensitive data
- [ ] CORS properly configured

✅ **Data Security**
- [ ] All API calls use HTTPS
- [ ] No sensitive data in URL parameters
- [ ] Request/response headers checked
- [ ] Rate limit headers monitored

✅ **Input Validation**
- [ ] Filenames sanitized (alphanumeric + dash/underscore)
- [ ] Album names validated (no special chars)
- [ ] File types validated (magic number check)
- [ ] File sizes validated before upload
- [ ] User inputs escaped before display

✅ **Output Encoding**
- [ ] No innerHTML used (only textContent)
- [ ] JSON responses validated
- [ ] HTML entities escaped
- [ ] URLs properly encoded

✅ **Error Handling**
- [ ] Errors don't expose sensitive info
- [ ] User-friendly error messages
- [ ] Technical errors logged locally
- [ ] Rate limit errors handled gracefully
- [ ] Network errors retried automatically

---

## DEVELOPMENT TIMELINE

### Phase 1: MVP (Weeks 1-3)

**Week 1: Setup & Authentication**
- [ ] Create public & private repos
- [ ] Build HTML structure
- [ ] Implement login screen
- [ ] Create auth.js module
- [ ] Test token validation

**Week 2: Core Features**
- [ ] Implement album listing
- [ ] Implement image grid
- [ ] Build lightbox viewer
- [ ] Add navigation between screens
- [ ] Deploy to GitHub Pages

**Week 3: Upload & Polish**
- [ ] Build upload modal
- [ ] Implement file upload
- [ ] Add progress tracking
- [ ] Polish UI/styling
- [ ] Test on mobile

### Phase 2: Enhancement (Weeks 4-5)

- [ ] Advanced search/filter
- [ ] Image compression
- [ ] Metadata support
- [ ] Share links
- [ ] Dark mode

### Phase 3: Advanced (Weeks 6+)

- [ ] Video support
- [ ] Batch operations
- [ ] Analytics
- [ ] Admin panel
- [ ] Cloudflare Workers integration

---

## FINAL CHECKLIST

- [ ] All code follows ES6+ standards
- [ ] No console errors in browser
- [ ] Mobile responsive (<480px, 480-768px, >768px)
- [ ] Keyboard navigation works
- [ ] Touch gestures work on mobile
- [ ] All API calls handle errors
- [ ] Rate limiting implemented
- [ ] Caching works correctly
- [ ] localStorage cleaned on logout
- [ ] Images lazy load correctly
- [ ] Upload queue works
- [ ] Token never exposed in UI
- [ ] README documentation complete
- [ ] GitHub Pages deployed successfully

---

## QUESTIONS & SUPPORT

**For setup help:**
1. Create GitHub Personal Access Token: Settings → Developer → PAT
2. Ensure private repo has `albums/` folder
3. Update `config.js` with correct repo names

**For troubleshooting:**
- Check browser console (F12) for errors
- Check API rate limit: `/rate_limit` endpoint
- Verify token is still valid
- Clear localStorage if stuck

---

**Document Status**: ✅ COMPLETE & PRODUCTION READY  
**Version**: 2.0  
**Last Updated**: 2026-06-14  
**Maintained By**: Technical Architecture Team

---