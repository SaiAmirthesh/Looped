-- ============================================
-- LOOPED APPLICATION - SUPABASE DATABASE SCHEMA (REFINED)
-- ============================================
-- This schema supports all features currently in localStorage:
-- - User profiles with XP and levels
-- - Skills with individual XP and levels
-- - Habits with streaks and completion tracking
-- - Quests with XP rewards and completion status
-- - Calendar/streak tracking
-- - Focus sessions (Pomodoro)
--
-- KEY CHANGES FROM ORIGINAL:
-- 1. Removed daily_stats table (use views instead for dynamic calculation)
-- 2. Added auto-profile creation trigger for new auth users
-- 3. Added helper views for daily completion summary and calendar view
-- ============================================

-- ============================================
-- 1. USER PROFILES TABLE
-- ============================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    
    -- Overall player XP and level
    total_xp INTEGER DEFAULT 0 CHECK (total_xp >= 0),
    current_xp INTEGER DEFAULT 0 CHECK (current_xp >= 0),
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    next_level_xp INTEGER DEFAULT 100 CHECK (next_level_xp > 0),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_xp CHECK (current_xp < next_level_xp)
);

CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- ============================================
-- 2. SKILLS TABLE
-- ============================================
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Skill details
    name TEXT NOT NULL CHECK (name IN ('Focus', 'Learning', 'Health', 'Creativity', 'Confidence', 'Social')),
    current_xp INTEGER DEFAULT 0 CHECK (current_xp >= 0),
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one skill per user per skill name
    UNIQUE(user_id, name)
);

CREATE INDEX idx_skills_user_id ON skills(user_id);
CREATE INDEX idx_skills_name ON skills(name);

-- ============================================
-- 3. HABITS TABLE
-- ============================================
CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Habit details
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Wellness', 'Productivity', 'Learning', 'Social', 'Health', 'Other')),
    skill TEXT NOT NULL CHECK (skill IN ('Focus', 'Learning', 'Health', 'Creativity', 'Confidence', 'Social')),
    
    -- Completion tracking
    completed_today BOOLEAN DEFAULT FALSE,
    streak INTEGER DEFAULT 0 CHECK (streak >= 0),
    longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
    last_completed DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_streak CHECK (longest_streak >= streak)
);

CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_skill ON habits(skill);
CREATE INDEX idx_habits_category ON habits(category);

-- ============================================
-- 4. HABIT COMPLETIONS TABLE
-- ============================================
-- Tracks daily habit completions for calendar/history
CREATE TABLE habit_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Completion details
    completed_date DATE NOT NULL,
    xp_earned INTEGER DEFAULT 10,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one completion per habit per day
    UNIQUE(habit_id, completed_date)
);

CREATE INDEX idx_habit_completions_user_date ON habit_completions(user_id, completed_date);
CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id);

-- ============================================
-- 5. QUESTS TABLE
-- ============================================
CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Quest details
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    skill TEXT NOT NULL CHECK (skill IN ('Focus', 'Learning', 'Health', 'Creativity', 'Confidence', 'Social')),
    
    -- Rewards and completion
    xp_reward INTEGER DEFAULT 50 CHECK (xp_reward > 0),
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quests_user_id ON quests(user_id);
CREATE INDEX idx_quests_completed ON quests(completed);
CREATE INDEX idx_quests_skill ON quests(skill);

-- ============================================
-- 6. FOCUS SESSIONS TABLE
-- ============================================
-- Stores Pomodoro/focus session history
CREATE TABLE focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Session details
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    session_type TEXT DEFAULT 'focus' CHECK (session_type IN ('focus', 'short_break', 'long_break')),
    completed BOOLEAN DEFAULT FALSE,
    
    -- XP earned
    xp_earned INTEGER DEFAULT 0,
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_started_at ON focus_sessions(started_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies

-- Any authenticated user can read public leaderboard fields for all profiles
CREATE POLICY "Authenticated users can view all profiles (leaderboard)"
    ON user_profiles FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Skills Policies
CREATE POLICY "Users can view their own skills"
    ON skills FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills"
    ON skills FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills"
    ON skills FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills"
    ON skills FOR DELETE
    USING (auth.uid() = user_id);

-- Habits Policies
CREATE POLICY "Users can view their own habits"
    ON habits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits"
    ON habits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
    ON habits FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
    ON habits FOR DELETE
    USING (auth.uid() = user_id);

-- Habit Completions Policies
CREATE POLICY "Users can view their own habit completions"
    ON habit_completions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habit completions"
    ON habit_completions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit completions"
    ON habit_completions FOR DELETE
    USING (auth.uid() = user_id);

-- Quests Policies
CREATE POLICY "Users can view their own quests"
    ON quests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quests"
    ON quests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quests"
    ON quests FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quests"
    ON quests FOR DELETE
    USING (auth.uid() = user_id);

-- Focus Sessions Policies
CREATE POLICY "Users can view their own focus sessions"
    ON focus_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus sessions"
    ON focus_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus sessions"
    ON focus_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quests_updated_at BEFORE UPDATE ON quests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-PROFILE CREATION TRIGGER
-- ============================================
-- CRITICAL: Create user_profiles row automatically when new user signs up
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, display_name, total_xp, current_xp, level, next_level_xp)
    VALUES (NEW.id, NEW.email, NEW.email, 0, 0, 1, 100);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION create_profile_for_new_user();

