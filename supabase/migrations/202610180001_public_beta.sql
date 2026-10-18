-- Fresh database only. The previous schema.sql was an unexecuted draft.
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255),
  display_name varchar(255) NOT NULL CHECK (length(btrim(display_name)) > 0),
  picture_url text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  auth_provider text NOT NULL CHECK (auth_provider IN ('credentials', 'line', 'discord', 'google', 'multiple')),
  password_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE oauth_identities (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('line', 'discord', 'google')),
  provider_account_id varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, provider_account_id),
  UNIQUE (user_id, provider)
);
CREATE TABLE lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(255) NOT NULL CHECK (length(btrim(title)) > 0),
  description text,
  cover_image text,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_public boolean NOT NULL DEFAULT false CHECK (is_public = false),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE list_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  status text NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted')),
  invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
  invited_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz,
  UNIQUE (list_id, user_id)
);
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL CHECK (length(btrim(name)) > 0),
  color varchar(7) NOT NULL DEFAULT '#3b82f6' CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (list_id, id)
);
CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  category_id uuid,
  title varchar(500) NOT NULL CHECK (length(btrim(title)) > 0),
  description text,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  completed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  due_date date,
  priority text CHECK (priority IN ('low', 'medium', 'high')),
  "order" integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (list_id, category_id) REFERENCES categories(list_id, id)
);
CREATE TABLE invite_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('editor', 'viewer')),
  token_hash char(64) NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  accepted_at timestamptz
);
CREATE TABLE rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX lists_owner_idx ON lists(owner_id);
CREATE INDEX membership_user_idx ON list_members(user_id, status);
CREATE INDEX items_list_idx ON items(list_id, "order");
CREATE INDEX categories_list_idx ON categories(list_id, "order");
CREATE INDEX invite_list_idx ON invite_links(list_id);
CREATE INDEX rate_limits_expiry_idx ON rate_limits(expires_at);

-- NextAuth is the authentication authority. No browser grants/policies.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON users, oauth_identities, lists, list_members, categories, items, invite_links, rate_limits FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON users, oauth_identities, lists, list_members, categories, items, invite_links, rate_limits FROM authenticated;
  END IF;
END $$;
