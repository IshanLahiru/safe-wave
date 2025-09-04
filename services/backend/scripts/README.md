# Backend Scripts

This directory contains Python helper scripts for managing the Safe Wave backend.

## Scripts Overview

### `manage.py`
Database lifecycle management script for complex operations.

**Commands:**
- `db-reset` - Drop schema, recreate schema, run migrations
- `db-recreate` - Drop database, create database, run migrations  
- `migration-uncommit` - Remove last migration revision
- `migration-recreate` - Delete last migration and regenerate it

**Usage:**
```bash
python scripts/manage.py db-reset
python scripts/manage.py db-recreate
python scripts/manage.py migration-uncommit
python scripts/manage.py migration-recreate "Updated user model"
```

### `migration.py`
Migration management script for Alembic operations.

**Commands:**
- `new <message>` - Create a new migration with autogenerate
- `run` - Apply all pending migrations (upgrade to head)
- `rollback` - Rollback last migration (downgrade one step)
- `history` - Show migration history
- `current` - Show current migration head
- `status` - Show migration status

**Usage:**
```bash
python scripts/migration.py new "Add user table"
python scripts/migration.py run
python scripts/migration.py rollback
python scripts/migration.py history
```

### `seed_content.py`
Content seeding script that populates the database with initial stress-reduction content including categories, videos, meal plans, quotes, and articles.

**Features:**
- Creates 6 content categories (Meditation, Sleep, Stress Relief, etc.)
- Seeds 5 featured videos with YouTube integration
- Adds 2 meal plans with nutritional information
- Includes 5 inspirational quotes
- Creates 4 comprehensive articles with new schema fields

**Schema Support:**
- Supports all Article model fields including new additions:
  - `video_url` - Optional video content for articles
  - `author_bio` - Detailed author biography information
  - `updated_at` - Automatic timestamp tracking
- Handles existing content gracefully (skips if data exists)
- Compatible with current database schema and API endpoints

**Usage:**
```bash
python scripts/seed_content.py
```

### `seed_data.py`
User data seeding script for creating initial demo users (currently minimal).

**Usage:**
```bash
python scripts/seed_data.py
```

### `update_network_ip.py`
Network IP configuration script for cross-platform development.

**Usage:**
```bash
python scripts/update_network_ip.py
```

## NPM Script Integration

All scripts are integrated with npm scripts in `package.json`:

```bash
# Migration commands
npm run migration:new "message"
npm run migration:run
npm run migration:rollback
npm run migration:history

# Database commands
npm run db:reset
npm run db:recreate

# Seeding commands
npm run seed:content    # Seed stress-reduction content
npm run seed:data       # Seed user data

# Network configuration
npm run update-ip
```

## Turbo Integration

All commands work with Turborepo from the root directory:

```bash
# From project root
npm run migration:new "Add user table"
npm run db:reset
```

## Requirements

- Python 3.8+
- Alembic installed
- PostgreSQL (for database operations)
- Valid `.env` file with `DATABASE_URL`

## Documentation

See `docs/DATABASE_MANAGEMENT.md` for comprehensive documentation on database management workflows and best practices.
