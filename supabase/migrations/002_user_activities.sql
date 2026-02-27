-- Migration: Create user_activities table
-- Description: Store user activity logs with RLS for privacy

-- Create the user_activities table
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    activity_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.user_activities IS 'Stores user activity logs for tracking and analytics';
COMMENT ON COLUMN public.user_activities.activity_type IS 'Type of activity: login, cv_update, step_completed, mood_submitted, job_saved, application_sent, etc.';
COMMENT ON COLUMN public.user_activities.activity_data IS 'Optional JSON data with additional activity details';

-- Create index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);

-- Create index for faster queries by activity type
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(activity_type);

-- Create index for faster time-based queries
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_activities_user_type_time ON public.user_activities(user_id, activity_type, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own activities
CREATE POLICY "Users can view their own activities"
    ON public.user_activities
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can only insert their own activities
CREATE POLICY "Users can insert their own activities"
    ON public.user_activities
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users cannot update activities (immutable log)
CREATE POLICY "Users cannot update activities"
    ON public.user_activities
    FOR UPDATE
    USING (false);

-- Policy: Users cannot delete activities (immutable log)
CREATE POLICY "Users cannot delete activities"
    ON public.user_activities
    FOR DELETE
    USING (false);

-- Optional: Create a function to auto-cleanup old activities (keeps last 2 years)
CREATE OR REPLACE FUNCTION cleanup_old_activities()
RETURNS void AS $$
BEGIN
    DELETE FROM public.user_activities
    WHERE created_at < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.user_activities TO authenticated;
