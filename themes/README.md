# Work Suite Content Themes

A shared registry of content themes for styling user-created content across all Work Suite apps.

## 🎯 What This Is

This themes **user content**, not app chrome:

| ✅ Themed (Content) | ❌ Not Themed (App Chrome) |
|---------------------|---------------------------|
| Slide text in Pointer | App header, sidebar |
| Markdown preview in Merman | Toolbar buttons |
| Note content in Slate | Navigation |
| Timeline events in Journey | Modal dialogs |
| Card descriptions in Done | Settings panels |

## 📁 Files

```
themes/
├── content-themes.js    # Theme registry & utilities
├── content-styles.css   # Base content styles
├── index.html           # Theme preview/picker
└── README.md            # This file
```

## 🚀 Quick Start

### 1. Include the files

```html
<!-- In your app's <head> -->
<link rel="stylesheet" href="themes/content-styles.css">
<script src="themes/content-themes.js"></script>
```

### 2. Add the content class

```html
<!-- Wrap your content area -->
<div class="ws-content" id="myContent">
    <h1>User's content goes here</h1>
    <p>This will be themed.</p>
</div>
```

### 3. Apply a theme

```javascript
// Apply a specific theme
const container = document.getElementById('myContent');
WorkSuiteThemes.apply('midnight', container);

// Or initialize with saved preference
WorkSuiteThemes.init(container);
```

## 🎨 Available Themes

### Dark Themes
| ID | Name | Description |
|----|------|-------------|
| `midnight` | Midnight | Deep blue-black with crisp white text |
| `aurora` | Aurora | Northern lights with cyan accents |
| `ember` | Ember | Warm orange and amber tones |
| `forest` | Forest | Deep greens with natural warmth |
| `ocean` | Ocean | Deep sea blues with cyan highlights |
| `neon` | Neon | Cyberpunk vibes with hot pink and cyan |

### Light Themes
| ID | Name | Description |
|----|------|-------------|
| `paper` | Paper | Classic editorial with warm cream tones |
| `minimal` | Minimal | Clean black on white |
| `snow` | Snow | Cool blue-gray tones on white |
| `rose` | Rosé | Soft pink accents on cream |

### Special Themes
| ID | Name | Description |
|----|------|-------------|
| `typewriter` | Typewriter | Monospace everything, vintage feel |
| `terminal` | Terminal | Green on black, hacker aesthetic |

## 🔧 API Reference

### `WorkSuiteThemes.getThemes()`
Returns array of all available themes.

```javascript
const themes = WorkSuiteThemes.getThemes();
// [{ id: 'midnight', name: 'Midnight', ... }, ...]
```

### `WorkSuiteThemes.getTheme(id)`
Get a specific theme by ID.

```javascript
const theme = WorkSuiteThemes.getTheme('midnight');
// { name: 'Midnight', fonts: {...}, colors: {...}, styles: {...} }
```

### `WorkSuiteThemes.apply(themeId, container)`
Apply a theme to a container element.

```javascript
WorkSuiteThemes.apply('aurora', document.getElementById('preview'));
```

### `WorkSuiteThemes.loadFonts(themeId)`
Load Google Fonts required for a theme.

```javascript
WorkSuiteThemes.loadFonts('paper'); // Loads Playfair Display, Source Serif 4, etc.
```

### `WorkSuiteThemes.savePreference(themeId)`
Save theme preference to localStorage.

### `WorkSuiteThemes.loadPreference()`
Load saved theme preference (defaults to 'midnight').

### `WorkSuiteThemes.init(container)`
Initialize with saved preference, load fonts, and apply theme.

```javascript
const themeId = WorkSuiteThemes.init(myContainer);
```

### `WorkSuiteThemes.generateCSSVariables(theme)`
Generate CSS variable string from theme object.

## 🎯 CSS Variables

Themes set these CSS variables on the container:

```css
/* Fonts */
--content-font-heading
--content-font-body
--content-font-mono

/* Colors */
--content-bg
--content-bg-solid
--content-text
--content-heading
--content-accent
--content-accent-alt
--content-muted
--content-link
--content-code-bg
--content-code-text
--content-blockquote-border
--content-blockquote-bg
--content-table-border
--content-table-header-bg

/* Styles */
--content-heading-weight
--content-heading-letter-spacing
--content-body-line-height
--content-paragraph-spacing
--content-border-radius
```

## 📐 Styled Elements

The `content-styles.css` file styles these elements within `.ws-content`:

- **Typography**: h1-h6, p, strong, em, small, mark
- **Links**: a, a:hover
- **Lists**: ul, ol, li
- **Code**: code, pre
- **Quotes**: blockquote, cite
- **Tables**: table, th, td
- **Media**: img, figure, figcaption
- **Other**: hr, kbd, abbr, dl, dt, dd
- **Callouts**: .callout, .alert (with variants)

## 🔗 Integration Examples

### Merman (Markdown Preview)

```javascript
// In merman.html
const preview = document.getElementById('preview');
preview.classList.add('ws-content');
WorkSuiteThemes.init(preview);

// When user changes theme
function onThemeChange(themeId) {
    WorkSuiteThemes.loadFonts(themeId);
    WorkSuiteThemes.apply(themeId, preview);
}
```

### Pointer (Slide Content)

```javascript
// In pointer.html
const slideContent = document.getElementById('slideContent');
slideContent.classList.add('ws-content');
WorkSuiteThemes.init(slideContent);
```

### Slate (Note Display)

```javascript
// In slate.html - for note preview/reading mode
const noteView = document.getElementById('noteView');
noteView.classList.add('ws-content');
WorkSuiteThemes.init(noteView);
```

## 🌐 Theme Picker

Open `themes/index.html` to:
- Preview all themes with sample content
- Copy CSS variables
- Set a default theme (saved to localStorage)

Link to it from your app:
```html
<a href="themes/index.html" target="_blank">🎨 Content Themes</a>
```

## 💾 Persistence

Theme preference is stored in localStorage under `worksuite-content-theme`.

All Work Suite apps that use this system will share the same content theme preference.

