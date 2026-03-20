-- ============================================
-- Migration: Full Community Features
-- Discussions, Groups, and Buddy Matching
-- ============================================

-- ============================================
-- PART 1: DISCUSSION FORUMS
-- ============================================

-- Discussion categories
CREATE TABLE IF NOT EXISTS community_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT NOT NULL DEFAULT 'MessageCircle',
    color TEXT NOT NULL DEFAULT 'violet',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussion topics/threads
CREATE TABLE IF NOT EXISTS community_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES community_categories(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    content TEXT NOT NULL,

    -- Stats
    reply_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,

    -- Status
    is_pinned BOOLEAN DEFAULT false,
    is_solved BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,

    last_reply_at TIMESTAMPTZ,
    last_reply_by UUID REFERENCES auth.users(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topic replies
CREATE TABLE IF NOT EXISTS community_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES community_topics(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_reply_id UUID REFERENCES community_replies(id) ON DELETE CASCADE,

    content TEXT NOT NULL,

    -- Stats
    like_count INTEGER DEFAULT 0,

    -- Status
    is_accepted BOOLEAN DEFAULT false, -- Marked as best answer

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topic/Reply likes
CREATE TABLE IF NOT EXISTS community_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES community_topics(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES community_replies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT like_target CHECK (
        (topic_id IS NOT NULL AND reply_id IS NULL) OR
        (topic_id IS NULL AND reply_id IS NOT NULL)
    ),
    CONSTRAINT unique_topic_like UNIQUE (user_id, topic_id),
    CONSTRAINT unique_reply_like UNIQUE (user_id, reply_id)
);

-- ============================================
-- PART 2: ACCOUNTABILITY GROUPS
-- ============================================

-- Groups
CREATE TABLE IF NOT EXISTS community_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,
    description TEXT,

    -- Settings
    max_members INTEGER DEFAULT 6,
    is_public BOOLEAN DEFAULT true, -- Can be found in search
    is_active BOOLEAN DEFAULT true,

    -- Weekly goal
    weekly_goal_type TEXT CHECK (weekly_goal_type IN ('applications', 'articles', 'exercises', 'custom')),
    weekly_goal_target INTEGER DEFAULT 5,
    weekly_goal_description TEXT,

    -- Stats
    member_count INTEGER DEFAULT 0,
    weekly_progress INTEGER DEFAULT 0,

    -- Creator
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members
CREATE TABLE IF NOT EXISTS community_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),

    -- Weekly progress
    weekly_contribution INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,

    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(group_id, user_id)
);

-- Group messages (for chat)
CREATE TABLE IF NOT EXISTS community_group_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    content TEXT NOT NULL,

    -- Optional: message type for system messages
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'celebration')),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group invitations
CREATE TABLE IF NOT EXISTS community_group_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,

    UNIQUE(group_id, invited_user_id)
);

-- ============================================
-- PART 3: BUDDY MATCHING
-- ============================================

-- Buddy preferences (for matching)
CREATE TABLE IF NOT EXISTS community_buddy_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

    -- Preferences for matching
    looking_for_buddy BOOLEAN DEFAULT false,

    -- What they want help with
    wants_interview_practice BOOLEAN DEFAULT false,
    wants_cv_feedback BOOLEAN DEFAULT false,
    wants_motivation_support BOOLEAN DEFAULT false,
    wants_accountability BOOLEAN DEFAULT false,

    -- What they can offer
    can_help_interview BOOLEAN DEFAULT false,
    can_help_cv BOOLEAN DEFAULT false,
    can_help_motivation BOOLEAN DEFAULT false,
    can_help_accountability BOOLEAN DEFAULT false,

    -- Availability
    preferred_contact TEXT CHECK (preferred_contact IN ('chat', 'video', 'both')),
    timezone TEXT DEFAULT 'Europe/Stockholm',

    -- Bio for matching
    bio TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buddy pairs
CREATE TABLE IF NOT EXISTS community_buddies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'paused', 'ended')),

    -- Stats
    check_in_count INTEGER DEFAULT 0,
    last_check_in TIMESTAMPTZ,

    -- Matching info
    match_score INTEGER, -- How well they matched
    matched_at TIMESTAMPTZ DEFAULT NOW(),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT different_users CHECK (user1_id != user2_id),
    CONSTRAINT unique_buddy_pair UNIQUE (user1_id, user2_id)
);

