-- ============================================
-- Migration: Community Features - Stötta & Fira
-- Support and celebrate each other during job search
-- ============================================

-- ============================================
-- 1. COMMUNITY FEED - Public activity stream
-- ============================================
CREATE TABLE IF NOT EXISTS community_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Activity details
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'application_sent',
        'interview_scheduled',
        'cv_completed',
        'milestone_reached',
        'streak_achieved',
        'first_login',
        'profile_completed',
        'article_read',
        'exercise_completed',
        'job_offer'
    )),
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Privacy
    is_public BOOLEAN DEFAULT true,

    -- Engagement
    cheer_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. COMMUNITY CHEERS - Encouragement between users
-- ============================================
CREATE TABLE IF NOT EXISTS community_cheers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who sent and received
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Can also be a reaction to a feed item
    feed_item_id UUID REFERENCES community_feed(id) ON DELETE CASCADE,

    -- Cheer content
    cheer_type TEXT NOT NULL CHECK (cheer_type IN (
        'encouragement',  -- General encouragement
        'congratulation', -- Celebrating achievement
        'support',        -- Support during hard times
        'reaction'        -- Emoji reaction to feed item
    )),
    message TEXT,
    emoji TEXT, -- For reactions: 💪🎉👏❤️🔥

    -- Metadata
    is_anonymous BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate reactions
    CONSTRAINT unique_reaction UNIQUE NULLS NOT DISTINCT (from_user_id, feed_item_id, emoji)
);

-- ============================================
-- 3. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_community_feed_user ON community_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_community_feed_created ON community_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_feed_public ON community_feed(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_cheers_to_user ON community_cheers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_community_cheers_from_user ON community_cheers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_community_cheers_feed_item ON community_cheers(feed_item_id);

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE community_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_cheers ENABLE ROW LEVEL SECURITY;

-- Feed policies
DO $$
BEGIN
    -- Anyone can view public feed items
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_feed' AND policyname = 'Public feed items are visible to all') THEN
        CREATE POLICY "Public feed items are visible to all" ON community_feed
            FOR SELECT USING (is_public = true);
    END IF;

    -- Users can view their own items (even private)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_feed' AND policyname = 'Users can view own feed items') THEN
        CREATE POLICY "Users can view own feed items" ON community_feed
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- Users can insert their own feed items
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_feed' AND policyname = 'Users can insert own feed items') THEN
        CREATE POLICY "Users can insert own feed items" ON community_feed
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Users can update their own feed items
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_feed' AND policyname = 'Users can update own feed items') THEN
        CREATE POLICY "Users can update own feed items" ON community_feed
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Cheers policies
DO $$
BEGIN
    -- Users can view cheers sent to them
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_cheers' AND policyname = 'Users can view received cheers') THEN
        CREATE POLICY "Users can view received cheers" ON community_cheers
            FOR SELECT USING (auth.uid() = to_user_id);
    END IF;

    -- Users can view cheers they sent
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_cheers' AND policyname = 'Users can view sent cheers') THEN
        CREATE POLICY "Users can view sent cheers" ON community_cheers
            FOR SELECT USING (auth.uid() = from_user_id);
    END IF;

    -- Users can view reactions on public feed items
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_cheers' AND policyname = 'Users can view public reactions') THEN
        CREATE POLICY "Users can view public reactions" ON community_cheers
            FOR SELECT USING (
                feed_item_id IS NOT NULL AND
                EXISTS (SELECT 1 FROM community_feed WHERE id = feed_item_id AND is_public = true)
            );
    END IF;

    -- Users can send cheers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_cheers' AND policyname = 'Users can send cheers') THEN
        CREATE POLICY "Users can send cheers" ON community_cheers
            FOR INSERT WITH CHECK (auth.uid() = from_user_id);
    END IF;

    -- Users can delete their own cheers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_cheers' AND policyname = 'Users can delete own cheers') THEN
        CREATE POLICY "Users can delete own cheers" ON community_cheers
            FOR DELETE USING (auth.uid() = from_user_id);
    END IF;
END $$;

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Function to post to community feed
CREATE OR REPLACE FUNCTION post_to_community_feed(
    p_user_id UUID,
    p_activity_type TEXT,
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_is_public BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
    v_feed_id UUID;
BEGIN
    INSERT INTO community_feed (user_id, activity_type, title, description, metadata, is_public)
    VALUES (p_user_id, p_activity_type, p_title, p_description, p_metadata, p_is_public)
    RETURNING id INTO v_feed_id;

    RETURN v_feed_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a reaction to a feed item
CREATE OR REPLACE FUNCTION react_to_feed_item(
    p_user_id UUID,
    p_feed_item_id UUID,
    p_emoji TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Insert reaction (or ignore if duplicate)
    INSERT INTO community_cheers (from_user_id, feed_item_id, cheer_type, emoji)
    VALUES (p_user_id, p_feed_item_id, 'reaction', p_emoji)
    ON CONFLICT (from_user_id, feed_item_id, emoji) DO NOTHING;

    -- Update cheer count
    UPDATE community_feed
    SET cheer_count = (
        SELECT COUNT(*) FROM community_cheers WHERE feed_item_id = p_feed_item_id
    )
    WHERE id = p_feed_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove a reaction
CREATE OR REPLACE FUNCTION remove_reaction(
    p_user_id UUID,
    p_feed_item_id UUID,
    p_emoji TEXT
)
RETURNS VOID AS $$
BEGIN
    DELETE FROM community_cheers
    WHERE from_user_id = p_user_id
      AND feed_item_id = p_feed_item_id
      AND emoji = p_emoji;

    -- Update cheer count
    UPDATE community_feed
    SET cheer_count = (
        SELECT COUNT(*) FROM community_cheers WHERE feed_item_id = p_feed_item_id
    )
    WHERE id = p_feed_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================
GRANT ALL ON community_feed TO authenticated;
GRANT ALL ON community_cheers TO authenticated;
GRANT EXECUTE ON FUNCTION post_to_community_feed TO authenticated;
GRANT EXECUTE ON FUNCTION react_to_feed_item TO authenticated;
GRANT EXECUTE ON FUNCTION remove_reaction TO authenticated;
