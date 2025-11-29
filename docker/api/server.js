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
// Service-0 Integration Helpers
// ===========================================

/**
 * Fetch user's workspaces from Service-0 (by email lookup)
 */
async function fetchWorkspaces(email) {
    try {
        // First get the Service-0 user ID by email
        const userResponse = await fetch(`${SERVICE_0_URL}/api/v1/users/by-email/${encodeURIComponent(email)}`);
        if (!userResponse.ok) {
            console.log('User not found in Service-0:', email);
            return [];
        }
        const user = await userResponse.json();
        
        // Then get their workspaces
        const wsResponse = await fetch(`${SERVICE_0_URL}/api/v1/users/${user.user_id}/workspaces`);
        if (wsResponse.ok) {
            const data = await wsResponse.json();
            return data.workspaces || [];
        }
    } catch (err) {
        console.error('Failed to fetch workspaces from Service-0:', err.message);
    }
    return [];
}

/**
 * Create a workspace in Service-0 (owner_id should be Service-0 user_id)
 */
async function createWorkspace(name, ownerEmail, type = 'personal', description = null) {
    try {
        // First get the Service-0 user ID by email
        const userResponse = await fetch(`${SERVICE_0_URL}/api/v1/users/by-email/${encodeURIComponent(ownerEmail)}`);
        if (!userResponse.ok) {
            console.log('Cannot create workspace - user not in Service-0:', ownerEmail);
            return null;
        }
        const user = await userResponse.json();
        
        const response = await fetch(`${SERVICE_0_URL}/api/v1/workspaces`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, owner_id: user.user_id, type, description })
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (err) {
        console.error('Failed to create workspace in Service-0:', err.message);
    }
    return null;
}

/**
 * Register an item as a shared object in Service-0
 */
async function registerObject(workspaceId, item) {
    try {
        const response = await fetch(`${SERVICE_0_URL}/api/v1/objects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workspace_id: workspaceId,
                object_type: item.type || 'file',
                source_service: 'work-suite',
                source_id: item.id,
                name: item.name,
                metadata: {
                    app: item.app,
                    scope: item.scope,
                    status: item.status,
                    folder: item.folder
                }
            })
        });
        if (response.ok) {
            const obj = await response.json();
            return obj.object_id;
        }
    } catch (err) {
        console.error('Failed to register object in Service-0:', err.message);
    }
    return null;
}

/**
 * Update an object in Service-0
 */
async function updateObject(objectId, item) {
    try {
        const response = await fetch(`${SERVICE_0_URL}/api/v1/objects/${objectId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: item.name,
                metadata: {
                    app: item.app,
                    scope: item.scope,
                    status: item.status,
                    folder: item.folder
                }
            })
        });
        return response.ok;
    } catch (err) {
        console.error('Failed to update object in Service-0:', err.message);
    }
    return false;
}

/**
 * Delete an object from Service-0
 */
async function deleteObject(objectId) {
    try {
        const response = await fetch(`${SERVICE_0_URL}/api/v1/objects/${objectId}`, {
            method: 'DELETE'
        });
        return response.ok;
    } catch (err) {
        console.error('Failed to delete object from Service-0:', err.message);
    }
    return false;
}

/**
 * Get objects in a workspace from Service-0
 */
async function fetchWorkspaceObjects(workspaceId) {
    try {
        const response = await fetch(`${SERVICE_0_URL}/api/v1/objects?workspace_id=${workspaceId}`);
        if (response.ok) {
            return await response.json();
        }
    } catch (err) {
        console.error('Failed to fetch workspace objects from Service-0:', err.message);
    }
    return [];
}

/**
 * Register or sync a user with Service-0
 */
async function syncUserWithService0(userId, email, displayName, authentikSub) {
    try {
        // First check if user exists
        const checkResponse = await fetch(`${SERVICE_0_URL}/api/v1/users/by-email/${encodeURIComponent(email)}`);
        
        if (checkResponse.ok) {
            // User exists, return their data
            return await checkResponse.json();
        }
        
        // User doesn't exist, create them
        const createResponse = await fetch(`${SERVICE_0_URL}/api/v1/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                email: email,
                name: displayName,
                provider: 'authentik',
                provider_id: authentikSub,
                status: 'active'
            })
        });
        
        if (createResponse.ok) {
            const user = await createResponse.json();
            console.log(`✅ User synced with Service-0: ${email}`);
            
            // Create a default personal workspace for the user
            await createWorkspace(`${displayName}'s Workspace`, email, 'personal', 'Default personal workspace');
            
            return user;
        }
    } catch (err) {
        console.error('Failed to sync user with Service-0:', err.message);
    }
    return null;
}

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
        workspace_id TEXT,
        service0_object_id TEXT,
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

// Migration: Add workspace columns if they don't exist
try {
    db.exec('ALTER TABLE items ADD COLUMN workspace_id TEXT');
} catch (e) {
    // Column already exists, ignore
}
try {
    db.exec('ALTER TABLE items ADD COLUMN service0_object_id TEXT');
} catch (e) {
    // Column already exists, ignore
}

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
        const displayName = userInfo.name || userInfo.preferred_username;
        
        if (existingUser) {
            userId = existingUser.id;
            db.prepare(`
                UPDATE users SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            `).run(displayName, userId);
        } else {
            userId = uuidv4();
            db.prepare(`
                INSERT INTO users (id, email, password_hash, display_name)
                VALUES (?, ?, ?, ?)
            `).run(userId, userInfo.email, 'oauth-user', displayName);
        }
        
        // Sync user with Service-0 (async, don't block login)
        syncUserWithService0(userId, userInfo.email, displayName, userInfo.sub)
            .catch(err => console.error('Service-0 sync error:', err));
        
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
// Service-0 Integration (Workspaces & Objects)
// ===========================================

