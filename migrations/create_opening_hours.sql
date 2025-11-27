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
