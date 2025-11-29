# Work Suite Platform Specification

## Vision

Transform Work Suite from a collection of standalone HTML apps into an integrated platform that provides:
- **Unified Storage** - Persistent, syncable, shareable data layer
- **Identity** - User accounts, authentication, profiles
- **AI Integration** - LLM-powered features across all apps
- **Collaboration** - Real-time and async sharing

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Work Suite Shell                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Navigation / Portal                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┬─────┐ │
│  │  Slate   │   Done   │ Journey  │  Merman  │  Metric  │ ... │ │
│  │  (App)   │  (App)   │  (App)   │  (App)   │  (App)   │     │ │
│  └──────────┴──────────┴──────────┴──────────┴──────────┴─────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Platform Services                         ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            ││
│  │  │ Storage │ │Identity │ │   AI    │ │  Sync   │            ││
│  │  │   API   │ │   API   │ │   API   │ │   API   │            ││
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Backend Services                          ││
│  │  (Optional - can run fully offline with localStorage)        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Storage Layer

### 1.1 Storage API

A unified API that abstracts storage backends:

```javascript
const WorkSuiteStorage = {
  // Core CRUD
  async save(type, id, data, options) {},
  async load(type, id) {},
  async delete(type, id) {},
  async list(type, filters) {},
  
  // Bulk operations
  async saveMany(items) {},
  async loadMany(type, ids) {},
  
  // Search
  async search(query, options) {},
  
  // Sync
  async sync() {},
  async getConflicts() {},
  async resolveConflict(id, resolution) {},
};
```

### 1.2 Storage Backends

| Backend | Use Case | Offline | Sync |
|---------|----------|---------|------|
| **localStorage** | Quick start, small data | ✅ | ❌ |
| **IndexedDB** | Large data, offline-first | ✅ | ❌ |
| **Work Suite Cloud** | Full sync, collaboration | ⚠️ | ✅ |
| **Self-hosted** | Enterprise, privacy | ⚠️ | ✅ |
| **File System** | Desktop app, exports | ✅ | ❌ |

### 1.3 Data Model

```javascript
// Universal document structure
{
  id: "uuid",
  type: "pointer" | "slate" | "done" | ...,
  name: "Document Name",
  
  // Access control
  scope: "me" | "us" | "we" | "there",
  owner: "user-id",
  sharedWith: ["user-id", ...],
  permissions: { read: [], write: [], admin: [] },
  
  // Organization
  folder: "folder-id",
  tags: ["tag1", "tag2"],
  status: "backlog" | "in-progress" | "done" | "closed",
  
  // App-specific data
  data: { ... },
  
  // Metadata
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: "user-id",
  updatedBy: "user-id",
  version: 1,
  
  // Sync
  syncStatus: "synced" | "pending" | "conflict",
  lastSyncedAt: timestamp,
}
```

---

## 2. Identity & Authentication

### 2.1 Identity API

```javascript
const WorkSuiteIdentity = {
  // Auth
  async signIn(provider, credentials) {},
  async signOut() {},
  async getSession() {},
  
  // Profile
  async getProfile() {},
  async updateProfile(updates) {},
  
  // Teams
  async getTeams() {},
  async getTeamMembers(teamId) {},
  
  // Permissions
  async canAccess(resourceId, action) {},
};
```

### 2.2 Auth Providers

| Provider | Use Case |
|----------|----------|
| **Anonymous** | No login required, localStorage only |
| **Email/Password** | Simple accounts |
| **OAuth** | Google, GitHub, Microsoft |
| **SSO/SAML** | Enterprise |
| **Passkeys** | Modern passwordless |

### 2.3 Access Scopes (Me/Us/We/There)

```javascript
// Scope definitions
const scopes = {
  me: {
    name: "Private",
    access: "owner-only",
    icon: "👤"
  },
  us: {
    name: "Shared",
    access: "explicit-invite",
    icon: "👥"
  },
  we: {
    name: "Team",
    access: "team-default",
    icon: "🏢"
  },
  there: {
    name: "Public/External",
    access: "link-sharing | public",
    icon: "🌐"
  }
};
```

---

## 3. AI Integration

### 3.1 AI API

```javascript
const WorkSuiteAI = {
  // Text generation
  async complete(prompt, options) {},
  async chat(messages, options) {},
  
  // Embeddings & search
  async embed(text) {},
  async semanticSearch(query, documents) {},
  
  // Document operations
  async summarize(content) {},
  async extract(content, schema) {},
  async transform(content, instruction) {},
  
  // App-specific
  async generateSlides(topic, options) {},
  async suggestTags(content) {},
  async analyzeData(spreadsheet) {},
};
```

### 3.2 AI Providers

| Provider | Features |
|----------|----------|
| **OpenAI** | GPT-4, embeddings |
| **Anthropic** | Claude |
| **Local LLM** | Ollama, llama.cpp |
| **Custom** | Self-hosted, fine-tuned |

### 3.3 AI Features by App

| App | AI Features |
|-----|-------------|
| **Slate** | Auto-summarize, smart tags, writing assist |
| **Pointer** | Generate slides, suggest layouts, speaker notes |
| **Done** | Task breakdown, priority suggestions |
| **Journey** | Timeline generation, milestone suggestions |
| **Merman** | Diagram generation, code explanation |
| **Metric** | Formula suggestions, data insights |
| **Tags** | Auto-tagging, smart folders, search |

---

## 4. Sync & Collaboration

### 4.1 Sync Modes

| Mode | Description |
|------|-------------|
| **Offline-first** | Work offline, sync when connected |
| **Real-time** | Live collaboration (WebSocket/CRDT) |
| **Manual** | Explicit save/sync actions |

### 4.2 Conflict Resolution

