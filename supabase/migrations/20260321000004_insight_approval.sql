-- Add approval gate for AI insights (human-in-the-loop)
ALTER TABLE insights ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;
