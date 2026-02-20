-- Add share_token column to jobs table for read-only public sharing
-- Run this in your Supabase SQL editor before deploying the share feature

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_jobs_share_token
  ON jobs(share_token)
  WHERE share_token IS NOT NULL;
