-- Real-time Chat App Database Schema
-- This schema supports real-time friend requests, messaging, and user discovery

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (already exists, but adding missing columns)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS status_message TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"show_online_status": true, "allow_friend_requests": true, "searchable": true}';

-- Friends table
CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Friend requests table (for tracking requests)
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

-- Chats table (for direct messaging)
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_id UUID,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

-- Messages table (already exists, but ensuring proper structure)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'TEXT' CHECK (type IN ('TEXT', 'IMAGE', 'VIDEO', 'FILE')),
    file_url TEXT,
    file_name TEXT,
    file_size BIGINT,
    file_type TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User online status table
CREATE TABLE IF NOT EXISTS user_online_status (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_chats_user1 ON chats(user1_id);
CREATE INDEX IF NOT EXISTS idx_chats_user2 ON chats(user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_online_status ENABLE ROW LEVEL SECURITY;

-- Friends policies
CREATE POLICY "Users can view their own friends" ON friends
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert their own friend relationships" ON friends
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friend relationships" ON friends
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friend relationships" ON friends
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friend requests policies
CREATE POLICY "Users can view friend requests sent to or from them" ON friend_requests
    FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send friend requests" ON friend_requests
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update friend requests sent to them" ON friend_requests
    FOR UPDATE USING (auth.uid() = to_user_id);

CREATE POLICY "Users can delete friend requests they sent" ON friend_requests
    FOR DELETE USING (auth.uid() = from_user_id);

-- Chats policies
CREATE POLICY "Users can view chats they participate in" ON chats
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create chats" ON chats
    FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update chats they participate in" ON chats
    FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages policies
CREATE POLICY "Users can view messages in their chats" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chats 
            WHERE chats.id = messages.chat_id 
            AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in their chats" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM chats 
            WHERE chats.id = messages.chat_id 
            AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- User online status policies
CREATE POLICY "Users can view online status of their friends" ON user_online_status
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM friends 
            WHERE (friends.user_id = auth.uid() AND friends.friend_id = user_online_status.user_id)
            OR (friends.friend_id = auth.uid() AND friends.user_id = user_online_status.user_id)
            AND friends.status = 'accepted'
        )
    );

CREATE POLICY "Users can update their own online status" ON user_online_status
    FOR ALL USING (auth.uid() = user_id);

-- Functions for real-time functionality

-- Function to create or get chat between two users
CREATE OR REPLACE FUNCTION get_or_create_chat(user1_uuid UUID, user2_uuid UUID)
RETURNS UUID AS $$
DECLARE
    chat_id UUID;
BEGIN
    -- Try to find existing chat
    SELECT id INTO chat_id FROM chats 
    WHERE (user1_id = user1_uuid AND user2_id = user2_uuid) 
    OR (user1_id = user2_uuid AND user2_id = user1_uuid);
    
    -- If no chat exists, create one
    IF chat_id IS NULL THEN
        INSERT INTO chats (user1_id, user2_id) 
        VALUES (user1_uuid, user2_uuid) 
        RETURNING id INTO chat_id;
    END IF;
    
    RETURN chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update last message in chat
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chats 
    SET last_message_id = NEW.id, 
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.chat_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update chat when new message is inserted
CREATE TRIGGER update_chat_on_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_last_message();

