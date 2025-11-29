# 🧰 Work Suite - Product Review

A comprehensive review of the Work Suite platform architecture, features, and capabilities.

---

## Product Overview

**Work Suite** is an AI-friendly productivity platform consisting of 8 lightweight, single-file web applications designed for developers and power users who prefer text-based workflows.

### Core Philosophy

| Traditional Tools | Work Suite Approach |
|-------------------|---------------------|
| Complex binary formats (.docx, .pptx) | Simple text formats (Markdown, JSON, CSV) |
| Heavy dependencies & build systems | Single HTML files, zero setup |
| Proprietary ecosystems | Open, portable, self-contained |
| Hard for LLMs to parse/generate | Easy for AI to read, write, and modify |

---

## The 8 Applications

### 1. 📝 Slate — Keyboard-First Notes

A fast, keyboard-driven notes app with tile UI for power users.

| Feature | Description |
|---------|-------------|
| Navigation | 100% keyboard navigable (no mouse required) |
| Views | Grid/list view with instant search |
| Commands | Command palette (`⌘K`) |
| Persistence | Auto-save while typing |
| Organization | Tags for categorization |

**Format:** Markdown content, JSON metadata

**Keyboard Shortcuts:**
| Key | Action |
|-----|--------|
| `N` | New note |
| `/` | Focus search |
| `↑↓←→` | Navigate tiles |
| `Enter` | Open selected note |
| `G` / `L` | Grid / List view |
| `⌘K` | Command palette |
| `Esc` | Close / Clear |

---

### 2. ✅ Done — Kanban Task Board

A Trello-style board for organizing tasks across columns.

| Feature | Description |
|---------|-------------|
| Cards | Drag-and-drop between columns |
| Labels | Color-coded task categorization |
| Due Dates | Task deadline tracking |
| Themes | 5 visual themes |
| Export | Save/load as `.done` JSON files |

**Format:** JSON (board structure), Markdown (card descriptions)

**Card Structure:**
```json
{
  "id": "card_1",
  "title": "Task name",
  "description": "Markdown description",
  "due": "2024-12-01",
  "labels": ["#3b82f6", "#10b981"]
}
```

---

### 3. 🛤️ Journey — Timeline Creator

Create beautiful visual timelines for projects, histories, or roadmaps.

| Feature | Description |
|---------|-------------|
| Layouts | Vertical and horizontal orientations |
| Events | Icons, titles, dates, descriptions |
| Themes | 6 visual themes (Amber, Emerald, Violet, Rose, Sky, Minimal) |
| Export | Standalone HTML export |

**Format:** JSON (timeline data)

**Event Structure:**
```json
{
  "id": 1,
  "date": "Q1 2024",
  "title": "Project Launch",
  "description": "Initial release to the public",
  "icon": "🚀"
}
```

---

### 4. 🐠 Merman — Markdown & Mermaid Editor

A split-pane editor for Markdown documents with live diagram rendering.

| Feature | Description |
|---------|-------------|
| Preview | Live preview with syntax highlighting |
| Diagrams | Mermaid diagram support (flowcharts, sequences, etc.) |
| Smart Paste | Auto-wraps pasted Mermaid syntax |
| Themes | Dark/light themes |
| Input | Drag-and-drop file loading |

**Format:** Markdown with `mermaid` code blocks

**Supported Diagrams:**
- Flowchart (`graph TD`)
- Sequence diagram
- Class diagram
- State diagram
- ER diagram
- Gantt chart
- Pie chart

---

### 5. 📊 Metric — Spreadsheet & Charts

A lightweight spreadsheet with formulas and data visualization.

| Feature | Description |
|---------|-------------|
| Grid | 50 rows × 26 columns |
| Formulas | `SUM`, `AVG`, `MIN`, `MAX`, `COUNT`, `ROUND`, `SQRT`, `POW` |
| Charts | Bar, Line, Pie, Doughnut |
| Stats | Quick stats panel |
| Export | CSV export |

**Format:** JSON (cell data), CSV (export)

**Formula Syntax:**
```
=SUM(A1:A10)
=AVG(B1:B5)
=IF(A1>10, "High", "Low")
```

