/**
 * Work Suite API Server
 * Lightweight backend with SQLite + Filesystem storage
 */

const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const cookieParser = require('cookie-parser');

// ===========================================
// Configuration
// ===========================================
const PORT = process.env.PORT || 3000;
const DATA_PATH = process.env.DATA_PATH || '/data';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const DB_PATH = path.join(DATA_PATH, 'worksuite.db');
const FILES_PATH = path.join(DATA_PATH, 'files');

// Authentik OAuth2 Configuration
const AUTHENTIK_URL = process.env.AUTHENTIK_URL || 'http://192.168.0.110:9500';
const AUTHENTIK_CLIENT_ID = process.env.AUTHENTIK_CLIENT_ID || 'work-suite';
const AUTHENTIK_CLIENT_SECRET = process.env.AUTHENTIK_CLIENT_SECRET || '';
const AUTHENTIK_CALLBACK_URL = process.env.AUTHENTIK_CALLBACK_URL || 'http://192.168.0.110:8500/api/auth/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://192.168.0.110:8500';

// Service-0 Core Platform (for session validation & workspaces)
const SERVICE_0_URL = process.env.SERVICE_0_URL || 'http://192.168.0.110:8001';

// ===========================================
// Initialize Storage Directories
// ===========================================
const SCOPES = ['me', 'us', 'we', 'there'];
SCOPES.forEach(scope => {
    const scopePath = path.join(FILES_PATH, scope);
    if (!fs.existsSync(scopePath)) {
        fs.mkdirSync(scopePath, { recursive: true });
    }
});

// ===========================================
// Database Setup
// ===========================================
const db = new Database(DB_PATH);