-- Function to handle friend request acceptance
CREATE OR REPLACE FUNCTION accept_friend_request(request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    request_record RECORD;
BEGIN
    -- Get the friend request
    SELECT * INTO request_record FROM friend_requests WHERE id = request_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user is authorized to accept this request
    IF request_record.to_user_id != auth.uid() THEN
        RETURN FALSE;
    END IF;
    
    -- Update friend request status
    UPDATE friend_requests 
    SET status = 'accepted', updated_at = NOW()
    WHERE id = request_id;
    
    -- Create friend relationship (both directions)
    INSERT INTO friends (user_id, friend_id, status) 
    VALUES (request_record.from_user_id, request_record.to_user_id, 'accepted')
    ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted', updated_at = NOW();
    
    INSERT INTO friends (user_id, friend_id, status) 
    VALUES (request_record.to_user_id, request_record.from_user_id, 'accepted')
    ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted', updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search users by username or email
CREATE OR REPLACE FUNCTION search_users(search_term TEXT, current_user_id UUID)
RETURNS TABLE (
    id UUID,
    username TEXT,
    real_name TEXT,
    email TEXT,
    profile_image_url TEXT,
    is_online BOOLEAN,
    last_seen TIMESTAMP WITH TIME ZONE,
    is_friend BOOLEAN,
    friend_request_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id as id,
        up.username,
        up.real_name,
        up.email,
        up.profile_image_url,
        COALESCE(uos.is_online, false) as is_online,
        COALESCE(uos.last_seen, up.created_at) as last_seen,
        CASE 
            WHEN f.status = 'accepted' THEN true 
            ELSE false 
        END as is_friend,
        COALESCE(fr.status, 'none') as friend_request_status
    FROM user_profiles up
    LEFT JOIN user_online_status uos ON up.user_id = uos.user_id
    LEFT JOIN friends f ON (
        (f.user_id = current_user_id AND f.friend_id = up.user_id) OR
        (f.friend_id = current_user_id AND f.user_id = up.user_id)
    ) AND f.status = 'accepted'
    LEFT JOIN friend_requests fr ON (
        (fr.from_user_id = current_user_id AND fr.to_user_id = up.user_id) OR
        (fr.to_user_id = current_user_id AND fr.from_user_id = up.user_id)
    ) AND fr.status = 'pending'
    WHERE up.user_id != current_user_id
    AND up.privacy_settings->>'searchable' = 'true'
    AND (
        LOWER(up.username) LIKE LOWER('%' || search_term || '%') OR
        LOWER(up.real_name) LIKE LOWER('%' || search_term || '%') OR
        LOWER(up.email) LIKE LOWER('%' || search_term || '%')
    )
    ORDER BY 
        CASE WHEN f.status = 'accepted' THEN 0 ELSE 1 END,
        up.real_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's friends
CREATE OR REPLACE FUNCTION get_user_friends(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    username TEXT,
    real_name TEXT,
    email TEXT,
    profile_image_url TEXT,
    is_online BOOLEAN,
    last_seen TIMESTAMP WITH TIME ZONE,
    friendship_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id as id,
        up.username,
        up.real_name,
        up.email,
        up.profile_image_url,
        COALESCE(uos.is_online, false) as is_online,
        COALESCE(uos.last_seen, up.created_at) as last_seen,
        f.created_at as friendship_created_at
    FROM friends f
    JOIN user_profiles up ON (
        CASE 
            WHEN f.user_id = user_uuid THEN up.user_id = f.friend_id
            ELSE up.user_id = f.user_id
        END
    )
    LEFT JOIN user_online_status uos ON up.user_id = uos.user_id
    WHERE (f.user_id = user_uuid OR f.friend_id = user_uuid)
    AND f.status = 'accepted'
    ORDER BY uos.is_online DESC, up.real_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's friend requests
CREATE OR REPLACE FUNCTION get_user_friend_requests(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    from_user_id UUID,
    to_user_id UUID,
    username TEXT,
    real_name TEXT,
    profile_image_url TEXT,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    is_incoming BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fr.id,
        fr.from_user_id,
        fr.to_user_id,
        up.username,
        up.real_name,
        up.profile_image_url,
        fr.message,
        fr.created_at,
        (fr.to_user_id = user_uuid) as is_incoming
    FROM friend_requests fr
    JOIN user_profiles up ON up.user_id = fr.from_user_id
    WHERE (fr.from_user_id = user_uuid OR fr.to_user_id = user_uuid)
    AND fr.status = 'pending'
    ORDER BY fr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
