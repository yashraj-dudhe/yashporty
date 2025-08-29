-- PRODUCTION RLS SETUP FOR CONTACT FORM
-- Run this SQL in your Supabase dashboard before deploying

-- Ensure the table exists
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON contact_submissions;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON contact_submissions;
DROP POLICY IF EXISTS "contact_form_insert_policy" ON contact_submissions;
DROP POLICY IF EXISTS "authenticated_read_policy" ON contact_submissions;
DROP POLICY IF EXISTS "public_insert_policy" ON contact_submissions;

-- Create policy to allow anonymous users to insert contact form data
CREATE POLICY "anonymous_contact_insert" ON contact_submissions
FOR INSERT 
TO anon
WITH CHECK (true);

-- Create policy to allow authenticated users to read submissions (for admin)
CREATE POLICY "authenticated_read_all" ON contact_submissions
FOR SELECT 
TO authenticated
USING (true);

-- Verify policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'contact_submissions';

-- Test the setup with a sample insert (this should work)
-- You can uncomment this to test:
-- INSERT INTO contact_submissions (name, email, subject, message) 
-- VALUES ('Test User', 'test@example.com', 'Test Subject', 'This is a test message from production setup.');

-- Check if the insert worked
-- SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT 1;