db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Files/Items table (Tags app data)
    CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        app TEXT,
        scope TEXT DEFAULT 'me',
        folder TEXT,
        status TEXT DEFAULT 'backlog',
        content TEXT,
        file_path TEXT,
        owner_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Tags table
    CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT
    );

    -- Item-Tags junction
    CREATE TABLE IF NOT EXISTS item_tags (
        item_id TEXT,
        tag_id TEXT,
        PRIMARY KEY (item_id, tag_id),
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    -- Shares table (for 'us' scope)
    CREATE TABLE IF NOT EXISTS shares (
        id TEXT PRIMARY KEY,
        item_id TEXT,
        user_id TEXT,
        permission TEXT DEFAULT 'read',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    -- Themes table
    CREATE TABLE IF NOT EXISTS themes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data TEXT NOT NULL,
        owner_id TEXT,
        is_public INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
`);

// ===========================================
// Express App Setup
// ===========================================
const app = express();
app.use(cors({
    origin: [FRONTEND_URL, 'http://localhost:8500'],
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));

// File upload config
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const scope = req.body.scope || 'me';
            const folder = req.body.folder || '';
            const destPath = path.join(FILES_PATH, scope, folder);
            fs.mkdirSync(destPath, { recursive: true });
            cb(null, destPath);
        },
        filename: (req, file, cb) => {
            const uniqueName = `${Date.now()}-${file.originalname}`;
            cb(null, uniqueName);
        }
    }),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// ===========================================
// Auth Middleware
// ===========================================
const auth = (req, res, next) => {
    // Check Bearer token first (for API clients)
    const bearerToken = req.headers.authorization?.replace('Bearer ', '');
    // Then check session cookie (for browser clients)
    const sessionToken = req.cookies?.worksuite_session;
    
    const token = bearerToken || sessionToken;
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Optional auth - sets user if token present (from header or cookie)
const optionalAuth = (req, res, next) => {
    const bearerToken = req.headers.authorization?.replace('Bearer ', '');
    const sessionToken = req.cookies?.worksuite_session;
    const token = bearerToken || sessionToken;
    
    if (token) {
        try {
            req.user = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            // Ignore invalid token
        }
    }
    next();
};

// ===========================================
// Health Check
// ===========================================
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        version: '1.0.0',
        storage: DATA_PATH
    });
});

// ===========================================
// Auth Routes
// ===========================================
app.post('/auth/register', async (req, res) => {
    try {
        const { email, password, displayName } = req.body;
        const id = uuidv4();
        const passwordHash = await bcrypt.hash(password, 10);
        
        db.prepare(`
            INSERT INTO users (id, email, password_hash, display_name)
            VALUES (?, ?, ?, ?)
        `).run(id, email, passwordHash, displayName || email.split('@')[0]);
        
        const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id, email, displayName } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        
        if (!user || !await bcrypt.compare(password, user.password_hash)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, email: user.email, displayName: user.display_name } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===========================================
// OAuth2/Authentik SSO Routes
// ===========================================

// Initiate OAuth2 login - redirects to Authentik
app.get('/api/auth/login', (req, res) => {
    const state = uuidv4(); // CSRF protection
    const returnUrl = req.query.return || '/';
    
    // Store state and return URL in a cookie for verification
    res.cookie('oauth_state', state, { 
        httpOnly: true, 
        maxAge: 600000, // 10 minutes
        sameSite: 'lax'
    });
    res.cookie('oauth_return', returnUrl, { 
        httpOnly: true, 
        maxAge: 600000,
        sameSite: 'lax'
    });
    
    const authUrl = new URL(`${AUTHENTIK_URL}/application/o/authorize/`);
    authUrl.searchParams.set('client_id', AUTHENTIK_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', AUTHENTIK_CALLBACK_URL);
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('state', state);
    
    res.redirect(authUrl.toString());
});

// OAuth2 callback - exchanges code for tokens
app.get('/api/auth/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        const storedState = req.cookies.oauth_state;
        const returnUrl = req.cookies.oauth_return || '/';
        
        // Verify state to prevent CSRF
        if (!state || state !== storedState) {
            return res.status(400).send('Invalid state parameter');
        }
        
        // Clear the state cookies
        res.clearCookie('oauth_state');
        res.clearCookie('oauth_return');
        
        // Exchange authorization code for tokens
        const tokenResponse = await fetch(`${AUTHENTIK_URL}/application/o/token/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: AUTHENTIK_CALLBACK_URL,
                client_id: AUTHENTIK_CLIENT_ID,
                client_secret: AUTHENTIK_CLIENT_SECRET,
            }),
        });
        
        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('Token exchange failed:', error);
            return res.status(401).send('Authentication failed');
        }
        
        const tokens = await tokenResponse.json();
        
        // Get user info from Authentik
        const userInfoResponse = await fetch(`${AUTHENTIK_URL}/application/o/userinfo/`, {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
            },
        });
        
        if (!userInfoResponse.ok) {
            return res.status(401).send('Failed to get user info');
        }
        
        const userInfo = await userInfoResponse.json();
        
        // Create or update local user record
        const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(userInfo.email);
        let userId;
        
        if (existingUser) {
            userId = existingUser.id;
            db.prepare(`
                UPDATE users SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            `).run(userInfo.name || userInfo.preferred_username, userId);
        } else {
            userId = uuidv4();
            db.prepare(`
                INSERT INTO users (id, email, password_hash, display_name)
                VALUES (?, ?, ?, ?)
            `).run(userId, userInfo.email, 'oauth-user', userInfo.name || userInfo.preferred_username);
        }
        
        // Create a session token
        const sessionToken = jwt.sign({
            id: userId,
            email: userInfo.email,
            name: userInfo.name || userInfo.preferred_username,
            authentik_sub: userInfo.sub,
        }, JWT_SECRET, { expiresIn: '7d' });
        
        // Set session cookie
        res.cookie('worksuite_session', sessionToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: 'lax',
            secure: process.env.SECURE_COOKIES === 'true',
        });
        
        // Also store tokens for potential API calls
        res.cookie('worksuite_access_token', tokens.access_token, {
            httpOnly: true,
            maxAge: tokens.expires_in * 1000,
            sameSite: 'lax',
            secure: process.env.SECURE_COOKIES === 'true',
        });
        
        // Redirect to frontend
        res.redirect(FRONTEND_URL + returnUrl);
    } catch (err) {
        console.error('OAuth callback error:', err);
        res.status(500).send('Authentication error');
    }
});

// Get current session info
app.get('/api/auth/session', (req, res) => {
    const sessionToken = req.cookies.worksuite_session;
    
    if (!sessionToken) {
        return res.json({ authenticated: false });
    }
    
    try {
        const decoded = jwt.verify(sessionToken, JWT_SECRET);
        res.json({
            authenticated: true,
            user: {
                id: decoded.id,
                email: decoded.email,
                name: decoded.name,
            }
        });
    } catch (err) {
        res.clearCookie('worksuite_session');
        res.json({ authenticated: false });
    }
});

// Logout - clear session
app.get('/api/auth/logout', (req, res) => {
    res.clearCookie('worksuite_session');
    res.clearCookie('worksuite_access_token');
    
    // Redirect to Authentik logout (optional - for full SSO logout)
    const logoutUrl = `${AUTHENTIK_URL}/application/o/work-suite/end-session/`;
    res.redirect(logoutUrl);
});

// Simple logout without Authentik redirect
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('worksuite_session');
    res.clearCookie('worksuite_access_token');
    res.json({ success: true });
});

