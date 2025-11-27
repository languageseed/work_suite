# 🧰 Work Suite

**A collection of lightweight, AI-friendly productivity tools for developers and users who want simple, text-based workflows.**

Work Suite apps produce traditional artefacts (task boards, timelines, presentations, spreadsheets, documents) using formats that are easy for both humans and LLMs to read, write, and transform — primarily Markdown, JSON, and plain text.

---

## 🎯 Philosophy

| Traditional Tools | Work Suite Approach |
|-------------------|---------------------|
| Complex binary formats (.docx, .pptx, .xlsx) | Simple text formats (Markdown, JSON, CSV) |
| Heavy dependencies & build systems | Single HTML files, zero setup |
| Proprietary ecosystems | Open, portable, self-contained |
| Hard for LLMs to parse/generate | Easy for AI to read, write, and modify |

### Why This Matters

- **LLM-Friendly** — All apps produce human-readable text that AI can easily parse and generate
- **Zero Overhead** — No npm, no build tools, no databases. Just open in a browser
- **Portable** — Each app is a single HTML file you can run anywhere
- **Offline-First** — Works without an internet connection (after initial load)
- **Interoperable** — Export to JSON, Markdown, CSV, or HTML for use anywhere

---

## 📦 The Apps

### 📝 Slate — Keyboard-First Notes
A fast, keyboard-driven notes app with tile UI for power users.

- **100% keyboard navigable** — no mouse required
- Grid or list view with instant search
- Command palette (`⌘K`) for quick actions
- Auto-save while typing
- Tags for organization

**Formats:** JSON (notes data), plain text (content)

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

### ✅ Done — Kanban Task Board
A Trello-style board for organizing tasks across columns.

- Drag-and-drop cards between columns
- Color-coded labels and due dates
- 5 color themes
- Save/load boards as `.done` JSON files

**Formats:** JSON (board data), Markdown (card descriptions)

---

### 🛤️ Journey — Timeline Creator
Create visual timelines for projects, histories, or roadmaps.

- Vertical and horizontal layouts
- Event icons and descriptions
- 6 visual themes
- Export to standalone HTML

**Formats:** JSON (timeline data), HTML (export)

---

### 🐠 Merman — Markdown & Mermaid Viewer
A split-pane editor for Markdown documents with live diagram rendering.

- Live preview with syntax highlighting
- Mermaid diagram support (flowcharts, sequences, etc.)
- Auto-wraps pasted Mermaid syntax
- Dark/light themes
- Drag-and-drop file loading

**Formats:** Markdown, HTML (export)

---

### 📊 Metric — Spreadsheet & Charts
A lightweight spreadsheet with formulas and data visualization.

- 50 rows × 26 columns
- Formula engine: `SUM`, `AVG`, `MIN`, `MAX`, `COUNT`, `ROUND`, `SQRT`, `POW`
- Chart types: Bar, Line, Pie, Doughnut
- Quick stats panel

**Formats:** JSON (sheet data), CSV (export)

---

### 👆 Pointer — Markdown Slide Presenter
Create presentations from Markdown with multiple layouts and themes.

- 8 slide layouts (Title, Content, Two-Column, Quote, Code, Section, etc.)
- 8 visual themes
- Fullscreen presentation mode
- Keyboard navigation

**Formats:** Markdown (slide content), JSON (deck structure)

---

## 🚀 Getting Started

1. **Clone or download** this repository
2. **Open any `.html` file** in your browser
3. **Start creating** — all data saves to localStorage automatically

No server required. No installation. No build step.

---

## 💾 Data Formats

All Work Suite apps use simple, text-based formats:

### JSON Structure Examples

**Slate (Notes):**
```json
{
  "notes": [
    {
      "id": 1699900000000,
      "title": "Meeting Notes",
      "content": "Discussed Q4 roadmap and priorities...",
      "tags": ["meetings", "planning"],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T11:45:00Z"
    }
  ]
}
```

**Done (Kanban Board):**
```json
{
  "title": "My Project",
  "theme": "slate",
  "columns": [
    {
      "id": "todo",
      "title": "To Do",
      "cards": [
        {
          "id": "card_1",
          "title": "Research competitors",
          "description": "Analyze top 5 competitors",
          "due": "2024-12-01",
          "labels": ["#3b82f6"]
        }
      ]
    }
  ]
}
```