---

### 6. 👆 Pointer — Markdown Slide Presenter

Create presentations from Markdown with multiple layouts and themes.

| Feature | Description |
|---------|-------------|
| Layouts | 8 slide layouts (Title, Content, Two-Column, Quote, Code, Section, Image-Left, Image-Right) |
| Themes | 8 visual themes (Midnight, Aurora, Sunset, Ocean, Forest, Minimal, Paper, Neon) |
| Present | Fullscreen presentation mode |
| Navigation | Keyboard controls |

**Format:** Markdown (slides), JSON (deck structure)

**Slide Layouts:**
| Layout | Use Case |
|--------|----------|
| `title` | Opening/closing slides |
| `content` | Standard bullet points |
| `two-column` | Side-by-side content |
| `quote` | Highlighted quotations |
| `code` | Code snippets |
| `section` | Section dividers |

---

### 7. 🎨 Theme Designer — Custom Theme Creator

Create custom color themes from images for all Work Suite apps.

| Feature | Description |
|---------|-------------|
| Color Extraction | Extract palette from uploaded images |
| Fonts | Google Fonts integration |
| Preview | Live preview with sample content |
| Export | Save to theme library |

**Format:** JSON (theme definition)

**Theme Structure:**
```json
{
  "name": "Ocean Breeze",
  "colors": {
    "background": "#0a1628",
    "surface": "#1a2a3f",
    "text": "#e8f1f8",
    "heading": "#ffffff",
    "accent": "#3b82f6"
  },
  "fonts": {
    "heading": "Space Grotesk",
    "body": "Inter"
  }
}
```

---

### 8. 🏷️ Tags — File Manager

Central hub for all Work Suite content with organization features.

| Feature | Description |
|---------|-------------|
| Organization | Folders, tags, status workflow |
| Scopes | Me (private), Us (shared), We (team), There (external) |
| Selection | Multi-select with bulk operations |
| UI | Collapsible sidebar sections |
| Views | Grid and list views |

**Format:** SQLite database via API

**Status Workflow:**
```
Backlog → In Progress → Done → Closed
```

