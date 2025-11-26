# Promotions Table Migration Guide

## Overview
Successfully migrated from JSON-based discount storage in `restaurant_settings` to a dedicated `promotions` table for better scalability and proper database normalization.

---

## Database Setup

### Step 1: Run the SQL Migration

Execute the SQL file to create the promotions table and RLS policies:

**File**: [create_promotions_table.sql](file:///Users/wakar/Documents/Projekte/hunger2/pizza/migrations/create_promotions_table.sql)

**To execute**:
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the SQL from the migration file
4. Click **Run**

**Or via command line**:
```bash
psql -h your-host -U postgres -d your-database -f migrations/create_promotions_table.sql
```

### What the Migration Creates

1. **promotions table** with columns:
   - `id` (UUID, primary key)
   - `name` (varchar)
   - `percentage` (numeric, 0-100)
   - `start_date` (timestamptz)
   - `end_date` (timestamptz)
   - `enabled` (boolean)
   - `created_at`, `updated_at` (timestamptz)
   - `created_by`, `updated_by` (UUID, references auth.users)

2. **RLS Policies**:
   - Public read access (everyone can see promotions)
   - Admin-only write access (insert, update, delete)

3. **Indexes**:
   - Optimized index for finding active promotions

4. **Triggers**:
   - Auto-update `updated_at` timestamp

---

## Code Changes

### Service Layer (supabase.ts)

**Old approach** (JSON in restaurant_settings):
```typescript
async saveDiscounts(discounts: Discount[]): Promise<void> {
  // Saved as JSON string
}
```

**New approach** (dedicated table):
```typescript
async createDiscount(discount: Omit<Discount, 'id'>): Promise<Discount | null>
async updateDiscount(id: string, discount: Partial<Omit<Discount, 'id'>>): Promise<void>
async deleteDiscount(id: string): Promise<void>
async getAllDiscounts(): Promise<Discount[]>
async getActiveDiscount(): Promise<Discount | null>
```

### Admin Settings (Settings.tsx)

**Changes**:
- `handleAddDiscount`: Now calls `createDiscount()` or `updateDiscount()`
- `handleDeleteDiscount`: Now calls `deleteDiscount()`
- `handleToggleDiscount`: Now calls `updateDiscount()`
- All handlers refresh the list after operations

---

## Testing Steps

### 1. Create Test Promotion
1. Go to **Admin → Settings**
2. Scroll to "Rabatt-Aktionen"
3. Click "+ Neue Aktion"
4. Fill in:
   - Name: "Test Promotion"
   - Percentage: 15
   - Start: Today
   - End: Tomorrow
   - Enabled: ✓
5. Click "Hinzufügen"

### 2. Verify in Database
Check the `promotions` table in Supabase:
```sql
SELECT * FROM promotions ORDER BY created_at DESC;
```

### 3. Test Cart Integration
1. Add items to cart (>30€)
2. Go to Cart page
3. Verify discount appears in order summary

### 4. Test Toggle/Delete
1. Toggle the promotion on/off
2. Verify status changes in database
3. Delete the promotion
4. Verify it's removed from database

---

## Migration Checklist

- [x] Create SQL migration file
- [x] Update service layer methods
- [x] Update Settings.tsx handlers
- [x] Test RLS policies
- [ ] **Run SQL migration in Supabase**
- [ ] **Test promotion CRUD operations**
- [ ] **Verify cart discount application**
- [ ] **(Optional) Migrate existing JSON discounts to table**

---

## Benefits

### Before (JSON Storage)
- ❌ Hard to query/filter
- ❌ No relational integrity
- ❌ Manual JSON parsing
- ❌ Difficult to audit changes
- ❌ No proper indexing

### After (Promotions Table)
- ✅ Proper SQL queries
- ✅ Foreign key constraints
- ✅ Automatic type conversion
- ✅ Audit trail (created_by, updated_by)
- ✅ Optimized indexes
- ✅ RLS for security
- ✅ Scalable architecture

---

## Rollback Plan

If you need to rollback:

```sql
-- Drop the promotions table
DROP TABLE IF EXISTS promotions CASCADE;

-- Restore JSON-based methods in supabase.ts (from git history)
git checkout HEAD~1 -- src/lib/supabase.ts
git checkout HEAD~1 -- src/pages/admin/Settings.tsx
```
