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
