# Database Management Guide

This guide covers the comprehensive database management system for Safe Wave, including Alembic migrations and database lifecycle operations.

## Overview

The database management system provides:
- **Migration Management**: Create, apply, rollback, and manage Alembic migrations
- **Database Lifecycle**: Reset schemas, recreate databases, and manage database state
- **Team-Friendly Scripts**: Easy-to-use commands with clear documentation
- **Turbo Integration**: All commands work seamlessly with Turborepo

## Quick Reference

### Migration Commands

```bash
# Create a new migration
npm run migration:new "Add user table"

# Apply all pending migrations
npm run migration:run

# Rollback last migration
npm run migration:rollback

# Show migration history
npm run migration:history

# Show current migration status
npm run migration:status

# Recreate last migration (useful during development)
npm run migration:recreate "Updated user model"

# Remove last migration file (if not applied)
npm run migration:uncommit
```

### Database Lifecycle Commands

```bash
# Reset database schema (drop all tables, recreate, run migrations)
npm run db:reset

# Recreate entire database (drop database, create database, run migrations)
npm run db:recreate
```

## Detailed Command Reference

### Migration Management

#### `migration:new <message>`
Creates a new migration with Alembic's autogenerate feature.

**What it does:**
- Compares current database schema with SQLAlchemy models
- Generates migration script with detected changes
- Creates new revision file in `alembic/versions/`

**Usage:**
```bash
npm run migration:new "Add user authentication"
```

**When to use:**
- After modifying SQLAlchemy models
- When adding new tables, columns, or constraints
- Before deploying schema changes

#### `migration:run`
Applies all pending migrations to bring database up to date.

**What it does:**
- Runs all unapplied migrations in order
- Updates `alembic_version` table
- Brings database schema to latest version

**Usage:**
```bash
npm run migration:run
```

**When to use:**
- After pulling new migrations from git
- During deployment
- When setting up a new environment

#### `migration:rollback`
Rolls back the last applied migration.

**What it does:**
- Reverts the most recent migration
- Downgrades database by one migration step
- Updates `alembic_version` table

**Usage:**
```bash
npm run migration:rollback
```

**When to use:**
- When a migration causes issues
- During development to test migration reversibility
- To undo recent schema changes

#### `migration:history`
Shows complete migration history with details.

**What it does:**
- Displays all migrations in chronological order
- Shows revision IDs, messages, and dates
- Indicates which migrations are applied

**Usage:**
```bash
npm run migration:history
```

#### `migration:status`
Shows current migration status and pending migrations.

**What it does:**
- Displays current database head
- Shows latest available migration
- Indicates if migrations are pending

**Usage:**
```bash
npm run migration:status
```

#### `migration:recreate <message>`
Removes the last migration and creates a new one (development helper).

**What it does:**
- Deletes the most recent migration file
- Generates a new migration with current changes
- Useful when iterating on schema during development

**Usage:**
```bash
npm run migration:recreate "Updated user model with new fields"
```

**When to use:**
- During development when refining migrations
- When you need to modify a migration that hasn't been shared
- To clean up migration history before committing

#### `migration:uncommit`
Removes the last migration revision file.

**What it does:**
- Deletes the most recent migration file from filesystem
- Does not affect database state
- Useful for removing unwanted migrations

**Usage:**
```bash
npm run migration:uncommit
```

**When to use:**
- To remove a migration that was created by mistake
- When you want to delete a migration that hasn't been applied
- To clean up before creating a proper migration

### Database Lifecycle Management

#### `db:reset`
Resets the database schema while preserving the database itself.

**What it does:**
- Drops all tables in current schema
- Runs all migrations from scratch
- Preserves database and user permissions

**Usage:**
```bash
npm run db:reset
```

**When to use:**
- During development to start with clean schema
- When migration history is corrupted
- To test full migration sequence

#### `db:recreate`
Completely recreates the database from scratch.

**What it does:**
- Drops the entire database
- Creates a new empty database
- Runs all migrations from beginning

**Usage:**
```bash
npm run db:recreate
```

**When to use:**
- When database is corrupted beyond repair
- To start completely fresh
- During initial setup

**Requirements:**
- PostgreSQL `psql` command must be available
- Database user must have CREATE/DROP database permissions

## Direct Alembic Access

For advanced users, direct Alembic commands are also available:

```bash
# Direct Alembic commands (run from services/backend)
npm run alembic -- revision --autogenerate -m "message"
npm run alembic:upgrade
npm run alembic:downgrade
npm run alembic:history
npm run alembic:current
```

## File Structure

```
services/backend/
├── scripts/
│   ├── manage.py          # Database lifecycle management
│   └── migration.py       # Migration management
├── alembic/
│   ├── versions/          # Migration files
│   ├── env.py            # Alembic environment
│   └── alembic.ini       # Alembic configuration
└── docs/
    └── DATABASE_MANAGEMENT.md  # This file
```

## Best Practices

### Development Workflow

1. **Make model changes** in SQLAlchemy models
2. **Create migration**: `npm run migration:new "Description"`
3. **Review migration** file in `alembic/versions/`
4. **Test migration**: `npm run migration:run`
5. **Test rollback**: `npm run migration:rollback`
6. **Re-apply**: `npm run migration:run`
7. **Commit** both model changes and migration file

### Team Collaboration

1. **Always review** migration files before committing
2. **Test migrations** on development database first
3. **Coordinate** with team when making schema changes
4. **Use descriptive messages** for migration names
5. **Don't modify** committed migration files

### Production Deployment

1. **Backup database** before applying migrations
2. **Test migrations** on staging environment first
3. **Use** `npm run migration:status` to check pending migrations
4. **Apply migrations** with `npm run migration:run`
5. **Verify** application works after migration

## Troubleshooting

### Common Issues

**Migration conflicts:**
```bash
# Check current status
npm run migration:status

# View history
npm run migration:history

# Resolve conflicts manually or reset
npm run db:reset
```

**Database connection issues:**
- Verify `DATABASE_URL` in `.env` file
- Check database server is running
- Verify user permissions

**Migration file issues:**
```bash
# Remove problematic migration
npm run migration:uncommit

# Create new migration
npm run migration:new "Fixed migration"
```

## Environment Variables

Required environment variables in `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/safewave
```

The scripts automatically read from:
1. Environment variables
2. `.env` file in `services/backend/`

## Support

For issues or questions:
1. Check this documentation
2. Review migration files in `alembic/versions/`
3. Use `npm run migration:status` for current state
4. Consult team lead for complex migration issues