-- Buddy check-ins
CREATE TABLE IF NOT EXISTS community_buddy_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buddy_pair_id UUID NOT NULL REFERENCES community_buddies(id) ON DELETE CASCADE,

    -- Who initiated
    initiated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Check-in type
    checkin_type TEXT NOT NULL CHECK (checkin_type IN ('weekly', 'interview_practice', 'cv_review', 'motivation', 'celebration')),

    -- Notes
    notes TEXT,

    -- Rating (1-5)
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Discussions
CREATE INDEX IF NOT EXISTS idx_topics_category ON community_topics(category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_topics_author ON community_topics(author_id);
CREATE INDEX IF NOT EXISTS idx_topics_pinned ON community_topics(is_pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replies_topic ON community_replies(topic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_replies_author ON community_replies(author_id);

-- Groups
CREATE INDEX IF NOT EXISTS idx_groups_public ON community_groups(is_public, is_active);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON community_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON community_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON community_group_messages(group_id, created_at DESC);

-- Buddies
CREATE INDEX IF NOT EXISTS idx_buddy_prefs_looking ON community_buddy_preferences(looking_for_buddy);
CREATE INDEX IF NOT EXISTS idx_buddies_user1 ON community_buddies(user1_id);
CREATE INDEX IF NOT EXISTS idx_buddies_user2 ON community_buddies(user2_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_buddy_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_buddies ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_buddy_checkins ENABLE ROW LEVEL SECURITY;

-- Categories are public
CREATE POLICY "Categories are public" ON community_categories FOR SELECT USING (is_active = true);

-- Topics policies
CREATE POLICY "Topics are public" ON community_topics FOR SELECT USING (true);
CREATE POLICY "Users can create topics" ON community_topics FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own topics" ON community_topics FOR UPDATE USING (auth.uid() = author_id);

-- Replies policies
CREATE POLICY "Replies are public" ON community_replies FOR SELECT USING (true);
CREATE POLICY "Users can create replies" ON community_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own replies" ON community_replies FOR UPDATE USING (auth.uid() = author_id);

-- Likes policies
CREATE POLICY "Users can view likes" ON community_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON community_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON community_likes FOR DELETE USING (auth.uid() = user_id);

-- Groups policies
CREATE POLICY "Public groups visible" ON community_groups FOR SELECT USING (is_public = true OR created_by = auth.uid());
CREATE POLICY "Users can create groups" ON community_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Leaders can update groups" ON community_groups FOR UPDATE USING (auth.uid() = created_by);

-- Group members policies
CREATE POLICY "Members can view group members" ON community_group_members FOR SELECT
    USING (EXISTS (SELECT 1 FROM community_group_members m WHERE m.group_id = community_group_members.group_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can join groups" ON community_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON community_group_members FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own membership" ON community_group_members FOR UPDATE USING (auth.uid() = user_id);

-- Group messages policies
CREATE POLICY "Members can view messages" ON community_group_messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM community_group_members m WHERE m.group_id = community_group_messages.group_id AND m.user_id = auth.uid()));
CREATE POLICY "Members can send messages" ON community_group_messages FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM community_group_members m WHERE m.group_id = community_group_messages.group_id AND m.user_id = auth.uid()));

-- Group invites policies
CREATE POLICY "Users can see their invites" ON community_group_invites FOR SELECT
    USING (invited_user_id = auth.uid() OR invited_by = auth.uid());
CREATE POLICY "Members can invite" ON community_group_invites FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM community_group_members m WHERE m.group_id = community_group_invites.group_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can respond to invites" ON community_group_invites FOR UPDATE USING (invited_user_id = auth.uid());

-- Buddy preferences policies
CREATE POLICY "Users can view buddy prefs looking" ON community_buddy_preferences FOR SELECT USING (looking_for_buddy = true OR user_id = auth.uid());
CREATE POLICY "Users can manage own prefs" ON community_buddy_preferences FOR ALL USING (auth.uid() = user_id);

-- Buddies policies
CREATE POLICY "Users can view own buddies" ON community_buddies FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());
CREATE POLICY "Users can create buddy pairs" ON community_buddies FOR INSERT WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());
CREATE POLICY "Users can update own buddy pairs" ON community_buddies FOR UPDATE USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Buddy checkins policies
CREATE POLICY "Users can view own checkins" ON community_buddy_checkins FOR SELECT
    USING (EXISTS (SELECT 1 FROM community_buddies b WHERE b.id = buddy_pair_id AND (b.user1_id = auth.uid() OR b.user2_id = auth.uid())));
CREATE POLICY "Users can create checkins" ON community_buddy_checkins FOR INSERT WITH CHECK (auth.uid() = initiated_by);

-- ============================================
-- DEFAULT CATEGORIES
-- ============================================

