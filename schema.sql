DROP TABLE IF EXISTS posts;
CREATE TABLE posts (
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
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

DROP TABLE IF EXISTS totp_secrets;
CREATE TABLE totp_secrets (
  user_id TEXT PRIMARY KEY,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  backup_codes TEXT, -- JSON array
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS passkeys;
CREATE TABLE passkeys (
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

DROP TABLE IF EXISTS sessions;
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
