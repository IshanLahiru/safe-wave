# Database Seeding Schema Update

## Overview

This document outlines the updates made to the database seeding files to support the new Article model schema changes that were implemented to fix the index page content loading issue.

## Schema Changes Made

### Article Model Updates

The following fields were added to the `Article` model in `app/models/content.py`:

1. **`video_url`** - `Column(String, nullable=True)`
   - Stores optional video URLs for articles
   - Can be null for text-only articles
   - Used by the API to provide video content alongside articles

2. **`author_bio`** - `Column(Text, nullable=True)`
   - Stores detailed author biography information
   - Can be null if no bio is available
   - Provides additional context about article authors

3. **`updated_at`** - `Column(DateTime(timezone=True), onupdate=func.now())`
   - Automatically tracks when articles are modified
   - Auto-populated by the database on updates
   - Used for content management and API responses

## Database Migrations

The following migrations were created and applied with proper versioning:

1. **Migration 003** (`003_add_video_url_to_articles.py`): Added `video_url` column to articles table
2. **Migration 004** (`004_add_author_bio_and_updated_at_to_articles.py`): Added `author_bio` and `updated_at` columns to articles table

**Migration Versioning:**
- Follows the established pattern: `001`, `002`, `003`, `004`
- Consistent with existing migration naming convention
- Proper revision chain: `001 -> 002 -> 003 -> 004`

## Seeding Script Updates

### `services/backend/scripts/seed_content.py`

**Changes Made:**
- Updated article creation to include all new schema fields
- Added realistic `author_bio` content for seeded articles
- Set appropriate `video_url` values (null for text articles, URLs for video content)
- Added duplicate content detection to prevent seeding conflicts
- Expanded article collection from 2 to 4 articles for better testing

**New Articles Added:**
1. "Mindful Eating: Transform Your Relationship with Food"
2. "Digital Detox: Reclaiming Your Mental Space"

**Schema Field Examples:**
```python
{
    "title": "Article Title",
    "author": "Author Name",
    "author_bio": "Detailed author biography...",  # NEW
    "video_url": "https://youtube.com/watch?v=...",  # NEW
    # updated_at is auto-populated by database
    # ... other existing fields
}
```

### `services/backend/scripts/seed_data.py`

**Status:** No changes required
- This script only handles user data, not content
- Article schema changes don't affect user seeding

## NPM Script Integration

Added new npm scripts to `package.json`:

```json
{
  "scripts": {
    "seed:content": "python scripts/seed_content.py",
    "seed:data": "python scripts/seed_data.py"
  }
}
```

## Usage Instructions

### For New Installations

```bash
# 1. Run migrations to create tables with new schema
npm run migration:run

# 2. Seed content with updated schema
npm run seed:content

# 3. Seed user data (optional)
npm run seed:data
```

### For Existing Installations

```bash
# 1. Apply new migrations (if not already done)
npm run migration:run

# 2. Seeding will skip if content exists
npm run seed:content
# Output: "Content already exists. Skipping seeding to avoid duplicates."
```

### For Fresh Database Setup

```bash
# 1. Reset database completely
npm run db:reset

# 2. Seed with updated schema
npm run seed:content
npm run seed:data
```

## API Compatibility

The updated seeding ensures that:

✅ **All API endpoints work correctly** with seeded data
✅ **Home content endpoint** returns complete article data
✅ **New schema fields** are properly populated or null
✅ **Existing functionality** remains unchanged
✅ **No breaking changes** to API responses

## Testing Verification

The seeding updates have been tested to ensure:

1. **Schema Compatibility**: All new fields are accessible
2. **API Serialization**: Articles serialize correctly for API responses  
3. **Database Integrity**: No constraint violations or data issues
4. **Backward Compatibility**: Existing code continues to work
5. **Error Handling**: Graceful handling of existing content

## Troubleshooting

### "Content already exists" Message

This is normal behavior. The seeding script detects existing content and skips seeding to prevent duplicates.

**To re-seed:**
```bash
# Option 1: Reset database completely
npm run db:reset
npm run seed:content

# Option 2: Use fresh database
# (Create new database and update DATABASE_URL)
npm run migration:run
npm run seed:content
```

### Migration Errors

If you encounter migration errors:
```bash
# Check current migration status
npm run migration:status

# Apply pending migrations
npm run migration:run

# If issues persist, recreate migrations
npm run migration:recreate "Add missing article fields"
```

## Migration Versioning Fix

**Issue:** Initial migrations were created with auto-generated hash names that didn't follow the established versioning pattern.

**Solution:**
- Removed auto-generated migrations: `b881b76a96af_*` and `b601889cc18f_*`
- Created properly versioned migrations: `003_*` and `004_*`
- Maintained consistent naming convention with existing migrations
- Ensured proper revision chain and rollback functionality

**Migration History:**
```
001 -> 002 -> 003 -> 004 (head)
```

## Files Modified

1. `services/backend/scripts/seed_content.py` - Updated article seeding
2. `services/backend/package.json` - Added npm scripts
3. `services/backend/scripts/README.md` - Updated documentation
4. `services/backend/alembic/versions/003_add_video_url_to_articles.py` - New migration
5. `services/backend/alembic/versions/004_add_author_bio_and_updated_at_to_articles.py` - New migration
6. `services/backend/SEEDING_SCHEMA_UPDATE.md` - This documentation

## Next Steps

- The seeding scripts are now fully compatible with the new schema
- New installations will automatically get the correct article structure
- Existing installations can continue using current data
- Future article additions should include the new fields for consistency
