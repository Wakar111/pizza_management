-- Create opening_hours table
CREATE TABLE IF NOT EXISTS opening_hours (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    period_index INTEGER NOT NULL DEFAULT 0 CHECK (period_index >= 0 AND period_index <= 1),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(day_of_week, period_index)
);

-- Enable Row Level Security
ALTER TABLE opening_hours ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to allow re-running the script
DROP POLICY IF EXISTS "Public can view opening hours" ON opening_hours;
DROP POLICY IF EXISTS "Admins can insert opening hours" ON opening_hours;
DROP POLICY IF EXISTS "Admins can update opening hours" ON opening_hours;
DROP POLICY IF EXISTS "Admins can delete opening hours" ON opening_hours;

-- Policy: Anyone can read opening hours
CREATE POLICY "Public can view opening hours"
    ON opening_hours
    FOR SELECT
    TO public
    USING (true);

-- Policy: Only admins can insert opening hours
CREATE POLICY "Admins can insert opening hours"
    ON opening_hours
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Policy: Only admins can update opening hours
CREATE POLICY "Admins can update opening hours"
    ON opening_hours
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Policy: Only admins can delete opening hours
CREATE POLICY "Admins can delete opening hours"
    ON opening_hours
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );



-- Restaurant Settings Table
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_name = 'restaurant_settings';


alter table restaurant_settings
  add column plz text,
  add column city text;


select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where tablename = 'restaurant_settings';

DROP POLICY IF EXISTS "Allow public to view delivery areas" ON restaurant_settings;
DROP POLICY IF EXISTS "Allow public to view settings" ON restaurant_settings;
DROP POLICY IF EXISTS "Allow admin users to insert delivery areas" ON restaurant_settings;
DROP POLICY IF EXISTS "Allow admin users to update settings" ON restaurant_settings;
DROP POLICY IF EXISTS "Allow admin users to delete delivery areas" ON restaurant_settings;



-- 1. Allow everyone to view delivery areas
CREATE POLICY "Allow public to view delivery areas"
ON restaurant_settings
FOR SELECT
TO public
USING (plz IS NOT NULL AND city IS NOT NULL);

-- 2. Allow everyone to view general settings
CREATE POLICY "Allow public to view settings"
ON restaurant_settings
FOR SELECT
TO public
USING (setting_key IS NOT NULL);

-- 3. Allow admin users to insert delivery areas
CREATE POLICY "Allow admin users to insert delivery areas"
ON restaurant_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- 4. Allow admin users to update settings
CREATE POLICY "Allow admin users to update settings"
ON restaurant_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- 5. Allow admin users to delete delivery areas
CREATE POLICY "Allow admin users to delete delivery areas"
ON restaurant_settings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);