**Access Scopes:**
| Scope | Icon | Access |
|-------|------|--------|
| Me | 👤 | Owner only |
| Us | 👥 | Explicit invite |
| We | 🏢 | Team default |
| There | 🌐 | Public/external |

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Work Suite Platform                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Frontend (Static HTML)                    │   │
│  │  ┌────────┬────────┬────────┬────────┬────────┬────────┐   │   │
│  │  │ Slate  │  Done  │Journey │ Merman │ Metric │Pointer │   │   │
│  │  │(.html) │(.html) │(.html) │(.html) │(.html) │(.html) │   │   │
│  │  └────────┴────────┴────────┴────────┴────────┴────────┘   │   │
│  │  ┌────────────────────┬─────────────────────────────────┐   │   │
│  │  │ Theme Designer     │           Tags (File Manager)   │   │   │
│  │  └────────────────────┴─────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │        Shared Theme System (content-themes.js)       │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Nginx Reverse Proxy (:8500)              │   │
│  │  • Serves static HTML files                                  │   │
│  │  • Proxies /api/* → API server                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Work Suite API (:3000)                   │   │
│  │  • Node.js + Express                                        │   │
│  │  • SQLite (better-sqlite3)                                  │   │
│  │  • JWT Authentication                                       │   │
│  │  • WebSocket for real-time sync                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│              ┌───────────────┼───────────────┐                     │
│              ▼               ▼               ▼                     │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐            │
│  │   Authentik   │ │   Service-0   │ │   SQLite DB   │            │
│  │   (SSO/IdP)   │ │   (Platform)  │ │   (Storage)   │            │
│  │   :9500       │ │   :8001       │ │  worksuite.db │            │
│  └───────────────┘ └───────────────┘ └───────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

### Deployment Stack (Docker Compose)

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| `worksuite-web` | 8500 | Nginx Alpine | Static HTML + reverse proxy |
| `worksuite-api` | 8501 (internal 3000) | Node.js 20 | API with SQLite |

### Storage Structure (ZFS)

```
/zfs/data/work_suite/
├── worksuite.db       # SQLite database
│   ├── users          # User accounts
│   ├── items          # All content items
│   ├── tags           # Tag definitions
│   ├── item_tags      # Item-tag relationships
│   ├── shares         # Sharing permissions
│   └── themes         # Custom themes
│
├── files/             # User-uploaded files
│   ├── me/            # Private scope
│   ├── us/            # Shared scope
│   ├── we/            # Team scope
│   └── there/         # External/public scope
│
└── app/               # Git-tracked application files
    ├── *.html         # App files
    ├── themes/        # Theme system
    └── docker/        # Container configuration
```

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/login` | Initiate OAuth2 flow with Authentik |
| `GET` | `/api/auth/callback` | OAuth2 callback handler |
| `GET` | `/api/auth/session` | Get current session info |
| `GET` | `/api/auth/logout` | Logout (redirects to Authentik) |
| `POST` | `/api/auth/logout` | Logout (JSON response) |
| `POST` | `/api/auth/register` | Register local account |
| `POST` | `/api/auth/login-local` | Login with email/password |

### Content Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/items` | List items (filter: scope, folder, app, status, tag) |
| `GET` | `/api/items/:id` | Get single item with tags |
| `POST` | `/api/items` | Create new item |
| `PUT` | `/api/items/:id` | Update item |
| `DELETE` | `/api/items/:id` | Delete item |

### LLM API (AI Integration)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/llm/help` | Full API documentation for LLMs |
| `GET` | `/api/llm/schema/:app` | JSON schema for app content |
| `GET` | `/api/llm/example/:app` | Example content for app |
| `POST` | `/api/llm/content/:app` | Create content for specific app |
| `GET` | `/api/llm/content/:id` | Get content by ID |
| `PUT` | `/api/llm/content/:id` | Update content |
| `DELETE` | `/api/llm/content/:id` | Delete content |

### File Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/llm/files` | List files with filters |
| `POST` | `/api/llm/files` | Create file with metadata |
| `GET` | `/api/llm/files/:id` | Get file with content |
| `PUT` | `/api/llm/files/:id` | Update file metadata |
| `PUT` | `/api/llm/files/:id/content` | Update file content only |
| `DELETE` | `/api/llm/files/:id` | Delete file |

### Organization

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/llm/folders` | List all folders |
| `GET` | `/api/llm/tags` | List all tags with counts |
| `POST` | `/api/llm/files/:id/tags` | Add tags to file |
| `PUT` | `/api/llm/files/:id/move` | Move file to folder/scope |
| `GET` | `/api/llm/search` | Full-text search |

### Batch Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/llm/batch/create` | Create multiple files |
| `POST` | `/api/llm/batch/update` | Update multiple files |
| `POST` | `/api/llm/batch/move` | Move multiple files |
| `POST` | `/api/llm/batch/tag` | Tag multiple files |

### Workspaces (Service-0 Integration)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/workspaces` | Get user's workspaces |
| `POST` | `/api/workspaces` | Create new workspace |
| `GET` | `/api/workspaces/:id` | Get workspace details |
| `POST` | `/api/objects` | Register object with Service-0 |
| `GET` | `/api/objects` | Get workspace objects |

### Themes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/themes` | List available themes |
| `POST` | `/api/themes` | Create new theme |
| `GET` | `/api/llm/themes` | List themes (LLM format) |
| `POST` | `/api/llm/themes` | Create theme (LLM format) |

---

## Data Model

### Universal Document Structure

```javascript
{
  // Identity
  id: "uuid",
  name: "Document Name",
  type: "file",
  app: "pointer" | "slate" | "done" | "journey" | "merman" | "metric" | "theme",
  
  // Access Control
  scope: "me" | "us" | "we" | "there",
  owner_id: "user-uuid",
  workspace_id: "workspace-uuid",        // Service-0 workspace
  service0_object_id: "object-uuid",     // Cross-service reference
  
  // Organization
  folder: "Projects/2024",
  status: "backlog" | "in-progress" | "done" | "closed",
  tags: ["tag1", "tag2"],
  
  // Content
  content: "{ ... }",                    // JSON string, app-specific
  file_path: "me/uploads/file.pdf",      // For uploaded files
  
  // Metadata
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T11:45:00Z"
}
```

### App-Specific Content Schemas

#### Slate (Notes)
```json
{
  "title": "Meeting Notes",
  "content": "# Meeting\n\nDiscussion points...",
  "tags": ["meetings", "planning"]
}
```

#### Done (Kanban)
```json
{
  "title": "Sprint 42",
  "theme": "slate",
  "columns": [
    {
      "id": "todo",
      "title": "To Do",
      "cards": [
        {
          "id": "card_1",
          "title": "Review PRs",
          "description": "Check pending pull requests",
          "due": "2024-12-01",
          "labels": ["#3b82f6"]
        }
      ]
    }
  ]
}
```

#### Journey (Timeline)
```json
{
  "title": "Project Roadmap",
  "theme": "emerald",
  "layout": "vertical",
  "events": [
    {
      "id": 1,
      "date": "Q1 2024",
      "title": "Planning Phase",
      "description": "Requirements gathering",
      "icon": "📋"
    }
  ]
}
```

#### Merman (Markdown)
```json
{
  "content": "# Architecture\n\n```mermaid\ngraph TD\n  A --> B\n```"
}
```

#### Pointer (Slides)
```json
{
  "title": "AI in Healthcare",
  "theme": "midnight",
  "slides": [
    {
      "id": 1,
      "layout": "title",
      "content": "# AI in Healthcare\n\n## Transforming Medicine"
    }
  ]
}
```

#### Metric (Spreadsheet)
```json
{
  "title": "Q4 Budget",
  "cells": {
    "A1": "Category",
    "B1": "Budget",
    "A2": "Marketing",
    "B2": 50000
  },
  "formulas": {
    "B5": "=SUM(B2:B4)"
  }
}
```

#### Theme
```json
{
  "name": "Ocean Breeze",
  "colors": {
    "background": "#0a1628",
    "text": "#e8f1f8",
    "accent": "#3b82f6"
  },
  "fonts": {
    "heading": "Space Grotesk",
    "body": "Inter"
  }
}
```

---

## Integration Points

### 1. Authentik SSO

Work Suite integrates with Authentik for enterprise-grade authentication.

**Configuration:**
```yaml
AUTHENTIK_URL: http://192.168.0.110:9500
AUTHENTIK_CLIENT_ID: work-suite
AUTHENTIK_CLIENT_SECRET: <secret>
AUTHENTIK_CALLBACK_URL: http://192.168.0.110:8500/api/auth/callback
```

**Flow:**
1. User clicks "Sign In"
2. Redirect to Authentik login page
3. User authenticates
4. Callback with authorization code
5. Exchange code for tokens
6. Create/update local user record
7. Set session cookie
8. Sync user with Service-0

### 2. Service-0 Platform

Service-0 provides shared infrastructure across the DOCeater ecosystem.

**Features:**
- User synchronization (single identity across services)
- Workspace management (shared project containers)
- Object registry (cross-service content references)

**API Calls:**
```javascript
// Get user by email
GET /api/v1/users/by-email/{email}

// Create user
POST /api/v1/users

// Get user's workspaces
GET /api/v1/users/{user_id}/workspaces

// Create workspace
POST /api/v1/workspaces

// Register shared object
POST /api/v1/objects
```

### 3. LLM Integration

Work Suite provides a comprehensive API designed for AI agents.

**Discovery:**
```bash
# Get full API documentation
curl http://192.168.0.110:8500/api/llm/help

# Get schema for specific app
curl http://192.168.0.110:8500/api/llm/schema/pointer

# Get example content
curl http://192.168.0.110:8500/api/llm/example/done
```

**Content Creation:**
```bash
# Create a presentation
curl -X POST http://192.168.0.110:8500/api/llm/content/pointer \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Overview",
    "theme": "midnight",
    "slides": [...]
  }'
```

---

## Technical Stack

### Frontend

| Component | Technology |
|-----------|------------|
| Framework | None (Vanilla JS) |
| Styling | CSS Variables, Flexbox, Grid |
| State | localStorage (offline), API (online) |
| Build | None required |

### Backend

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Framework | Express 4.x |
| Database | SQLite (better-sqlite3) |
| Auth | JWT + HTTP-only cookies |
| Real-time | WebSocket (ws) |
| File Upload | Multer |

### Infrastructure

| Component | Technology |
|-----------|------------|
| Web Server | Nginx Alpine |
| Containers | Docker Compose |
| Storage | ZFS volumes |
| SSO | Authentik |
| Platform | Service-0 |

### External Libraries (CDN)

| Library | Purpose |
|---------|---------|
| Marked.js | Markdown parsing |
| Prism.js | Syntax highlighting |
| Mermaid.js | Diagram rendering |
| Chart.js | Data visualization |
| Google Fonts | Typography |

---

## Theme System

### Available Themes

#### Dark Themes
| ID | Name | Description |
|----|------|-------------|
| `midnight` | Midnight | Deep blue-black with crisp white text |
| `aurora` | Aurora | Northern lights with cyan accents |
| `ember` | Ember | Warm orange and amber tones |
| `forest` | Forest | Deep greens with natural warmth |
| `ocean` | Ocean | Deep sea blues with cyan highlights |
| `neon` | Neon | Cyberpunk vibes with hot pink and cyan |

#### Light Themes
| ID | Name | Description |
|----|------|-------------|
| `paper` | Paper | Classic editorial with warm cream |
| `minimal` | Minimal | Clean black on white |
| `snow` | Snow | Cool blue-gray on white |
| `rose` | Rosé | Soft pink accents on cream |

#### Special Themes
| ID | Name | Description |
|----|------|-------------|
| `typewriter` | Typewriter | Monospace, vintage feel |
| `terminal` | Terminal | Green on black, hacker aesthetic |

### CSS Variables

Themes set these CSS custom properties:

```css
/* Fonts */
--content-font-heading
--content-font-body
--content-font-mono

