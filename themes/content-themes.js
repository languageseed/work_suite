/**
 * Work Suite Content Themes
 * 
 * A shared registry of content themes for styling user-created content
 * across all Work Suite apps. This styles the CONTENT (slides, notes, 
 * markdown, timeline events) - not the app chrome/UI.
 * 
 * Usage:
 *   1. Include this script in your app
 *   2. Call WorkSuiteThemes.apply('theme-name', containerElement)
 *   3. The container will have CSS variables applied for content styling
 */

const WorkSuiteThemes = (function() {
    'use strict';

    // ==================== THEME REGISTRY ====================
    
    const themes = {
        // ---------- DARK THEMES ----------
        
        'midnight': {
            name: 'Midnight',
            category: 'dark',
            description: 'Deep blue-black with crisp white text',
            fonts: {
                heading: "'Space Grotesk', sans-serif",
                body: "'Inter', sans-serif",
                mono: "'JetBrains Mono', monospace"
            },
            colors: {
                background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0d0d1a 100%)',
                backgroundSolid: '#0f0f23',
                text: '#e8e8e8',
                heading: '#ffffff',
                accent: '#e94560',
                accentAlt: '#ff6b6b',
                muted: '#8892b0',
                link: '#64ffda',
                codeBg: 'rgba(255, 255, 255, 0.08)',
                codeText: '#e8e8e8',
                blockquoteBorder: '#e94560',
                blockquoteBg: 'rgba(233, 69, 96, 0.1)',
                tableBorder: '#2a2a4a',
                tableHeaderBg: 'rgba(255, 255, 255, 0.05)'
            },
            styles: {
                headingWeight: 700,
                headingLetterSpacing: '-0.02em',
                bodyLineHeight: 1.7,
                paragraphSpacing: '1.25em',
                borderRadius: '8px'
            }
        },

        'aurora': {
            name: 'Aurora',
            category: 'dark',
            description: 'Northern lights inspired with cyan accents',
            fonts: {
                heading: "'Space Grotesk', sans-serif",
                body: "'Inter', sans-serif",
                mono: "'Fira Code', monospace"
            },
            colors: {
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 70%, #1a1a2e 100%)',
                backgroundSolid: '#1a1a2e',
                text: '#e0e0e0',
                heading: '#64ffda',
                accent: '#64ffda',
                accentAlt: '#00bfa5',
                muted: '#8892b0',
                link: '#64ffda',
                codeBg: 'rgba(100, 255, 218, 0.1)',
                codeText: '#64ffda',
                blockquoteBorder: '#64ffda',
                blockquoteBg: 'rgba(100, 255, 218, 0.05)',
                tableBorder: '#2a3f5f',
                tableHeaderBg: 'rgba(100, 255, 218, 0.1)'
            },
            styles: {
                headingWeight: 600,
                headingLetterSpacing: '-0.01em',
                bodyLineHeight: 1.75,
                paragraphSpacing: '1.5em',
                borderRadius: '12px'
            }
        },

        'ember': {
            name: 'Ember',
            category: 'dark',
            description: 'Warm orange and amber tones',
            fonts: {
                heading: "'Outfit', sans-serif",
                body: "'Source Sans 3', sans-serif",
                mono: "'JetBrains Mono', monospace"
            },
            colors: {
                background: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
                backgroundSolid: '#1c1917',
                text: '#fafaf9',
                heading: '#fbbf24',
                accent: '#f59e0b',
                accentAlt: '#fb923c',
                muted: '#a8a29e',
                link: '#fbbf24',
                codeBg: 'rgba(251, 191, 36, 0.1)',
                codeText: '#fbbf24',
                blockquoteBorder: '#f59e0b',
                blockquoteBg: 'rgba(245, 158, 11, 0.1)',
                tableBorder: '#44403c',
                tableHeaderBg: 'rgba(251, 191, 36, 0.1)'
            },
            styles: {
                headingWeight: 700,
                headingLetterSpacing: '-0.02em',
                bodyLineHeight: 1.7,
                paragraphSpacing: '1.25em',
                borderRadius: '10px'
            }
        },

        'forest': {
            name: 'Forest',
            category: 'dark',
            description: 'Deep greens with natural warmth',
            fonts: {
                heading: "'DM Sans', sans-serif",
                body: "'IBM Plex Sans', sans-serif",
                mono: "'IBM Plex Mono', monospace"
            },
            colors: {
                background: 'linear-gradient(135deg, #1a2f1a 0%, #2d4a2d 40%, #1e3a1e 100%)',
                backgroundSolid: '#1a2f1a',
                text: '#e8f5e9',
                heading: '#81c784',
                accent: '#4caf50',
                accentAlt: '#66bb6a',
                muted: '#a5d6a7',
                link: '#81c784',
                codeBg: 'rgba(76, 175, 80, 0.12)',
                codeText: '#a5d6a7',
                blockquoteBorder: '#4caf50',
                blockquoteBg: 'rgba(76, 175, 80, 0.08)',
                tableBorder: '#2d4a2d',
                tableHeaderBg: 'rgba(76, 175, 80, 0.1)'
            },
            styles: {
                headingWeight: 600,
                headingLetterSpacing: '-0.01em',
                bodyLineHeight: 1.8,
                paragraphSpacing: '1.5em',
                borderRadius: '8px'
            }
        },

        'ocean': {
            name: 'Ocean',
            category: 'dark',
            description: 'Deep sea blues with cyan highlights',
            fonts: {
                heading: "'Plus Jakarta Sans', sans-serif",
                body: "'Inter', sans-serif",
                mono: "'Fira Code', monospace"
            },
            colors: {
                background: 'linear-gradient(135deg, #0c2340 0%, #134074 40%, #13678a 100%)',
                backgroundSolid: '#0c2340',
                text: '#e0f7fa',
                heading: '#4dd0e1',
                accent: '#00bcd4',
                accentAlt: '#26c6da',
                muted: '#80deea',
                link: '#4dd0e1',
                codeBg: 'rgba(77, 208, 225, 0.12)',
                codeText: '#80deea',
                blockquoteBorder: '#00bcd4',
                blockquoteBg: 'rgba(0, 188, 212, 0.08)',
                tableBorder: '#1a5276',
                tableHeaderBg: 'rgba(77, 208, 225, 0.1)'
            },
            styles: {
                headingWeight: 700,
                headingLetterSpacing: '-0.02em',
                bodyLineHeight: 1.75,
                paragraphSpacing: '1.25em',
                borderRadius: '12px'
            }
        },

        'neon': {
            name: 'Neon',
            category: 'dark',
            description: 'Cyberpunk vibes with hot pink and cyan',
            fonts: {
                heading: "'Orbitron', sans-serif",
                body: "'Rajdhani', sans-serif",
                mono: "'Share Tech Mono', monospace"
            },
            colors: {
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)',
                backgroundSolid: '#0a0a0a',
                text: '#ffffff',
                heading: '#ff00ff',
                accent: '#00ffff',
                accentAlt: '#ff69b4',
                muted: '#ff69b4',
                link: '#00ffff',
                codeBg: 'rgba(255, 0, 255, 0.15)',
                codeText: '#00ffff',
                blockquoteBorder: '#ff00ff',
                blockquoteBg: 'rgba(255, 0, 255, 0.1)',
                tableBorder: '#330033',
                tableHeaderBg: 'rgba(255, 0, 255, 0.15)'
            },
            styles: {
                headingWeight: 700,
                headingLetterSpacing: '0.05em',
                bodyLineHeight: 1.6,
                paragraphSpacing: '1.25em',
                borderRadius: '4px'
            }
        },

        // ---------- LIGHT THEMES ----------

        'paper': {
            name: 'Paper',
            category: 'light',
            description: 'Classic editorial with warm cream tones',
            fonts: {
                heading: "'Playfair Display', serif",
                body: "'Source Serif 4', serif",
                mono: "'Fira Code', monospace"
            },
            colors: {
                background: 'linear-gradient(135deg, #f5f5dc 0%, #faf8ef 50%, #f5f5dc 100%)',
                backgroundSolid: '#faf8ef',
                text: '#3d3d3d',
                heading: '#1a1a1a',
                accent: '#8b4513',
                accentAlt: '#a0522d',
                muted: '#666666',
                link: '#8b4513',
                codeBg: 'rgba(139, 69, 19, 0.08)',
                codeText: '#8b4513',
                blockquoteBorder: '#8b4513',
                blockquoteBg: 'rgba(139, 69, 19, 0.05)',
                tableBorder: '#d4c4a8',
                tableHeaderBg: 'rgba(139, 69, 19, 0.08)'
            },
            styles: {
                headingWeight: 700,
                headingLetterSpacing: '-0.01em',
                bodyLineHeight: 1.85,
                paragraphSpacing: '1.5em',
                borderRadius: '4px'
            }
        },

        'minimal': {
            name: 'Minimal',
            category: 'light',
            description: 'Clean and simple black on white',
            fonts: {
                heading: "'Inter', sans-serif",
                body: "'Inter', sans-serif",
                mono: "'SF Mono', monospace"
            },
            colors: {
                background: '#ffffff',
                backgroundSolid: '#ffffff',
                text: '#333333',
                heading: '#111111',
                accent: '#0066cc',
                accentAlt: '#0052a3',
                muted: '#666666',
                link: '#0066cc',
                codeBg: '#f4f4f4',
                codeText: '#333333',
                blockquoteBorder: '#dddddd',
                blockquoteBg: '#f9f9f9',
                tableBorder: '#e5e5e5',
                tableHeaderBg: '#f4f4f4'
            },
            styles: {
                headingWeight: 600,
                headingLetterSpacing: '-0.02em',
                bodyLineHeight: 1.7,
                paragraphSpacing: '1.25em',
                borderRadius: '6px'
            }
        },

        'snow': {
            name: 'Snow',
            category: 'light',
            description: 'Cool blue-gray tones on white',
            fonts: {
                heading: "'DM Sans', sans-serif",
                body: "'IBM Plex Sans', sans-serif",
                mono: "'IBM Plex Mono', monospace"
            },
            colors: {
                background: 'linear-gradient(135deg, #f0f4f8 0%, #ffffff 50%, #f0f4f8 100%)',
                backgroundSolid: '#f8fafc',
                text: '#334155',
                heading: '#0f172a',
                accent: '#3b82f6',
                accentAlt: '#2563eb',
                muted: '#64748b',
                link: '#3b82f6',
                codeBg: '#f1f5f9',
                codeText: '#475569',
                blockquoteBorder: '#3b82f6',
                blockquoteBg: '#f8fafc',
                tableBorder: '#e2e8f0',
                tableHeaderBg: '#f1f5f9'
            },
            styles: {
                headingWeight: 700,
                headingLetterSpacing: '-0.02em',
                bodyLineHeight: 1.75,
                paragraphSpacing: '1.5em',
                borderRadius: '8px'
            }
        },

        'rose': {
            name: 'Rosé',
            category: 'light',
            description: 'Soft pink accents on cream',
            fonts: {
                heading: "'Fraunces', serif",
                body: "'Nunito', sans-serif",
                mono: "'Fira Code', monospace"
            },
            colors: {
                background: 'linear-gradient(135deg, #fff5f5 0%, #fffafa 50%, #fff5f5 100%)',
                backgroundSolid: '#fffafa',
                text: '#4a4a4a',
                heading: '#831843',
                accent: '#be185d',
                accentAlt: '#db2777',
                muted: '#9ca3af',
                link: '#be185d',
                codeBg: 'rgba(190, 24, 93, 0.08)',
                codeText: '#be185d',
                blockquoteBorder: '#f472b6',
                blockquoteBg: 'rgba(244, 114, 182, 0.08)',
                tableBorder: '#fce7f3',
                tableHeaderBg: 'rgba(190, 24, 93, 0.05)'
            },
            styles: {
                headingWeight: 600,
                headingLetterSpacing: '-0.01em',
                bodyLineHeight: 1.8,
                paragraphSpacing: '1.5em',
                borderRadius: '12px'
            }
        },

        // ---------- SPECIAL THEMES ----------

        'typewriter': {
            name: 'Typewriter',
            category: 'light',
            description: 'Monospace everything, vintage feel',
            fonts: {
                heading: "'Courier Prime', monospace",
                body: "'Courier Prime', monospace",
                mono: "'Courier Prime', monospace"
            },
            colors: {
                background: '#f4f1ea',
                backgroundSolid: '#f4f1ea',
                text: '#2c2c2c',
                heading: '#1a1a1a',
                accent: '#c41e3a',
                accentAlt: '#a01830',
                muted: '#666666',
                link: '#c41e3a',
                codeBg: '#e8e4db',
                codeText: '#2c2c2c',
                blockquoteBorder: '#2c2c2c',
                blockquoteBg: '#ebe7de',
                tableBorder: '#d4d0c7',
                tableHeaderBg: '#e8e4db'
            },
            styles: {
                headingWeight: 700,
                headingLetterSpacing: '0',
                bodyLineHeight: 1.65,
                paragraphSpacing: '1.5em',
                borderRadius: '0px'
            }
        },

        'terminal': {
            name: 'Terminal',
            category: 'dark',
            description: 'Green on black, hacker aesthetic',
            fonts: {
                heading: "'JetBrains Mono', monospace",
                body: "'JetBrains Mono', monospace",
                mono: "'JetBrains Mono', monospace"
            },
            colors: {
                background: '#0d0d0d',
                backgroundSolid: '#0d0d0d',
                text: '#33ff33',
                heading: '#33ff33',
                accent: '#33ff33',
                accentAlt: '#00cc00',
                muted: '#1a991a',
                link: '#66ff66',
                codeBg: '#1a1a1a',
                codeText: '#33ff33',
                blockquoteBorder: '#33ff33',
                blockquoteBg: 'rgba(51, 255, 51, 0.05)',
                tableBorder: '#1a4d1a',
                tableHeaderBg: 'rgba(51, 255, 51, 0.1)'
            },
            styles: {
                headingWeight: 700,
                headingLetterSpacing: '0',
                bodyLineHeight: 1.5,
                paragraphSpacing: '1em',
                borderRadius: '0px'
            }
        }
    };

    // ==================== FONT PRESETS ====================
    
    const fontPresets = {
        'modern-sans': {
            name: 'Modern Sans',
            heading: "'Space Grotesk', sans-serif",
            body: "'Inter', sans-serif",
            mono: "'JetBrains Mono', monospace",
            googleFonts: 'Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500'
        },
        'classic-serif': {
            name: 'Classic Serif',
            heading: "'Playfair Display', serif",
            body: "'Source Serif 4', serif",
            mono: "'Fira Code', monospace",
            googleFonts: 'Playfair+Display:wght@400;500;600;700&family=Source+Serif+4:wght@400;500;600&family=Fira+Code:wght@400;500'
        },
        'editorial': {
            name: 'Editorial',
            heading: "'Fraunces', serif",
            body: "'Nunito', sans-serif",
            mono: "'IBM Plex Mono', monospace",
            googleFonts: 'Fraunces:wght@400;600;700&family=Nunito:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500'
        },
        'technical': {
            name: 'Technical',
            heading: "'IBM Plex Sans', sans-serif",
            body: "'IBM Plex Sans', sans-serif",
            mono: "'IBM Plex Mono', monospace",
            googleFonts: 'IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500'
        },
        'geometric': {
            name: 'Geometric',
            heading: "'DM Sans', sans-serif",
            body: "'DM Sans', sans-serif",
            mono: "'DM Mono', monospace",
            googleFonts: 'DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500'
        },
        'humanist': {
            name: 'Humanist',
            heading: "'Outfit', sans-serif",
            body: "'Source Sans 3', sans-serif",
            mono: "'Source Code Pro', monospace",
            googleFonts: 'Outfit:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600&family=Source+Code+Pro:wght@400;500'
        }
    };

    // ==================== UTILITY FUNCTIONS ====================

    /**
     * Get all available themes
     */
    function getThemes() {
        // Ensure custom themes are loaded
        loadCustomThemes();
        
        return Object.entries(themes).map(([id, theme]) => ({
            id,
            ...theme
        }));
    }

    /**
     * Get themes by category
     */
    function getThemesByCategory(category) {
        return getThemes().filter(t => t.category === category);
    }

    /**
     * Get a specific theme by ID
     */
    function getTheme(themeId) {
        // Ensure custom themes are loaded
        loadCustomThemes();
        
        return themes[themeId] || null;
    }

    /**
     * Get all font presets
     */
    function getFontPresets() {
        return Object.entries(fontPresets).map(([id, preset]) => ({
            id,
            ...preset
        }));
    }

    /**
     * Generate CSS variables from a theme
     */
    function generateCSSVariables(theme) {
        if (!theme) return '';
        
        return `
            --content-font-heading: ${theme.fonts.heading};
            --content-font-body: ${theme.fonts.body};
            --content-font-mono: ${theme.fonts.mono};
            
            --content-bg: ${theme.colors.background};
            --content-bg-solid: ${theme.colors.backgroundSolid};
            --content-text: ${theme.colors.text};
            --content-heading: ${theme.colors.heading};
            --content-accent: ${theme.colors.accent};
            --content-accent-alt: ${theme.colors.accentAlt};
            --content-muted: ${theme.colors.muted};
            --content-link: ${theme.colors.link};
            --content-code-bg: ${theme.colors.codeBg};
            --content-code-text: ${theme.colors.codeText};
            --content-blockquote-border: ${theme.colors.blockquoteBorder};
            --content-blockquote-bg: ${theme.colors.blockquoteBg};
            --content-table-border: ${theme.colors.tableBorder};
            --content-table-header-bg: ${theme.colors.tableHeaderBg};
            
            --content-heading-weight: ${theme.styles.headingWeight};
            --content-heading-letter-spacing: ${theme.styles.headingLetterSpacing};
            --content-body-line-height: ${theme.styles.bodyLineHeight};
            --content-paragraph-spacing: ${theme.styles.paragraphSpacing};
            --content-border-radius: ${theme.styles.borderRadius};
        `;
    }

    /**
     * Apply a theme to a container element
     */
    function apply(themeId, container) {
        const theme = getTheme(themeId);
        if (!theme || !container) return false;

        const cssVars = generateCSSVariables(theme);
        container.setAttribute('style', cssVars);
        container.setAttribute('data-content-theme', themeId);
        
        // Save preference
        savePreference(themeId);
        
        return true;
    }

    /**
     * Apply theme using CSS custom properties on :root
     */
    function applyGlobal(themeId) {
        const theme = getTheme(themeId);
        if (!theme) return false;

        const cssVars = generateCSSVariables(theme);
        document.documentElement.setAttribute('style', 
            document.documentElement.getAttribute('style') + cssVars
        );
        document.documentElement.setAttribute('data-content-theme', themeId);
        
        savePreference(themeId);
        return true;
    }

    /**
     * Load required Google Fonts for a theme
     */
    function loadFonts(themeId) {
        const theme = getTheme(themeId);
        if (!theme) return;

        // Extract font families from theme
        const fonts = [
            theme.fonts.heading,
            theme.fonts.body,
            theme.fonts.mono
        ].map(f => f.replace(/'/g, '').split(',')[0].trim());

        // Find matching preset or construct URL
        const uniqueFonts = [...new Set(fonts)];
        const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${uniqueFonts.map(f => 
            f.replace(/ /g, '+') + ':wght@400;500;600;700'
        ).join('&family=')}&display=swap`;

        // Check if already loaded
        const existingLink = document.querySelector(`link[href*="fonts.googleapis.com"]`);
        if (existingLink && existingLink.href.includes(fonts[0].replace(/ /g, '+'))) {
            return;
        }

        // Load fonts
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = googleFontsUrl;
        document.head.appendChild(link);
    }

    /**
     * Save theme preference to localStorage
     */
    function savePreference(themeId) {
        try {
            localStorage.setItem('worksuite-content-theme', themeId);
        } catch (e) {
            console.warn('Could not save theme preference:', e);
        }
    }

    /**
     * Load theme preference from localStorage
     */
    function loadPreference() {
        try {
            return localStorage.getItem('worksuite-content-theme') || 'midnight';
        } catch (e) {
            return 'midnight';
        }
    }

    // ==================== CUSTOM THEMES ====================
    
    const CUSTOM_THEMES_KEY = 'worksuite-custom-themes';
    let customThemes = {};
    
    /**
     * Load custom themes from localStorage
     */
    function loadCustomThemes() {
        try {
            const saved = localStorage.getItem(CUSTOM_THEMES_KEY);
            if (saved) {
                customThemes = JSON.parse(saved);
                // Register custom themes in the themes object
                Object.entries(customThemes).forEach(([id, theme]) => {
                    themes[id] = normalizeCustomTheme(theme);
                });
            }
        } catch (e) {
            console.warn('Could not load custom themes:', e);
        }
        return customThemes;
    }
    
    /**
     * Normalize a custom theme to match the expected format
     */
    function normalizeCustomTheme(theme) {
        // Convert colors from {hex, lightness, ...} format to just hex strings
        const colors = {};
        if (theme.colors) {
            Object.entries(theme.colors).forEach(([key, value]) => {
                colors[key] = typeof value === 'object' && value.hex ? value.hex : value;
            });
        }
        
        // Ensure required color properties exist
        const normalizedColors = {
            background: colors.background || colors.backgroundSolid || '#1a1a2e',
            backgroundSolid: colors.backgroundSolid || colors.background || '#1a1a2e',
            text: colors.text || '#e8e8e8',
            heading: colors.heading || colors.text || '#ffffff',
            accent: colors.accent || '#6366f1',
            accentAlt: colors.accentAlt || colors.accent || '#818cf8',
            muted: colors.muted || '#8888a0',
            link: colors.link || colors.accent || '#64ffda',
            codeBg: colors.codeBg || 'rgba(255, 255, 255, 0.08)',
            codeText: colors.codeText || colors.text || '#e8e8e8',
            blockquoteBorder: colors.blockquoteBorder || colors.accent || '#6366f1',
            blockquoteBg: colors.blockquoteBg || 'rgba(99, 102, 241, 0.1)',
            tableBorder: colors.tableBorder || '#2a2a4a',
            tableHeaderBg: colors.tableHeaderBg || 'rgba(255, 255, 255, 0.05)'
        };
        
        return {
            name: theme.name || 'Custom Theme',
            category: 'custom',
            description: 'Custom theme created in Theme Designer',
            fonts: {
                heading: theme.fonts?.heading || "'Space Grotesk', sans-serif",
                body: theme.fonts?.body || "'Inter', sans-serif",
                mono: theme.fonts?.mono || "'JetBrains Mono', monospace"
            },
            colors: normalizedColors,
            styles: {
                headingWeight: theme.styles?.headingWeight || 700,
                headingLetterSpacing: theme.styles?.headingLetterSpacing || '-0.02em',
                bodyLineHeight: theme.styles?.bodyLineHeight || 1.7,
                paragraphSpacing: theme.styles?.paragraphSpacing || '1.25em',
                borderRadius: theme.styles?.borderRadius || '8px'
            }
        };
    }
    
    /**
     * Save a custom theme to localStorage
     */
    function saveCustomTheme(theme) {
        if (!theme || !theme.id) {
            console.error('Invalid theme: missing id');
            return false;
        }
        
        try {
            // Load existing custom themes
            loadCustomThemes();
            
            // Save the raw theme data
            customThemes[theme.id] = theme;
            localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(customThemes));
            
            // Register normalized version in themes object
            themes[theme.id] = normalizeCustomTheme(theme);
            
            console.log('Custom theme saved:', theme.id);
            return true;
        } catch (e) {
            console.error('Could not save custom theme:', e);
            return false;
        }
    }
    
    /**
     * Delete a custom theme
     */
    function deleteCustomTheme(themeId) {
        try {
            loadCustomThemes();
            if (customThemes[themeId]) {
                delete customThemes[themeId];
                delete themes[themeId];
                localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(customThemes));
                return true;
            }
        } catch (e) {
            console.error('Could not delete custom theme:', e);
        }
        return false;
    }
    
    /**
     * Get all custom themes
     */
    function getCustomThemes() {
        loadCustomThemes();
        return { ...customThemes };
    }

    /**
     * Initialize with saved preference
     */
    function init(container) {
        // Load custom themes first
        loadCustomThemes();
        
        const savedTheme = loadPreference();
        loadFonts(savedTheme);
        if (container) {
            apply(savedTheme, container);
        }
        return savedTheme;
    }

    // ==================== PUBLIC API ====================
    
    return {
        themes,
        fontPresets,
        getThemes,
        getThemesByCategory,
        getTheme,
        getFontPresets,
        generateCSSVariables,
        apply,
        applyGlobal,
        loadFonts,
        savePreference,
        loadPreference,
        loadCustomThemes,
        saveCustomTheme,
        deleteCustomTheme,
        getCustomThemes,
        init
    };

})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkSuiteThemes;
}