INSERT INTO community_categories (name, slug, description, icon, color, sort_order) VALUES
('Intervjutips', 'interview-tips', 'Dela och få tips inför jobbintervjuer', 'MessageSquare', 'violet', 1),
('CV-feedback', 'cv-feedback', 'Få feedback på ditt CV från andra', 'FileText', 'blue', 2),
('Motivation', 'motivation', 'Stöd och uppmuntran under jobbsöket', 'Heart', 'rose', 3),
('Framgångshistorier', 'success-stories', 'Fira andras (och dina!) framgångar', 'Trophy', 'amber', 4),
('Allmänt', 'general', 'Övriga diskussioner om jobbsökande', 'MessageCircle', 'slate', 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to join a group
CREATE OR REPLACE FUNCTION join_community_group(p_group_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_member_count INTEGER;
    v_max_members INTEGER;
BEGIN
    -- Check if group exists and get max members
    SELECT member_count, max_members INTO v_member_count, v_max_members
    FROM community_groups WHERE id = p_group_id AND is_active = true;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Check if group is full
    IF v_member_count >= v_max_members THEN
        RETURN false;
    END IF;

    -- Add member
    INSERT INTO community_group_members (group_id, user_id, role)
    VALUES (p_group_id, auth.uid(), 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING;

    -- Update member count
    UPDATE community_groups
    SET member_count = (SELECT COUNT(*) FROM community_group_members WHERE group_id = p_group_id AND is_active = true)
    WHERE id = p_group_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to leave a group
CREATE OR REPLACE FUNCTION leave_community_group(p_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Remove member
    DELETE FROM community_group_members
    WHERE group_id = p_group_id AND user_id = auth.uid();

    -- Update member count
    UPDATE community_groups
    SET member_count = (SELECT COUNT(*) FROM community_group_members WHERE group_id = p_group_id AND is_active = true)
    WHERE id = p_group_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update topic reply count
CREATE OR REPLACE FUNCTION update_topic_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_topics
        SET reply_count = reply_count + 1,
            last_reply_at = NEW.created_at,
            last_reply_by = NEW.author_id
        WHERE id = NEW.topic_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_topics
        SET reply_count = reply_count - 1
        WHERE id = OLD.topic_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reply_count
AFTER INSERT OR DELETE ON community_replies
FOR EACH ROW EXECUTE FUNCTION update_topic_reply_count();

-- Function to find buddy matches
CREATE OR REPLACE FUNCTION find_buddy_matches(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    user_id UUID,
    match_score INTEGER,
    first_name TEXT,
    last_name TEXT,
    bio TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH my_prefs AS (
        SELECT * FROM community_buddy_preferences WHERE community_buddy_preferences.user_id = p_user_id
    )
    SELECT
        p.user_id,
        (
            CASE WHEN my_prefs.wants_interview_practice AND p.can_help_interview THEN 2 ELSE 0 END +
            CASE WHEN my_prefs.wants_cv_feedback AND p.can_help_cv THEN 2 ELSE 0 END +
            CASE WHEN my_prefs.wants_motivation_support AND p.can_help_motivation THEN 2 ELSE 0 END +
            CASE WHEN my_prefs.wants_accountability AND p.can_help_accountability THEN 2 ELSE 0 END +
            CASE WHEN my_prefs.can_help_interview AND p.wants_interview_practice THEN 1 ELSE 0 END +
            CASE WHEN my_prefs.can_help_cv AND p.wants_cv_feedback THEN 1 ELSE 0 END +
            CASE WHEN my_prefs.can_help_motivation AND p.wants_motivation_support THEN 1 ELSE 0 END +
            CASE WHEN my_prefs.can_help_accountability AND p.wants_accountability THEN 1 ELSE 0 END
        )::INTEGER as match_score,
        pr.first_name,
        pr.last_name,
        p.bio
    FROM community_buddy_preferences p
    CROSS JOIN my_prefs
    JOIN profiles pr ON pr.id = p.user_id
    WHERE p.user_id != p_user_id
      AND p.looking_for_buddy = true
      AND NOT EXISTS (
          SELECT 1 FROM community_buddies b
          WHERE (b.user1_id = p_user_id AND b.user2_id = p.user_id)
             OR (b.user1_id = p.user_id AND b.user2_id = p_user_id)
      )
    ORDER BY match_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANTS
-- ============================================

GRANT ALL ON community_categories TO authenticated;
GRANT ALL ON community_topics TO authenticated;
GRANT ALL ON community_replies TO authenticated;
GRANT ALL ON community_likes TO authenticated;
GRANT ALL ON community_groups TO authenticated;
GRANT ALL ON community_group_members TO authenticated;
GRANT ALL ON community_group_messages TO authenticated;
GRANT ALL ON community_group_invites TO authenticated;
GRANT ALL ON community_buddy_preferences TO authenticated;
GRANT ALL ON community_buddies TO authenticated;
GRANT ALL ON community_buddy_checkins TO authenticated;

GRANT EXECUTE ON FUNCTION join_community_group TO authenticated;
GRANT EXECUTE ON FUNCTION leave_community_group TO authenticated;
GRANT EXECUTE ON FUNCTION find_buddy_matches TO authenticated;