/* Colors */
--content-bg
--content-text
--content-heading
--content-accent
--content-muted
--content-link
--content-code-bg
--content-blockquote-border

/* Styles */
--content-heading-weight
--content-body-line-height
--content-border-radius
```

### Usage

```javascript
// Apply theme to content container
WorkSuiteThemes.apply('midnight', document.getElementById('content'));

// Initialize with saved preference
WorkSuiteThemes.init(container);

// Load required fonts
WorkSuiteThemes.loadFonts('paper');
```

---

## File Extensions

| App | Extension | Format |
|-----|-----------|--------|
| Slate | `.slate` | JSON |
| Done | `.done` | JSON |
| Journey | `.journey` | JSON |
| Merman | `.md` | Markdown |
| Metric | `.metric` / `.csv` | JSON / CSV |
| Pointer | `.pointer` | JSON |
| Theme | `.theme` | JSON |

---

## Environment Variables

```bash
# Server
PORT=3000
DATA_PATH=/data
JWT_SECRET=your-secret-key
NODE_ENV=production

# Authentik OAuth2
AUTHENTIK_URL=http://192.168.0.110:9500
AUTHENTIK_CLIENT_ID=work-suite
AUTHENTIK_CLIENT_SECRET=your-client-secret
AUTHENTIK_CALLBACK_URL=http://192.168.0.110:8500/api/auth/callback
FRONTEND_URL=http://192.168.0.110:8500

# Service-0 Integration
SERVICE_0_URL=http://192.168.0.110:8001

# Session
SECURE_COOKIES=false
COOKIE_DOMAIN=192.168.0.110

# AI (optional)
AI_PROVIDER=none
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

---

## Summary

**Work Suite** is a thoughtfully designed productivity platform that:

1. **Prioritizes simplicity** — Single HTML files with zero build step
2. **Enables AI workflows** — All content in LLM-friendly formats (Markdown, JSON, CSV)
3. **Supports collaboration** — SSO, workspaces, and access scopes
4. **Works everywhere** — Browser-based, offline-capable
5. **Integrates cleanly** — API-first design with comprehensive LLM endpoints

The platform successfully bridges the gap between traditional productivity tools and modern AI-assisted workflows, making it easy for both humans and LLMs to create, read, and transform content.

---

*Last updated: November 2024*