```javascript
// Conflict strategies
const conflictStrategies = {
  "last-write-wins": "Latest timestamp wins",
  "first-write-wins": "Original version preserved",
  "manual": "User chooses resolution",
  "merge": "Auto-merge when possible",
  "fork": "Create both versions"
};
```

### 4.3 Real-time Collaboration

```javascript
const WorkSuiteCollab = {
  // Presence
  async joinDocument(docId) {},
  async leaveDocument(docId) {},
  async getPresence(docId) {}, // Who's viewing/editing
  
  // Changes
  async applyChange(docId, change) {},
  onRemoteChange(docId, callback) {},
  
  // Cursors
  async updateCursor(docId, position) {},
  onCursorUpdate(docId, callback) {},
  
  // Comments
  async addComment(docId, comment) {},
  async resolveComment(commentId) {},
};
```

---

## 5. Platform Shell

### 5.1 Shell Features

- **App Launcher** - Navigate between apps
- **Global Search** - Search across all content
- **Notifications** - Activity feed, mentions
- **Settings** - User preferences, connections
- **Command Palette** - Keyboard-first navigation

### 5.2 App Integration

Apps register with the shell:

```javascript
WorkSuite.registerApp({
  id: "pointer",
  name: "Pointer",
  icon: "👆",
  description: "Markdown presentations",
  
  // Capabilities
  capabilities: {
    create: true,
    import: ["md", "pptx"],
    export: ["md", "pdf", "html"],
    ai: ["generate", "summarize"],
  },
  
  // Routes
  routes: {
    new: "/pointer/new",
    open: "/pointer/:id",
    embed: "/pointer/:id/embed",
  },
  
  // Handlers
  handlers: {
    onCreate: () => {},
    onOpen: (id) => {},
    onSave: (data) => {},
  }
});
```

### 5.3 Inter-App Communication

```javascript
// Embed content from one app in another
WorkSuite.embed("pointer", "presentation-id", { width: 800, height: 600 });

// Link between apps
WorkSuite.link("slate", "note-id", "See related presentation");

// Share data
WorkSuite.share("done", "board-id", { scope: "we" });
```

---

## 6. Implementation Phases

### Phase 1: Foundation (Current + Storage)
- [ ] Abstract storage layer (localStorage → Storage API)
- [ ] Tags app as central file manager
- [ ] Unified data model across apps
- [ ] IndexedDB support for larger data

### Phase 2: Identity
- [ ] Anonymous accounts (device-based)
- [ ] Email/password auth
- [ ] Profile management
- [ ] OAuth providers

### Phase 3: Cloud Sync
- [ ] Work Suite Cloud backend
- [ ] Offline-first sync
- [ ] Conflict resolution
- [ ] Version history

### Phase 4: Collaboration
- [ ] Sharing (us/we/there scopes)
- [ ] Real-time presence
- [ ] Comments
- [ ] Activity feed

### Phase 5: AI Integration
- [ ] AI provider configuration
- [ ] Per-app AI features
- [ ] Semantic search
- [ ] Smart suggestions

### Phase 6: Platform Shell
- [ ] Unified navigation
- [ ] Global search
- [ ] Command palette
- [ ] Notifications

---

## 7. Technical Considerations

### 7.1 Deployment Options

| Option | Description |
|--------|-------------|
| **Static hosting** | GitHub Pages, Netlify (offline-only) |
| **Serverless** | Vercel, Cloudflare Workers |
| **Self-hosted** | Docker, VPS |
| **Desktop** | Electron, Tauri |
| **Mobile** | PWA, Capacitor |

### 7.2 Backend Stack Options

| Stack | Pros | Cons |
|-------|------|------|
| **Supabase** | Quick start, Postgres, Auth, Realtime | Vendor lock-in |
| **Firebase** | Easy, scalable | Google dependency |
| **PocketBase** | Self-hosted, simple | Single binary |
| **Custom (Node/Deno)** | Full control | More work |

### 7.3 Offline-First Architecture

```
User Action
    ↓
Local Storage (IndexedDB)
    ↓ (when online)
Sync Queue
    ↓
Backend API
    ↓
Cloud Storage
    ↓ (push to other devices)
Other Clients
```

---

## 8. API Summary

```javascript
// Main namespace
const WorkSuite = {
  // Core services
  storage: WorkSuiteStorage,
  identity: WorkSuiteIdentity,
  ai: WorkSuiteAI,
  collab: WorkSuiteCollab,
  
  // App management
  registerApp(config) {},
  getApp(id) {},
  listApps() {},
  
  // Navigation
  navigate(appId, route, params) {},
  
  // Global features
  search(query) {},
  showCommandPalette() {},
  notify(message, options) {},
  
  // Configuration
  configure(options) {},
  getConfig() {},
};
```

---

## 9. Migration Path

### From Current State

1. **No breaking changes** - Existing apps continue to work
2. **Gradual adoption** - Apps opt-in to platform features
3. **Fallback support** - Works without backend (localStorage mode)

### App Migration Steps

```javascript
// Before: Direct localStorage
localStorage.setItem('pointer-deck', JSON.stringify(deck));

// After: Storage API with fallback
await WorkSuite.storage.save('pointer', deck.id, deck);
// Internally uses localStorage if no backend configured
```

---

## 10. Success Metrics

| Metric | Target |
|--------|--------|
| **Offline capability** | 100% features work offline |
| **Sync latency** | < 1s for small docs |
| **Time to first byte** | < 500ms |
| **Bundle size** | < 500KB per app |
| **AI response time** | < 3s for generation |

---

## Next Steps

1. **Review & refine** this spec
2. **Prioritize** which phase to start with
3. **Prototype** the Storage API
4. **Choose** backend stack
5. **Build** incrementally

---

*This is a living document. Update as requirements evolve.*