// ===========================================
// Items (Files/Content) Routes
// ===========================================
app.get('/items', optionalAuth, (req, res) => {
    try {
        const { scope, folder, status, app, tag } = req.query;
        let query = 'SELECT * FROM items WHERE 1=1';
        const params = [];
        
        if (scope) {
            query += ' AND scope = ?';
            params.push(scope);
        }
        if (folder) {
            query += ' AND folder = ?';
            params.push(folder);
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        if (app) {
            query += ' AND app = ?';
            params.push(app);
        }
        
        query += ' ORDER BY updated_at DESC';
        
        let items = db.prepare(query).all(...params);
        
        // Attach tags to each item
        const getTagsStmt = db.prepare(`
            SELECT t.* FROM tags t
            JOIN item_tags it ON t.id = it.tag_id
            WHERE it.item_id = ?
        `);
        
        items = items.map(item => ({
            ...item,
            tags: getTagsStmt.all(item.id)
        }));
        
        // Filter by tag if specified
        if (tag) {
            items = items.filter(item => 
                item.tags.some(t => t.id === tag || t.name === tag)
            );
        }
        
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/items', optionalAuth, (req, res) => {
    try {
        const { name, type, app, scope, folder, status, content, tags } = req.body;
        const id = uuidv4();
        
        db.prepare(`
            INSERT INTO items (id, name, type, app, scope, folder, status, content, owner_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, name, type, app, scope || 'me', folder, status || 'backlog', content, req.user?.id);
        
        // Add tags
        if (tags && tags.length > 0) {
            const insertTag = db.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)');
            const linkTag = db.prepare('INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)');
            
            tags.forEach(tagName => {
                const tagId = uuidv4();
                insertTag.run(tagId, tagName);
                const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName);
                linkTag.run(id, tag.id);
            });
        }
        
        const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/items/:id', optionalAuth, (req, res) => {
    try {
        const { name, scope, folder, status, content, tags } = req.body;
        
        db.prepare(`
            UPDATE items 
            SET name = COALESCE(?, name),
                scope = COALESCE(?, scope),
                folder = COALESCE(?, folder),
                status = COALESCE(?, status),
                content = COALESCE(?, content),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(name, scope, folder, status, content, req.params.id);
        
        // Update tags if provided
        if (tags) {
            db.prepare('DELETE FROM item_tags WHERE item_id = ?').run(req.params.id);
            const insertTag = db.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)');
            const linkTag = db.prepare('INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)');
            
            tags.forEach(tagName => {
                const tagId = uuidv4();
                insertTag.run(tagId, tagName);
                const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName);
                linkTag.run(req.params.id, tag.id);
            });
        }
        
        const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/items/:id', optionalAuth, (req, res) => {
    try {
        const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
        if (item?.file_path) {
            const fullPath = path.join(FILES_PATH, item.file_path);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }
        db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===========================================
// File Upload
// ===========================================
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        const { scope, folder, name, app } = req.body;
        const id = uuidv4();
        const filePath = path.join(scope || 'me', folder || '', req.file.filename);
        
        db.prepare(`
            INSERT INTO items (id, name, type, app, scope, folder, file_path)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            name || req.file.originalname,
            'file',
            app,
            scope || 'me',
            folder,
            filePath
        );
        
        const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===========================================
// Tags Routes
// ===========================================
app.get('/tags', (req, res) => {
    try {
        const tags = db.prepare('SELECT * FROM tags ORDER BY name').all();
        res.json(tags);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===========================================
// Themes Routes
// ===========================================
app.get('/themes', optionalAuth, (req, res) => {
    try {
        let query = 'SELECT * FROM themes WHERE is_public = 1';
        if (req.user) {
            query += ' OR owner_id = ?';
        }
        const themes = req.user 
            ? db.prepare(query).all(req.user.id)
            : db.prepare(query).all();
        res.json(themes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/themes', optionalAuth, (req, res) => {
    try {
        const { name, data, isPublic } = req.body;
        const id = uuidv4();
        
        db.prepare(`
            INSERT INTO themes (id, name, data, owner_id, is_public)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, name, JSON.stringify(data), req.user?.id, isPublic ? 1 : 0);
        
        const theme = db.prepare('SELECT * FROM themes WHERE id = ?').get(id);
        res.json(theme);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===========================================
// HTTP Server + WebSocket
// ===========================================
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Simple broadcast for real-time sync
wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
        // Broadcast to all other clients
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === 1) {
                client.send(message.toString());
            }
        });
    });
    
    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
});

// ===========================================
// Start Server
// ===========================================
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║         🧰 Work Suite API Server          ║
╠═══════════════════════════════════════════╣
║  Port:     ${PORT}                           ║
║  Storage:  ${DATA_PATH.padEnd(28)}║
║  Database: SQLite                         ║
╚═══════════════════════════════════════════╝
    `);
});

