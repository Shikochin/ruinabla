CREATE TABLE IF NOT EXISTS posts (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  tags TEXT, -- JSON array
  category TEXT,
  summary TEXT,
  readingMinutes INTEGER,
  pinned BOOLEAN DEFAULT FALSE,
  hide BOOLEAN DEFAULT FALSE,
  license TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Authentication tables
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  opaque_registration_record TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS totp_secrets (
  user_id TEXT PRIMARY KEY,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  backup_codes TEXT, -- JSON array
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS passkeys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  transports TEXT, -- JSON array
  name TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  reauthenticated_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS opaque_registration_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK(purpose IN ('register', 'reset_password')),
  token TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS opaque_login_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  purpose TEXT NOT NULL CHECK(purpose IN ('login', 'reauth')),
  server_login_state TEXT NOT NULL,
  has_opaque_record BOOLEAN DEFAULT FALSE,
  session_duration_days INTEGER,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS pending_auth_challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_duration_days INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('verify_email', 'reset_password')),
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS friend_links (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  avatar TEXT,
  desc TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);