// Helper: Forward request to Service-0 with session
async function service0Request(method, path, body = null, sessionToken = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (sessionToken) {
        headers['X-Session-Token'] = sessionToken;
    }
    
    const options = {
        method,
        headers,
    };
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${SERVICE_0_URL}${path}`, options);
        const data = await response.json();
        return { ok: response.ok, status: response.status, data };
    } catch (err) {
        console.error('Service-0 request failed:', err.message);
        return { ok: false, status: 500, data: { error: 'Service unavailable' } };
    }
}

// Get current user's workspaces from Service-0
app.get('/api/workspaces', auth, async (req, res) => {
    try {
        // Use email-based lookup since Work Suite and Service-0 have different user IDs
        const workspaces = await fetchWorkspaces(req.user.email);
        res.json(workspaces);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new workspace
app.post('/api/workspaces', auth, async (req, res) => {
    try {
        const { name, description, type } = req.body;
        
        // Use email-based workspace creation
        const workspace = await createWorkspace(name, req.user.email, type || 'personal', description);
        
        if (workspace) {
            res.status(201).json(workspace);
        } else {
            res.status(500).json({ error: 'Failed to create workspace' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get workspace by ID
app.get('/api/workspaces/:workspaceId', auth, async (req, res) => {
    try {
        const result = await service0Request(
            'GET',
            `/api/v1/workspaces/${req.params.workspaceId}`
        );
        
        if (result.ok) {
            res.json(result.data);
        } else {
            res.status(result.status).json(result.data);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Register an object (file) with Service-0 for cross-service sharing
app.post('/api/objects', auth, async (req, res) => {
    try {
        const { workspace_id, item_id, name, object_type } = req.body;
        
        // Verify the item exists locally
        const item = db.prepare('SELECT * FROM items WHERE id = ?').get(item_id);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        // Register with Service-0
        const result = await service0Request('POST', '/api/v1/objects', {
            workspace_id,
            object_type: object_type || item.type || 'file',
            source_service: 'work-suite',
            source_id: item_id,
            name: name || item.name,
            metadata: {
                app: item.app,
                scope: item.scope,
                status: item.status,
                created_at: item.created_at
            }
        });
        
        if (result.ok) {
            // Update local item with Service-0 object ID
            db.prepare(`
                UPDATE items SET 
                    workspace_id = ?,
                    service0_object_id = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(workspace_id, result.data.object_id, item_id);
            
            res.status(201).json(result.data);
        } else {
            res.status(result.status).json(result.data);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get objects for a workspace
app.get('/api/objects', auth, async (req, res) => {
    try {
        const { workspace_id } = req.query;
        
        if (!workspace_id) {
            return res.status(400).json({ error: 'workspace_id required' });
        }
        
        const result = await service0Request(
            'GET',
            `/api/v1/objects?workspace_id=${workspace_id}`
        );
        
        if (result.ok) {
            // Enrich with local item data
            const objects = result.data.map(obj => {
                if (obj.source_service === 'work-suite') {
                    const localItem = db.prepare('SELECT * FROM items WHERE id = ?').get(obj.source_id);
                    if (localItem) {
                        return { ...obj, local_item: localItem };
                    }
                }
                return obj;
            });
            res.json(objects);
        } else {
            res.json([]);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sync user to Service-0 (create if not exists)
app.post('/api/sync-user', auth, async (req, res) => {
    try {
        // Check if user exists in Service-0
        const checkResult = await service0Request(
            'GET',
            `/api/v1/users/by-email/${encodeURIComponent(req.user.email)}`
        );
        
        if (checkResult.ok) {
            res.json({ synced: true, user: checkResult.data });
            return;
        }
        
        // Create user in Service-0
        const createResult = await service0Request('POST', '/api/v1/users', {
            user_id: req.user.id,
            email: req.user.email,
            display_name: req.user.name,
            auth_provider: 'authentik',
            auth_provider_id: req.user.authentik_sub
        });
        
        if (createResult.ok) {
            // Create default personal workspace
            const wsResult = await service0Request('POST', '/api/v1/workspaces', {
                name: 'My Work Suite',
                description: 'Personal workspace',
                owner_id: req.user.id,
                type: 'personal',
                settings: { source: 'work-suite', auto_created: true }
            });
            
            res.json({ 
                synced: true, 
                user: createResult.data,
                workspace: wsResult.ok ? wsResult.data : null
            });
        } else {
            res.status(createResult.status).json(createResult.data);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===========================================
// Items (Files/Content) Routes
// ===========================================
// Get single item by ID
app.get('/items/:id', optionalAuth, (req, res) => {
    try {
        const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        // Get tags
        const tags = db.prepare(`
            SELECT t.* FROM tags t
            JOIN item_tags it ON t.id = it.tag_id
            WHERE it.item_id = ?
        `).all(item.id);
        
        res.json({
            ...item,
            tags
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/items', optionalAuth, (req, res) => {
    try {
        const { scope, folder, status, app, tag, workspace_id } = req.query;
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
        if (workspace_id) {
            query += ' AND workspace_id = ?';
            params.push(workspace_id);
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

app.post('/items', optionalAuth, async (req, res) => {
    try {
        const { name, type, app, scope, folder, status, content, tags, workspace_id } = req.body;
        const id = uuidv4();
        
        db.prepare(`
            INSERT INTO items (id, name, type, app, scope, folder, status, content, owner_id, workspace_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, name, type, app, scope || 'me', folder, status || 'backlog', content, req.user?.id, workspace_id || null);
        
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
        
        let item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
        
        // If workspace provided, register with Service-0
        if (workspace_id && req.user) {
            const objectId = await registerObject(workspace_id, item);
            if (objectId) {
                db.prepare('UPDATE items SET service0_object_id = ? WHERE id = ?').run(objectId, id);
                item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
            }
        }
        
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/items/:id', optionalAuth, async (req, res) => {
    try {
        const { name, scope, folder, status, content, tags, workspace_id } = req.body;
        
        // Update workspace_id if provided
        if (workspace_id !== undefined) {
            db.prepare(`
                UPDATE items 
                SET name = COALESCE(?, name),
                    scope = COALESCE(?, scope),
                    folder = COALESCE(?, folder),
                    status = COALESCE(?, status),
                    content = COALESCE(?, content),
                    workspace_id = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(name, scope, folder, status, content, workspace_id, req.params.id);
        } else {
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
        }
        
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
        
        // Sync with Service-0 if item has an object ID
        if (item.service0_object_id) {
            await updateObject(item.service0_object_id, item);
        }
        
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/items/:id', optionalAuth, async (req, res) => {
    try {
        const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
        
        // Delete file if exists
        if (item?.file_path) {
            const fullPath = path.join(FILES_PATH, item.file_path);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }
        
        // Delete from Service-0 if registered
        if (item?.service0_object_id) {
            await deleteObject(item.service0_object_id);
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

// Note: Routes below without /api/ prefix are accessed through nginx which 
// strips /api/ when proxying, so /api/workspaces → /workspaces on this server

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
// LLM API - AI-Friendly Content Management
// ===========================================

// App schemas and documentation for LLMs
const APP_SCHEMAS = {
    slate: {
        name: 'Slate',
        description: 'Keyboard-first notes app',
        preferredFormat: 'markdown',
        schema: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Note title' },
                content: { type: 'string', description: 'Note content (Markdown supported)' },
                tags: { type: 'array', items: { type: 'string' }, description: 'Tags for organization' }
            },
            required: ['title', 'content']
        },
        example: {
            title: 'Meeting Notes',
            content: '# Q4 Planning Meeting\n\n## Attendees\n- Alice\n- Bob\n\n## Action Items\n- [ ] Review budget\n- [ ] Schedule follow-up',
            tags: ['meetings', 'planning']
        }
    },
    done: {
        name: 'Done',
        description: 'Kanban-style task board',
        preferredFormat: 'json',
        schema: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Board title' },
                theme: { type: 'string', enum: ['slate', 'ocean', 'forest', 'sunset', 'midnight'], default: 'slate' },
                columns: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            title: { type: 'string' },
                            cards: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        title: { type: 'string' },
                                        description: { type: 'string', description: 'Markdown supported' },
                                        due: { type: 'string', format: 'date' },
                                        labels: { type: 'array', items: { type: 'string' }, description: 'Hex colors like #3b82f6' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            required: ['title', 'columns']
        },
        example: {
            title: 'Sprint 42',
            theme: 'slate',
            columns: [
                { id: 'todo', title: 'To Do', cards: [
                    { id: 'card_1', title: 'Review PRs', description: 'Check pending pull requests', labels: ['#3b82f6'] }
                ]},
                { id: 'doing', title: 'In Progress', cards: [] },
                { id: 'done', title: 'Done', cards: [] }
            ]
        }
    },
    journey: {
        name: 'Journey',
        description: 'Timeline creator for roadmaps and histories',
        preferredFormat: 'json',
        schema: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Timeline title' },
                theme: { type: 'string', enum: ['slate', 'amber', 'emerald', 'rose', 'violet', 'cyan'], default: 'slate' },
                layout: { type: 'string', enum: ['vertical', 'horizontal'], default: 'vertical' },
                events: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'number' },
                            date: { type: 'string', description: 'Date or date range (e.g., "2024", "Jan 2024", "2024-01-15")' },
                            title: { type: 'string' },
                            description: { type: 'string' },
                            icon: { type: 'string', description: 'Emoji icon' }
                        }
                    }
                }
            },
            required: ['title', 'events']
        },
        example: {
            title: 'Project Roadmap 2024',
            theme: 'emerald',
            layout: 'vertical',
            events: [
                { id: 1, date: 'Q1 2024', title: 'Planning Phase', description: 'Requirements gathering and architecture design', icon: '📋' },
                { id: 2, date: 'Q2 2024', title: 'Development', description: 'Core feature implementation', icon: '⚙️' },
                { id: 3, date: 'Q3 2024', title: 'Beta Launch', description: 'Public beta release', icon: '🚀' }
            ]
        }
    },
    merman: {
        name: 'Merman',
        description: 'Markdown editor with Mermaid diagram support',
        preferredFormat: 'markdown',
        schema: {
            type: 'object',
            properties: {
                content: { type: 'string', description: 'Markdown content with optional Mermaid diagrams in ```mermaid blocks' }
            },
            required: ['content']
        },
        markdownConventions: {
            mermaidBlock: '```mermaid\\ngraph TD\\n  A --> B\\n```',
            supportedDiagrams: ['flowchart', 'sequence', 'classDiagram', 'stateDiagram', 'erDiagram', 'gantt', 'pie']
        },
        example: {
            content: '# System Architecture\\n\\n## Overview\\n\\nThis document describes our system architecture.\\n\\n```mermaid\\ngraph TD\\n    A[Client] --> B[API Gateway]\\n    B --> C[Auth Service]\\n    B --> D[Data Service]\\n    D --> E[(Database)]\\n```\\n\\n## Components\\n\\n- **API Gateway**: Routes requests\\n- **Auth Service**: Handles authentication\\n- **Data Service**: Business logic'
        }
    },
    pointer: {
        name: 'Pointer',
        description: 'Markdown slide presenter',
        preferredFormat: 'markdown',
        schema: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Presentation title' },
                theme: { type: 'string', enum: ['midnight', 'light', 'ocean', 'forest', 'sunset', 'lavender', 'monochrome', 'hacker'], default: 'midnight' },
                slides: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'number' },
                            layout: { type: 'string', enum: ['title', 'content', 'two-column', 'image-left', 'image-right', 'quote', 'code', 'section'] },
                            content: { type: 'string', description: 'Markdown content for the slide' }
                        }
                    }
                }
            },
            required: ['title', 'slides']
        },
        markdownConventions: {
            slideSeparator: '---',
            titleSlide: '# Main Title\\n\\n## Subtitle',
            contentSlide: '# Slide Title\\n\\n- Point 1\\n- Point 2',
            twoColumnSlide: '# Title\\n\\n::left::\\nLeft content\\n\\n::right::\\nRight content'
        },
        example: {
            title: 'AI in Healthcare',
            theme: 'midnight',
            slides: [
                { id: 1, layout: 'title', content: '# AI in Healthcare\\n\\n## Transforming Modern Medicine' },
                { id: 2, layout: 'content', content: '# Key Applications\\n\\n- Diagnostic imaging analysis\\n- Drug discovery acceleration\\n- Personalized treatment plans\\n- Administrative automation' },
                { id: 3, layout: 'quote', content: '> "AI will be the stethoscope of the 21st century"\\n\\n— Healthcare Futurist' }
            ]
        }
    },
    metric: {
        name: 'Metric',
        description: 'Lightweight spreadsheet with formulas and charts',
        preferredFormat: 'json',
        schema: {
            type: 'object',
            properties: {
                title: { type: 'string' },
                cells: { 
                    type: 'object', 
                    description: 'Cell values keyed by cell reference (A1, B2, etc.)',
                    additionalProperties: { type: ['string', 'number'] }
                },
                formulas: {
                    type: 'object',
                    description: 'Formulas keyed by cell reference',
                    additionalProperties: { type: 'string' }
                },
                columnWidths: { type: 'object' },
                charts: { type: 'array' }
            },
            required: ['cells']
        },
        formulaReference: {
            supported: ['SUM', 'AVG', 'MIN', 'MAX', 'COUNT', 'ROUND', 'SQRT', 'POW'],
            syntax: '=FUNCTION(range) e.g., =SUM(A1:A10)',
            rangeFormat: 'A1:B5 or A1,B2,C3'
        },
        example: {
            title: 'Q4 Budget',
            cells: {
                'A1': 'Category', 'B1': 'Budget', 'C1': 'Actual', 'D1': 'Variance',
                'A2': 'Marketing', 'B2': 50000, 'C2': 48000,
                'A3': 'Engineering', 'B3': 120000, 'C3': 125000,
                'A4': 'Operations', 'B4': 30000, 'C4': 28000,
                'A5': 'Total'
            },
            formulas: {
                'D2': '=C2-B2',
                'D3': '=C3-B3',
                'D4': '=C4-B4',
                'B5': '=SUM(B2:B4)',
                'C5': '=SUM(C2:C4)',
                'D5': '=SUM(D2:D4)'
            }
        }
    },
    theme: {
        name: 'Theme Designer',
        description: 'Create custom color themes for Work Suite apps',
        preferredFormat: 'json',
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Theme name' },
                colors: {
                    type: 'object',
                    properties: {
                        background: { type: 'string', description: 'Main background color (hex)' },
                        surface: { type: 'string', description: 'Card/surface background' },
                        text: { type: 'string', description: 'Primary text color' },
                        textMuted: { type: 'string', description: 'Secondary/muted text' },
                        heading: { type: 'string', description: 'Heading text color' },
                        accent: { type: 'string', description: 'Primary accent color' },
                        accentHover: { type: 'string', description: 'Accent hover state' },
                        border: { type: 'string', description: 'Border color' },
                        link: { type: 'string', description: 'Link color' }
                    },
                    required: ['background', 'text', 'accent']
                },
                fonts: {
                    type: 'object',
                    properties: {
                        heading: { type: 'string', description: 'Google Font name for headings' },
                        body: { type: 'string', description: 'Google Font name for body text' }
                    }
                }
            },
            required: ['name', 'colors']
        },
        example: {
            name: 'Ocean Breeze',
            colors: {
                background: '#0a1628',
                surface: '#1a2a3f',
                text: '#e8f1f8',
                textMuted: '#8ba3b9',
                heading: '#ffffff',
                accent: '#3b82f6',
                accentHover: '#60a5fa',
                border: '#2a3f5f',
                link: '#60a5fa'
            },
            fonts: {
                heading: 'Space Grotesk',
                body: 'Inter'
            }
        }
    }
};

// File/Tags schema
const FILE_SCHEMA = {
    type: 'object',
    properties: {
        name: { type: 'string', description: 'File/item name' },
        app: { type: 'string', enum: ['slate', 'done', 'journey', 'merman', 'pointer', 'metric', 'theme'], description: 'Which app this content is for' },
        scope: { type: 'string', enum: ['me', 'us', 'we', 'there'], default: 'me', description: 'Access scope: me=private, us=specific people, we=team, there=external' },
        folder: { type: 'string', description: 'Folder path (e.g., "Projects/2024")' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for organization' },
        status: { type: 'string', enum: ['backlog', 'in-progress', 'done', 'closed'], default: 'backlog' },
        content: { type: 'object', description: 'The actual content (format depends on app)' },
        workspace_id: { type: 'string', description: 'Service-0 workspace ID (optional)' }
    },
    required: ['name', 'app', 'content']
};

// ===========================================
// LLM API - Help & Discovery
// ===========================================

// Main help endpoint - describes all capabilities
app.get('/api/llm/help', (req, res) => {
    res.json({
        name: 'Work Suite LLM API',
        version: '1.0.0',
        description: 'AI-friendly API for creating and managing content across Work Suite apps. All apps support Markdown-centric formats optimized for LLM generation.',
        
        apps: Object.entries(APP_SCHEMAS).reduce((acc, [key, schema]) => {
            acc[key] = {
                name: schema.name,
                description: schema.description,
                preferredFormat: schema.preferredFormat,
                schemaEndpoint: `/api/llm/schema/${key}`,
                exampleEndpoint: `/api/llm/example/${key}`
            };
            return acc;
        }, {}),
        
        endpoints: {
            discovery: {
                'GET /api/llm/help': 'This help document',
                'GET /api/llm/schema/:app': 'Get JSON schema for an app',
                'GET /api/llm/example/:app': 'Get example content for an app'
            },
            content: {
                'POST /api/llm/content/:app': 'Create new content for an app',
                'GET /api/llm/content/:id': 'Get content by ID',
                'PUT /api/llm/content/:id': 'Update content',
                'DELETE /api/llm/content/:id': 'Delete content'
            },
            files: {
                'GET /api/llm/files': 'List all files (supports filters: app, scope, status, tags, folder)',
                'POST /api/llm/files': 'Create a new file with metadata',
                'GET /api/llm/files/:id': 'Get file with content',
                'PUT /api/llm/files/:id': 'Update file metadata',
                'PUT /api/llm/files/:id/content': 'Update file content only',
                'DELETE /api/llm/files/:id': 'Delete file'
            },
            organization: {
                'GET /api/llm/folders': 'List all folders',
                'GET /api/llm/tags': 'List all tags',
                'POST /api/llm/files/:id/tags': 'Add tags to a file',
                'PUT /api/llm/files/:id/move': 'Move file to folder/scope'
            },
            search: {
                'GET /api/llm/search': 'Search files (params: q, app, scope, status, tags)'
            },
            batch: {
                'POST /api/llm/batch/create': 'Create multiple files',
                'POST /api/llm/batch/update': 'Update multiple files',
                'POST /api/llm/batch/move': 'Move multiple files',
                'POST /api/llm/batch/tag': 'Tag multiple files'
            },
            themes: {
                'GET /api/llm/themes': 'List available themes',
                'POST /api/llm/themes': 'Create a new theme'
            }
        },
        
        tips: [
            'Use the preferredFormat (markdown or json) for best results',
            'For Pointer presentations, separate slides with ---',
            'For Merman diagrams, use ```mermaid code blocks',
            'All content is automatically saved to the Tags file manager',
            'Use workspace_id to associate content with Service-0 workspaces'
        ]
    });
});

// Get schema for a specific app
app.get('/api/llm/schema/:app', (req, res) => {
    const { app } = req.params;
    const schema = APP_SCHEMAS[app];
    
    if (!schema) {
        return res.status(404).json({ 
            error: 'App not found',
            availableApps: Object.keys(APP_SCHEMAS)
        });
    }
    
    res.json({
        app,
        name: schema.name,
        description: schema.description,
        preferredFormat: schema.preferredFormat,
        schema: schema.schema,
        ...(schema.markdownConventions && { markdownConventions: schema.markdownConventions }),
        ...(schema.formulaReference && { formulaReference: schema.formulaReference })
    });
});

// Get example content for a specific app
app.get('/api/llm/example/:app', (req, res) => {
    const { app } = req.params;
    const schema = APP_SCHEMAS[app];
    
    if (!schema) {
        return res.status(404).json({ 
            error: 'App not found',
            availableApps: Object.keys(APP_SCHEMAS)
        });
    }
    
    res.json({
        app,
        name: schema.name,
        example: schema.example,
        note: `This is a valid ${schema.preferredFormat} example you can use as a template`
    });
});

// ===========================================
// LLM API - Content Creation
// ===========================================

// Helper: Parse markdown to Pointer slides
function parseMarkdownToSlides(markdown) {
    const slides = markdown.split(/\n---\n/).map((slideContent, index) => {
        let layout = 'content';
        const trimmed = slideContent.trim();
        
        // Detect layout from content
        if (index === 0 && trimmed.match(/^#\s+.+\n+##?\s+/)) {
            layout = 'title';
        } else if (trimmed.includes('::left::') && trimmed.includes('::right::')) {
            layout = 'two-column';
        } else if (trimmed.startsWith('>')) {
            layout = 'quote';
        } else if (trimmed.includes('```') && trimmed.split('```').length > 2) {
            layout = 'code';
        }
        
        return {
            id: index + 1,
            layout,
            content: trimmed
        };
    });
    
    return slides;
}

// Helper: Parse markdown to Journey events
function parseMarkdownToEvents(markdown) {
    const events = [];
    const lines = markdown.split('\n');
    let currentEvent = null;
    
    for (const line of lines) {
        // Match patterns like "## 2024: Title" or "## Q1 2024 - Title"
        const dateMatch = line.match(/^##\s+(.+?)(?::\s*|\s+-\s+)(.+)$/);
        if (dateMatch) {
            if (currentEvent) events.push(currentEvent);
            currentEvent = {
                id: events.length + 1,
                date: dateMatch[1].trim(),
                title: dateMatch[2].trim(),
                description: '',
                icon: '📌'
            };
        } else if (currentEvent && line.trim() && !line.startsWith('#')) {
            // Check for icon at start of description
            const iconMatch = line.match(/^([🎉🚀📋⚙️✅❌🔄📈📉🎯💡🔧📦🌟⭐💰🎨📝✨🔥💪🏆🎁📊📅⏰🔔💬📧📱💻🖥️🌐🔒🔓]+)\s*(.*)$/);
            if (iconMatch) {
                currentEvent.icon = iconMatch[1];
                currentEvent.description += iconMatch[2] + ' ';
            } else {
                currentEvent.description += line.trim() + ' ';
            }
        }
    }
    if (currentEvent) events.push(currentEvent);
    
    return events.map(e => ({ ...e, description: e.description.trim() }));
}

// Create content for a specific app
app.post('/api/llm/content/:app', optionalAuth, (req, res) => {
    try {
        const { app } = req.params;
        const schema = APP_SCHEMAS[app];
        
        if (!schema) {
            return res.status(404).json({ 
                error: 'App not found',
                availableApps: Object.keys(APP_SCHEMAS)
            });
        }
        
        let content = req.body;
        const contentType = req.get('Content-Type') || '';
        
        // Handle markdown input for compatible apps
        if (contentType.includes('text/markdown') || req.body.markdown) {
            const markdown = req.body.markdown || req.body;
            
            if (app === 'pointer') {
                const slides = parseMarkdownToSlides(markdown);
                content = {
                    title: req.body.title || 'Untitled Presentation',
                    theme: req.body.theme || 'midnight',
                    slides
                };
            } else if (app === 'journey') {
                const events = parseMarkdownToEvents(markdown);
                content = {
                    title: req.body.title || 'Untitled Timeline',
                    theme: req.body.theme || 'slate',
                    layout: req.body.layout || 'vertical',
                    events
                };
            } else if (app === 'merman') {
                content = { content: markdown };
            } else if (app === 'slate') {
                content = {
                    title: req.body.title || 'Untitled Note',
                    content: markdown,
                    tags: req.body.tags || []
                };
            }
        }
        
        // Create the item in the database
        const id = uuidv4();
        const name = content.title || content.name || `Untitled ${schema.name}`;
        
        db.prepare(`
            INSERT INTO items (id, name, type, app, scope, folder, status, content, owner_id, workspace_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            name,
            'file',
            app,
            req.body.scope || 'me',
            req.body.folder || null,
            req.body.status || 'backlog',
            JSON.stringify(content),
            req.user?.id || null,
            req.body.workspace_id || null
        );
        
        // Handle tags
        if (req.body.tags && req.body.tags.length > 0) {
            const insertTag = db.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)');
            const linkTag = db.prepare('INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)');
            
            req.body.tags.forEach(tagName => {
                const tagId = uuidv4();
                insertTag.run(tagId, tagName);
                const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName);
                if (tag) linkTag.run(id, tag.id);
            });
        }
        
        const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
        
        res.status(201).json({
            success: true,
            id: item.id,
            name: item.name,
            app: item.app,
            content: JSON.parse(item.content),
            scope: item.scope,
            status: item.status,
            created_at: item.created_at,
            openUrl: `/${app}.html?tags_id=${id}`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get content by ID
app.get('/api/llm/content/:id', optionalAuth, (req, res) => {
    try {
        const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
        
        if (!item) {
            return res.status(404).json({ error: 'Content not found' });
        }
        
        // Get tags
        const tags = db.prepare(`
            SELECT t.name FROM tags t
            JOIN item_tags it ON t.id = it.tag_id
            WHERE it.item_id = ?
        `).all(item.id).map(t => t.name);
        
        res.json({
            id: item.id,
            name: item.name,
            app: item.app,
            content: item.content ? JSON.parse(item.content) : null,
            scope: item.scope,
            folder: item.folder,
            status: item.status,
            tags,
            workspace_id: item.workspace_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            openUrl: `/${item.app}.html?tags_id=${item.id}`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update content
app.put('/api/llm/content/:id', optionalAuth, (req, res) => {
    try {
        const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
        
        if (!item) {
            return res.status(404).json({ error: 'Content not found' });
        }
        
        const { name, content, scope, folder, status, tags, workspace_id } = req.body;
        
        db.prepare(`
            UPDATE items 
            SET name = COALESCE(?, name),
                content = COALESCE(?, content),
                scope = COALESCE(?, scope),
                folder = COALESCE(?, folder),
                status = COALESCE(?, status),
                workspace_id = COALESCE(?, workspace_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            name,
            content ? JSON.stringify(content) : null,
            scope,
            folder,
            status,
            workspace_id,
            req.params.id
        );
        
        // Update tags if provided
        if (tags) {
            db.prepare('DELETE FROM item_tags WHERE item_id = ?').run(req.params.id);
            const insertTag = db.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)');
            const linkTag = db.prepare('INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)');
            
            tags.forEach(tagName => {
                const tagId = uuidv4();
                insertTag.run(tagId, tagName);
                const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName);
                if (tag) linkTag.run(req.params.id, tag.id);
            });
        }
        
        const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
        res.json({
            success: true,
            id: updated.id,
            name: updated.name,
            updated_at: updated.updated_at
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete content
app.delete('/api/llm/content/:id', optionalAuth, (req, res) => {
    try {
        const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
        
        if (!item) {
            return res.status(404).json({ error: 'Content not found' });
        }
        
        db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
        res.json({ success: true, deleted: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===========================================
// LLM API - Files (Tags) Management
// ===========================================

// List files with filters
app.get('/api/llm/files', optionalAuth, (req, res) => {
    try {
        const { app, scope, status, folder, tags: tagFilter, limit = 100, offset = 0 } = req.query;
        
        let query = 'SELECT * FROM items WHERE 1=1';
        const params = [];
        
        if (app) {
            query += ' AND app = ?';
            params.push(app);
        }
        if (scope) {
            query += ' AND scope = ?';
            params.push(scope);
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        if (folder) {
            query += ' AND folder = ?';
            params.push(folder);
        }
        
        query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        let items = db.prepare(query).all(...params);
        
        // Get tags for each item
        const getTagsStmt = db.prepare(`
            SELECT t.name FROM tags t
            JOIN item_tags it ON t.id = it.tag_id
            WHERE it.item_id = ?
        `);
        
        items = items.map(item => ({
            id: item.id,
            name: item.name,
            app: item.app,
            scope: item.scope,
            folder: item.folder,
            status: item.status,
            tags: getTagsStmt.all(item.id).map(t => t.name),
            workspace_id: item.workspace_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            openUrl: `/${item.app}.html?tags_id=${item.id}`
        }));
        
        // Filter by tags if specified
        if (tagFilter) {
            const filterTags = tagFilter.split(',');
            items = items.filter(item => 
                filterTags.some(t => item.tags.includes(t))
            );
        }
        
        res.json({
            files: items,
            total: items.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create file with full metadata
app.post('/api/llm/files', optionalAuth, (req, res) => {
    try {
        const { name, app, content, scope, folder, tags, status, workspace_id } = req.body;
        
        if (!name || !app || !content) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['name', 'app', 'content']
            });
        }
        
        if (!APP_SCHEMAS[app]) {
            return res.status(400).json({
                error: 'Invalid app',
                validApps: Object.keys(APP_SCHEMAS)
            });
        }
        
        const id = uuidv4();
        
        db.prepare(`
            INSERT INTO items (id, name, type, app, scope, folder, status, content, owner_id, workspace_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            name,
            'file',
            app,
            scope || 'me',
            folder || null,
            status || 'backlog',
            JSON.stringify(content),
            req.user?.id || null,
            workspace_id || null
        );
        
        // Handle tags
        if (tags && tags.length > 0) {
            const insertTag = db.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)');
            const linkTag = db.prepare('INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)');
            
            tags.forEach(tagName => {
                const tagId = uuidv4();
                insertTag.run(tagId, tagName);
                const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName);
                if (tag) linkTag.run(id, tag.id);
            });
        }
        
        const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
        
        res.status(201).json({
            success: true,
            file: {
                id: item.id,
                name: item.name,
                app: item.app,
                scope: item.scope,
                folder: item.folder,
                status: item.status,
                tags: tags || [],
                created_at: item.created_at,
                openUrl: `/${app}.html?tags_id=${id}`
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get file by ID (alias for /api/llm/content/:id)
app.get('/api/llm/files/:id', optionalAuth, (req, res) => {
    try {
        const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
        
        if (!item) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        const tags = db.prepare(`
            SELECT t.name FROM tags t
            JOIN item_tags it ON t.id = it.tag_id
            WHERE it.item_id = ?
        `).all(item.id).map(t => t.name);
        
        res.json({
            id: item.id,
            name: item.name,
            app: item.app,
            content: item.content ? JSON.parse(item.content) : null,
            scope: item.scope,
            folder: item.folder,
            status: item.status,
            tags,
            workspace_id: item.workspace_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            openUrl: `/${item.app}.html?tags_id=${item.id}`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update file metadata
app.put('/api/llm/files/:id', optionalAuth, (req, res) => {
    try {
        const { name, scope, folder, status, tags, workspace_id } = req.body;
        
        db.prepare(`
            UPDATE items 
            SET name = COALESCE(?, name),
                scope = COALESCE(?, scope),
                folder = COALESCE(?, folder),
                status = COALESCE(?, status),
                workspace_id = COALESCE(?, workspace_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(name, scope, folder, status, workspace_id, req.params.id);
        
        if (tags) {
            db.prepare('DELETE FROM item_tags WHERE item_id = ?').run(req.params.id);
            const insertTag = db.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)');
            const linkTag = db.prepare('INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)');
            
            tags.forEach(tagName => {
                const tagId = uuidv4();
                insertTag.run(tagId, tagName);
                const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName);
                if (tag) linkTag.run(req.params.id, tag.id);
            });
        }
        
        res.json({ success: true, updated: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update file content only
app.put('/api/llm/files/:id/content', optionalAuth, (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'content field required' });
        }
        
        db.prepare(`
            UPDATE items 
            SET content = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(JSON.stringify(content), req.params.id);
        
        res.json({ success: true, updated: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete file
app.delete('/api/llm/files/:id', optionalAuth, (req, res) => {
    try {
        db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
        res.json({ success: true, deleted: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===========================================
// LLM API - Organization
// ===========================================

// List all folders
app.get('/api/llm/folders', optionalAuth, (req, res) => {
    try {
        const folders = db.prepare(`
            SELECT DISTINCT folder FROM items 
            WHERE folder IS NOT NULL AND folder != ''
            ORDER BY folder
        `).all().map(f => f.folder);
        
        res.json({ folders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List all tags
app.get('/api/llm/tags', optionalAuth, (req, res) => {
    try {
        const tags = db.prepare(`
            SELECT t.name, COUNT(it.item_id) as count
            FROM tags t
            LEFT JOIN item_tags it ON t.id = it.tag_id
            GROUP BY t.id
            ORDER BY count DESC
        `).all();
        
        res.json({ tags });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add tags to file
app.post('/api/llm/files/:id/tags', optionalAuth, (req, res) => {
    try {
        const { tags } = req.body;
        
        if (!tags || !Array.isArray(tags)) {
            return res.status(400).json({ error: 'tags array required' });
        }
        
        const insertTag = db.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)');
        const linkTag = db.prepare('INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)');
        
        tags.forEach(tagName => {
            const tagId = uuidv4();
            insertTag.run(tagId, tagName);
            const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName);
            if (tag) linkTag.run(req.params.id, tag.id);
        });
        
        res.json({ success: true, added: tags });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Move file
app.put('/api/llm/files/:id/move', optionalAuth, (req, res) => {
    try {
        const { folder, scope, status } = req.body;
        
        db.prepare(`
            UPDATE items 
            SET folder = COALESCE(?, folder),
                scope = COALESCE(?, scope),
                status = COALESCE(?, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(folder, scope, status, req.params.id);
        
        res.json({ success: true, moved: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===========================================
// LLM API - Search
// ===========================================

app.get('/api/llm/search', optionalAuth, (req, res) => {
    try {
        const { q, app, scope, status, tags: tagFilter, limit = 50 } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'q (query) parameter required' });
        }
        
        let query = `
            SELECT * FROM items 
            WHERE (name LIKE ? OR content LIKE ?)
        `;
        const params = [`%${q}%`, `%${q}%`];
        
        if (app) {
            query += ' AND app = ?';
            params.push(app);
        }
        if (scope) {
            query += ' AND scope = ?';
            params.push(scope);
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY updated_at DESC LIMIT ?';
        params.push(parseInt(limit));
        
        let items = db.prepare(query).all(...params);
        
        // Get tags and filter
        const getTagsStmt = db.prepare(`
            SELECT t.name FROM tags t
            JOIN item_tags it ON t.id = it.tag_id
            WHERE it.item_id = ?
        `);
        
        items = items.map(item => ({
            id: item.id,
            name: item.name,
            app: item.app,
            scope: item.scope,
            status: item.status,
            tags: getTagsStmt.all(item.id).map(t => t.name),
            updated_at: item.updated_at,
            openUrl: `/${item.app}.html?tags_id=${item.id}`
        }));
        
        if (tagFilter) {
            const filterTags = tagFilter.split(',');
            items = items.filter(item => 
                filterTags.some(t => item.tags.includes(t))
            );
        }
        
        res.json({
            query: q,
            results: items,
            total: items.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===========================================
// LLM API - Batch Operations
// ===========================================

// Batch create
app.post('/api/llm/batch/create', optionalAuth, (req, res) => {
    try {
        const { items } = req.body;
        
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'items array required' });
        }
        
        const created = [];
        const errors = [];
        
        items.forEach((item, index) => {
            try {
                if (!item.name || !item.app || !item.content) {
                    errors.push({ index, error: 'Missing required fields (name, app, content)' });
                    return;
                }
                
                const id = uuidv4();
                db.prepare(`
                    INSERT INTO items (id, name, type, app, scope, folder, status, content, owner_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    id, item.name, 'file', item.app,
                    item.scope || 'me', item.folder || null,
                    item.status || 'backlog',
                    JSON.stringify(item.content),
                    req.user?.id || null
                );
                
                created.push({ id, name: item.name, app: item.app });
            } catch (err) {
                errors.push({ index, error: err.message });
            }
        });
        
        res.status(201).json({
            success: true,
            created,
            errors: errors.length > 0 ? errors : undefined,
            total: created.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Batch update
app.post('/api/llm/batch/update', optionalAuth, (req, res) => {
    try {
        const { updates } = req.body;
        
        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({ error: 'updates array required' });
        }
        
        const updated = [];
        const errors = [];
        
        updates.forEach((update, index) => {
            try {
                if (!update.id) {
                    errors.push({ index, error: 'id required' });
                    return;
                }
                
                db.prepare(`
                    UPDATE items 
                    SET name = COALESCE(?, name),
                        scope = COALESCE(?, scope),
                        folder = COALESCE(?, folder),
                        status = COALESCE(?, status),
                        content = COALESCE(?, content),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).run(
                    update.name,
                    update.scope,
                    update.folder,
                    update.status,
                    update.content ? JSON.stringify(update.content) : null,
                    update.id
                );
                
                updated.push(update.id);
            } catch (err) {
                errors.push({ index, error: err.message });
            }
        });
        
        res.json({
            success: true,
            updated,
            errors: errors.length > 0 ? errors : undefined,
            total: updated.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Batch move
app.post('/api/llm/batch/move', optionalAuth, (req, res) => {
    try {
        const { ids, folder, scope, status } = req.body;
        
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ error: 'ids array required' });
        }
        
        const placeholders = ids.map(() => '?').join(',');
        
        db.prepare(`
            UPDATE items 
            SET folder = COALESCE(?, folder),
                scope = COALESCE(?, scope),
                status = COALESCE(?, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id IN (${placeholders})
        `).run(folder, scope, status, ...ids);
        
        res.json({ success: true, moved: ids.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Batch tag
app.post('/api/llm/batch/tag', optionalAuth, (req, res) => {
    try {
        const { ids, tags, action = 'add' } = req.body;
        
        if (!ids || !Array.isArray(ids) || !tags || !Array.isArray(tags)) {
            return res.status(400).json({ error: 'ids and tags arrays required' });
        }
        
        const insertTag = db.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)');
        const linkTag = db.prepare('INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)');
        const unlinkTag = db.prepare('DELETE FROM item_tags WHERE item_id = ? AND tag_id = ?');
        
        tags.forEach(tagName => {
            const tagId = uuidv4();
            insertTag.run(tagId, tagName);
            const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName);
            
            if (tag) {
                ids.forEach(itemId => {
                    if (action === 'add') {
                        linkTag.run(itemId, tag.id);
                    } else if (action === 'remove') {
                        unlinkTag.run(itemId, tag.id);
                    }
                });
            }
        });
        
        res.json({ 
            success: true, 
            action,
            items: ids.length,
            tags: tags.length 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===========================================
// LLM API - Themes
// ===========================================

app.get('/api/llm/themes', optionalAuth, (req, res) => {
    try {
        const themes = db.prepare('SELECT * FROM themes ORDER BY name').all();
        res.json({
            themes: themes.map(t => ({
                id: t.id,
                name: t.name,
                data: JSON.parse(t.data),
                is_public: !!t.is_public,
                created_at: t.created_at
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/llm/themes', optionalAuth, (req, res) => {
    try {
        const { name, colors, fonts } = req.body;
        
        if (!name || !colors) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['name', 'colors']
            });
        }
        
        const id = uuidv4();
        const data = { name, colors, fonts: fonts || {} };
        
        db.prepare(`
            INSERT INTO themes (id, name, data, owner_id, is_public)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, name, JSON.stringify(data), req.user?.id, req.body.is_public ? 1 : 0);
        
        res.status(201).json({
            success: true,
            theme: {
                id,
                name,
                colors,
                fonts: fonts || {}
            }
        });
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

