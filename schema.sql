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
