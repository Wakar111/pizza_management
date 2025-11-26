-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Create index for active promotions query
CREATE INDEX idx_promotions_active ON promotions(enabled, start_date, end_date) 
WHERE enabled = true;

-- Enable Row Level Security
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read promotions (for displaying active discounts)
CREATE POLICY "Allow public read access to promotions"
ON promotions
FOR SELECT
TO public
USING (true);

-- Policy: Only admins can insert promotions
CREATE POLICY "Allow admin insert on promotions"
ON promotions
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- Policy: Only admins can update promotions
CREATE POLICY "Allow admin update on promotions"
ON promotions
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

-- Policy: Only admins can delete promotions
CREATE POLICY "Allow admin delete on promotions"
ON promotions
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- Optional: Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON promotions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
