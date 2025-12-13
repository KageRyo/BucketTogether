-- BucketTogether Supabase Database Schema
-- Please run this script in your Supabase SQL editor to set up the database schema.

-- 啟用 UUID 擴充
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 使用者資料表
-- ===========================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_id VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  picture_url TEXT,
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 清單資料表
-- ===========================================
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lists_owner_id ON lists(owner_id);

CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 清單成員資料表（邀請關係）
-- ===========================================
CREATE TYPE member_role AS ENUM ('owner', 'editor', 'viewer');

CREATE TABLE list_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role member_role DEFAULT 'editor',
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(list_id, user_id)
);

CREATE INDEX idx_list_members_list_id ON list_members(list_id);
CREATE INDEX idx_list_members_user_id ON list_members(user_id);

-- ===========================================
-- 分類資料表
-- ===========================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3b82f6',
  icon VARCHAR(50),
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_categories_list_id ON categories(list_id);

-- ===========================================
-- 清單項目資料表
-- ===========================================
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');

CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  priority priority_level,
  "order" INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_items_list_id ON items(list_id);
CREATE INDEX idx_items_category_id ON items(category_id);
CREATE INDEX idx_items_is_completed ON items(is_completed);

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Row Level Security (RLS) 政策
-- ===========================================

-- 啟用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 使用者可以查看和更新自己的資料
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = line_id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = line_id);

-- 清單可被擁有者和成員查看
CREATE POLICY "Lists viewable by members" ON lists
  FOR SELECT USING (
    owner_id IN (SELECT id FROM users WHERE line_id = auth.uid()::text)
    OR id IN (
      SELECT list_id FROM list_members 
      WHERE user_id IN (SELECT id FROM users WHERE line_id = auth.uid()::text)
    )
    OR is_public = TRUE
  );

-- 清單只能被擁有者修改
CREATE POLICY "Lists editable by owner" ON lists
  FOR ALL USING (
    owner_id IN (SELECT id FROM users WHERE line_id = auth.uid()::text)
  );

-- 清單項目可被清單成員查看和編輯
CREATE POLICY "Items viewable by list members" ON items
  FOR SELECT USING (
    list_id IN (
      SELECT id FROM lists WHERE owner_id IN (SELECT id FROM users WHERE line_id = auth.uid()::text)
      UNION
      SELECT list_id FROM list_members WHERE user_id IN (SELECT id FROM users WHERE line_id = auth.uid()::text)
    )
  );

CREATE POLICY "Items editable by list members" ON items
  FOR ALL USING (
    list_id IN (
      SELECT id FROM lists WHERE owner_id IN (SELECT id FROM users WHERE line_id = auth.uid()::text)
      UNION
      SELECT list_id FROM list_members 
      WHERE user_id IN (SELECT id FROM users WHERE line_id = auth.uid()::text)
      AND role IN ('owner', 'editor')
    )
  );

-- ===========================================
-- 即時訂閱設定
-- ===========================================
-- 在 Supabase Dashboard 中啟用 Realtime：
-- 1. 進入 Database > Replication
-- 2. 對 items 和 list_members 資料表啟用 Realtime