**Journey (Timeline):**
```json
{
  "title": "Project History",
  "theme": "amber",
  "events": [
    {
      "id": 1,
      "date": "2024",
      "title": "Project Launch",
      "description": "Initial release to the public",
      "icon": "🚀"
    }
  ]
}
```

**Pointer (Slides):**
```json
{
  "title": "My Presentation",
  "theme": "midnight",
  "slides": [
    {
      "id": 1,
      "layout": "title",
      "content": "# Welcome\n\nAn introduction to our project"
    }
  ]
}
```

---

## 🤖 AI Integration Tips

Work Suite is designed to work seamlessly with LLMs. Here are some ways to use it:

### Generate Content
Ask an AI to create Markdown content, then paste it directly:

```
"Create a 5-slide presentation about renewable energy"
→ Paste the Markdown into Pointer
```

### Transform Data
Export from one app, ask AI to transform, import to another:

```
Export timeline from Journey as JSON
→ "Convert this timeline to a presentation outline"
→ Import into Pointer
```

### Analyze & Summarize
Export data and ask AI to analyze:

```
Export spreadsheet from Metric as CSV
→ "Summarize the key trends in this data"
```

### Bulk Create
Generate structured JSON and import:

```
"Create 10 task cards for a website redesign project as JSON"
→ Import into Done
```

---

## ⌨️ Keyboard Shortcuts

### Slate (Notes)
| Shortcut | Action |
|----------|--------|
| `N` | New note |
| `/` | Search |
| `↑↓←→` | Navigate |
| `Enter` | Open note |
| `⌘K` | Command palette |
| `Esc` | Close/clear |
| `G` / `L` | Grid/List view |

### Merman (Markdown Editor)
| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+K` | Insert link |
| `Ctrl+S` | Save/download |

### Pointer (Presentations)
| Shortcut | Action |
|----------|--------|
| `←` `→` | Navigate slides |
| `N` | New slide |
| `F` | Fullscreen/present |
| `Esc` | Exit presentation |

### Metric (Spreadsheet)
| Shortcut | Action |
|----------|--------|
| `Arrow keys` | Navigate cells |
| `Enter` | Edit cell |
| `Tab` | Move to next cell |
| `Delete` | Clear cell |

---

## 🎨 Themes

Each app includes multiple visual themes:

- **Slate:** Dark (Indigo accent)
- **Done:** Slate, Zinc, Stone, Emerald, Light
- **Journey:** Amber, Emerald, Violet, Rose, Sky, Minimal
- **Merman:** Light, Dark
- **Metric:** Dark (GitHub-inspired)
- **Pointer:** Midnight, Aurora, Sunset, Ocean, Forest, Minimal, Paper, Neon

---

## 📁 File Extensions

| App | Extension | Format |
|-----|-----------|--------|
| Slate | `.slate` | JSON |
| Done | `.done` | JSON |
| Journey | `.journey` | JSON |
| Merman | `.md` | Markdown |
| Metric | `.metric` / `.csv` | JSON / CSV |
| Pointer | `.pointer` | JSON |

---

## 🛠️ Technical Details

- **No dependencies at runtime** — all libraries loaded via CDN
- **LocalStorage persistence** — work is auto-saved in browser
- **Responsive design** — works on desktop and mobile
- **Modern CSS** — CSS variables, Grid, Flexbox
- **Vanilla JavaScript** — no frameworks, easy to understand and modify

### External Libraries Used
- [Marked.js](https://marked.js.org/) — Markdown parsing
- [Prism.js](https://prismjs.com/) — Syntax highlighting
- [Mermaid.js](https://mermaid.js.org/) — Diagram rendering
- [Chart.js](https://www.chartjs.org/) — Data visualization
- [Google Fonts](https://fonts.google.com/) — Typography

---

## 📜 License

MIT License — Use freely in personal and commercial projects.

---

## 🙏 Contributing

Contributions welcome! Each app is self-contained, so you can:

1. Improve an existing app
2. Add a new app following the same patterns
3. Fix bugs or improve accessibility
4. Add new themes or layouts

---

**Work Suite** — Simple tools for a complex world. 🧰