-- Function to initialize default skills for new users
CREATE OR REPLACE FUNCTION initialize_user_skills()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO skills (user_id, name, current_xp, level)
    VALUES
        (NEW.id, 'Focus', 0, 1),
        (NEW.id, 'Learning', 0, 1),
        (NEW.id, 'Health', 0, 1),
        (NEW.id, 'Creativity', 0, 1),
        (NEW.id, 'Confidence', 0, 1),
        (NEW.id, 'Social', 0, 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create skills when user profile is created
CREATE TRIGGER create_default_skills_on_user_creation
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_skills();

-- Function to update longest streak
CREATE OR REPLACE FUNCTION update_longest_streak()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.streak > NEW.longest_streak THEN
        NEW.longest_streak = NEW.streak;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update longest streak
CREATE TRIGGER update_habit_longest_streak
    BEFORE UPDATE ON habits
    FOR EACH ROW
    EXECUTE FUNCTION update_longest_streak();

-- ============================================
-- HELPER VIEWS (replaces daily_stats table)
-- ============================================

-- View for user dashboard stats
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
    up.id as user_id,
    up.total_xp,
    up.current_xp,
    up.level,
    up.next_level_xp,
    COUNT(DISTINCT h.id) as total_habits,
    COUNT(DISTINCT CASE WHEN h.completed_today THEN h.id END) as completed_habits_today,
    COALESCE(MAX(h.streak), 0) as current_streak,
    COALESCE(MAX(h.longest_streak), 0) as longest_streak,
    COUNT(DISTINCT CASE WHEN q.completed THEN q.id END) as completed_quests,
    COUNT(DISTINCT q.id) as total_quests
FROM user_profiles up
LEFT JOIN habits h ON h.user_id = up.id
LEFT JOIN quests q ON q.user_id = up.id
GROUP BY up.id, up.total_xp, up.current_xp, up.level, up.next_level_xp;

-- View for skill progress
CREATE OR REPLACE VIEW user_skill_progress AS
SELECT 
    s.user_id,
    s.name as skill_name,
    s.current_xp,
    s.level,
    FLOOR(100 * POWER(s.level, 1.5))::INTEGER as next_level_xp,
    ROUND((s.current_xp::DECIMAL / FLOOR(100 * POWER(s.level, 1.5))) * 100, 2) as progress_percentage
FROM skills s;

-- View for daily completion summary (replaces daily_stats table)
CREATE OR REPLACE VIEW user_daily_completion_summary AS
SELECT 
    up.id as user_id,
    CURRENT_DATE as stat_date,
    COUNT(DISTINCT h.id) as total_habits,
    COUNT(DISTINCT hc.habit_id) as completed_habits,
    ROUND((COUNT(DISTINCT hc.habit_id)::DECIMAL / NULLIF(COUNT(DISTINCT h.id), 0)) * 100, 2) as completion_percentage,
    COALESCE(SUM(hc.xp_earned), 0) as xp_earned_today
FROM user_profiles up
LEFT JOIN habits h ON h.user_id = up.id
LEFT JOIN habit_completions hc ON hc.habit_id = h.id AND hc.completed_date = CURRENT_DATE
GROUP BY up.id;

-- View for calendar data (XP earned per day)
CREATE OR REPLACE VIEW user_calendar_view AS
SELECT 
    up.id as user_id,
    hc.completed_date,
    COUNT(DISTINCT hc.habit_id) as habits_completed,
    COALESCE(SUM(hc.xp_earned), 0) as xp_earned
FROM user_profiles up
LEFT JOIN habit_completions hc ON hc.user_id = up.id
GROUP BY up.id, hc.completed_date;

-- ============================================
-- SAMPLE DATA (for testing - optional)
-- ============================================
-- Uncomment after creating test auth user in Supabase

/*
-- Fetch your test user's UUID from Supabase Auth and replace in INSERT below
-- Then uncomment and run

INSERT INTO user_profiles (id, email, display_name, total_xp, current_xp, level, next_level_xp)
VALUES ('YOUR_AUTH_USER_UUID', 'test@example.com', 'Test User', 250, 50, 2, 122);

-- Skills will be auto-created by trigger

INSERT INTO habits (user_id, name, category, skill, completed_today, streak, longest_streak, last_completed)
VALUES 
    ('YOUR_AUTH_USER_UUID', 'Morning Meditation', 'Wellness', 'Health', false, 5, 10, '2026-02-17'),
    ('YOUR_AUTH_USER_UUID', 'Read for 30 minutes', 'Learning', 'Learning', false, 3, 7, '2026-02-16'),
    ('YOUR_AUTH_USER_UUID', 'Exercise', 'Health', 'Health', true, 2, 5, '2026-02-18'),
    ('YOUR_AUTH_USER_UUID', 'Practice Coding', 'Productivity', 'Focus', false, 1, 3, '2026-02-17'),
    ('YOUR_AUTH_USER_UUID', 'Journal', 'Wellness', 'Creativity', false, 4, 8, '2026-02-17');

INSERT INTO quests (user_id, title, description, difficulty, skill, xp_reward, completed)
VALUES 
    ('YOUR_AUTH_USER_UUID', 'Complete 7-day meditation streak', 'Meditate every day for a week', 'Medium', 'Health', 100, false),
    ('YOUR_AUTH_USER_UUID', 'Finish a book', 'Read and complete one full book', 'Hard', 'Learning', 150, false),
    ('YOUR_AUTH_USER_UUID', 'Build a side project', 'Create and deploy a web application', 'Hard', 'Focus', 200, false),
    ('YOUR_AUTH_USER_UUID', 'Learn a new skill', 'Take an online course and complete it', 'Medium', 'Learning', 75, true);
*/
