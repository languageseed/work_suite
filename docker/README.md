# Work Suite Docker Deployment

Lightweight containerized deployment for Work Suite on seed server.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    seed:8500                        │
│                  (nginx - Web UI)                   │
└─────────────────────┬───────────────────────────────┘
                      │ /api/*
                      ▼
┌─────────────────────────────────────────────────────┐
│                    seed:8501                        │
│              (Node.js API Server)                   │
│         SQLite + Filesystem Storage                 │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              /zfs/data/work_suite                   │
│                   (ZFS Storage)                     │
│  ├── worksuite.db    (SQLite database)              │
│  └── files/          (User content)                 │
│      ├── me/         (Private)                      │
│      ├── us/         (Shared with specific people)  │
│      ├── we/         (Team/group)                   │
│      └── there/      (External/common)              │
└─────────────────────────────────────────────────────┘
```

## Ports

| Port | Service | Description |
|------|---------|-------------|
| 8500 | nginx | Web UI |
| 8501 | node | API Server |

## Quick Start

```bash
# SSH to seed
ssh seed

# Create ZFS dataset (already created)
# sudo zfs create tank/data/work_suite

# Clone repo to ZFS storage
cd /zfs/data/work_suite
git clone https://github.com/languageseed/work_suite.git app

# Start containers
cd app/docker
docker compose up -d

# View logs
docker compose logs -f
```

## Environment Variables

Create a `.env` file in the docker directory:

```bash
# Required
JWT_SECRET=your-secure-secret-here

# Optional: AI Integration
AI_PROVIDER=none
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

## API Endpoints

### Health
- `GET /health` - Health check

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login

### Items (Files/Content)
- `GET /items` - List items (with filters: scope, folder, status, app, tag)
- `POST /items` - Create item
- `PUT /items/:id` - Update item
- `DELETE /items/:id` - Delete item

### Files
- `POST /upload` - Upload file

### Tags
- `GET /tags` - List all tags

### Themes
- `GET /themes` - List themes
- `POST /themes` - Create theme

### WebSocket
- `ws://seed:8501/ws` - Real-time sync

## Management

```bash
# Stop
docker compose down

# Restart
docker compose restart

# Rebuild after code changes
docker compose up -d --build

# View API logs
docker logs -f worksuite-api

# Backup database
cp /zfs/data/work_suite/worksuite.db /zfs/data/work_suite/backups/worksuite-$(date +%Y%m%d).db
```

## Storage Scopes

| Scope | Description | Access |
|-------|-------------|--------|
| `me` | Private files | Owner only |
| `us` | Shared files | Specific people |
| `we` | Team files | Team/group members |
| `there` | External | Common area |

