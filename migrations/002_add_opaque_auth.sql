PRAGMA defer_foreign_keys = ON;
PRAGMA foreign_keys = OFF;

CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  opaque_registration_record TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

INSERT INTO users_new (
  id,
  email,
  password_hash,
  opaque_registration_record,
  email_verified,
  role,
  created_at,
  updated_at
)
SELECT
  id,
  email,
  password_hash,
  NULL,
  email_verified,
  role,
  created_at,
  updated_at
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

CREATE TABLE sessions_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  reauthenticated_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO sessions_new (id, user_id, expires_at, reauthenticated_at, created_at)
SELECT id, user_id, expires_at, NULL, created_at
FROM sessions;

DROP TABLE sessions;
ALTER TABLE sessions_new RENAME TO sessions;

PRAGMA foreign_keys = ON;

CREATE TABLE opaque_registration_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK(purpose IN ('register', 'reset_password')),
  token TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE opaque_login_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  purpose TEXT NOT NULL CHECK(purpose IN ('login', 'reauth')),
  server_login_state TEXT NOT NULL,
  has_opaque_record BOOLEAN DEFAULT FALSE,
  session_duration_days INTEGER,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE pending_auth_challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_duration_days INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_opaque_registration_attempts_expires_at
  ON opaque_registration_attempts (expires_at);

CREATE INDEX idx_opaque_login_attempts_expires_at
  ON opaque_login_attempts (expires_at);

CREATE INDEX idx_pending_auth_challenges_expires_at
  ON pending_auth_challenges (expires_at);
