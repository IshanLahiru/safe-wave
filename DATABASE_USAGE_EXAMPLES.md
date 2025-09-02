# Database Management Usage Examples

Quick reference for common database management tasks in Safe Wave.

## Daily Development Workflow

### 1. Starting a New Feature
```bash
# Check current migration status
npm run migration:status

# Make your model changes in Python files
# Then create a migration
npm run migration:new "Add user profile fields"

# Apply the migration
npm run migration:run
```

### 2. Working with Existing Migrations
```bash
# See what migrations exist
npm run migration:history

# Check current database state
npm run migration:current

# Apply any pending migrations
npm run migration:run
```

### 3. Fixing Migration Issues During Development
```bash
# If you need to modify a recent migration
npm run migration:uncommit          # Remove the migration file
# Make your model changes
npm run migration:new "Fixed user profile fields"

# Or use the recreate command (does both steps)
npm run migration:recreate "Fixed user profile fields"
```

### 4. Rolling Back Changes
```bash
# Rollback the last migration
npm run migration:rollback

# Make your fixes, then create new migration
npm run migration:new "Fixed issue with user table"
```

## Database Reset Scenarios

### 1. Clean Development Reset
```bash
# Reset schema but keep database
npm run db:reset
```

### 2. Complete Fresh Start
```bash
# Completely recreate database
npm run db:recreate
```

### 3. Testing Migration Sequence
```bash
# Reset to test full migration chain
npm run db:reset

# Verify all migrations work
npm run migration:run
```

## Team Collaboration Scenarios

### 1. After Pulling New Code
```bash
# Check if there are new migrations
npm run migration:status

# Apply any pending migrations
npm run migration:run
```

### 2. Before Committing Schema Changes
```bash
# Create migration for your changes
npm run migration:new "Add authentication system"

# Test the migration
npm run migration:run

# Test rollback works
npm run migration:rollback

# Re-apply for development
npm run migration:run

# Commit both model changes and migration file
git add .
git commit -m "Add authentication system with migration"
```

### 3. Resolving Migration Conflicts
```bash
# Check current state
npm run migration:status
npm run migration:history

# If conflicts exist, coordinate with team
# Option 1: Reset and re-apply all
npm run db:reset

# Option 2: Manually resolve conflicts
# Edit migration files as needed
npm run migration:run
```

## Production Deployment Workflow

### 1. Pre-Deployment Check
```bash
# On staging environment
npm run migration:status
npm run migration:history

# Backup database (outside of these scripts)
# Apply migrations
npm run migration:run

# Verify application works
```

### 2. Deployment
```bash
# On production
npm run migration:status    # Check current state
npm run migration:run       # Apply new migrations
```

## Troubleshooting Common Issues

### 1. "No such revision" Error
```bash
# Check migration history
npm run migration:history

# Reset if needed
npm run db:reset
```

### 2. Database Connection Issues
```bash
# Verify environment
cat services/backend/.env | grep DATABASE_URL

# Test connection (manual)
cd services/backend
python -c "from app.database import engine; print('Connection OK')"
```

### 3. Migration File Conflicts
```bash
# Remove problematic migration
npm run migration:uncommit

# Create fresh migration
npm run migration:new "Resolved migration conflicts"
```

### 4. Schema Out of Sync
```bash
# Nuclear option - complete reset
npm run db:recreate

# Gentler option - schema reset
npm run db:reset
```

## Advanced Usage

### 1. Direct Alembic Commands
```bash
# For advanced users
cd services/backend
npm run alembic -- history --verbose
npm run alembic -- show <revision_id>
```

### 2. Custom Migration Scripts
```bash
# Create empty migration for custom SQL
cd services/backend
alembic revision -m "Custom data migration"
# Edit the generated file to add custom SQL
npm run migration:run
```

### 3. Multiple Database Environments
```bash
# Different environments use different DATABASE_URL
# Development
DATABASE_URL=postgresql://localhost/safewave_dev npm run migration:run

# Testing  
DATABASE_URL=postgresql://localhost/safewave_test npm run db:reset
```

## Quick Command Reference

| Task | Command |
|------|---------|
| Create migration | `npm run migration:new "message"` |
| Apply migrations | `npm run migration:run` |
| Rollback last | `npm run migration:rollback` |
| Show history | `npm run migration:history` |
| Check status | `npm run migration:status` |
| Reset schema | `npm run db:reset` |
| Recreate database | `npm run db:recreate` |
| Remove last migration | `npm run migration:uncommit` |
| Recreate last migration | `npm run migration:recreate "message"` |

## Best Practices Checklist

- ✅ Always check `migration:status` before making changes
- ✅ Test migrations with `migration:run` and `migration:rollback`
- ✅ Use descriptive migration messages
- ✅ Review generated migration files before committing
- ✅ Coordinate with team on schema changes
- ✅ Backup production databases before migrations
- ✅ Test migrations on staging before production
