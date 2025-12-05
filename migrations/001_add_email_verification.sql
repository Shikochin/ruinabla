-- Migration: Add email verification support
-- This file safely adds new columns and tables without modifying existing data

-- Add email_verified column to users table if it doesn't exist
-- SQLite doesn't have "IF NOT EXISTS" for ALTER TABLE, so we'll handle this carefully
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Create email_verification_tokens table (won't affect existing tables)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('verify_email', 'reset_password')),
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);
