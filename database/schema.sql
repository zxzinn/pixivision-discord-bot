-- Pixivision Discord Bot Database Schema
-- Run this in your Supabase SQL editor

-- Table: guild_configs
-- Stores configuration for each Discord server
CREATE TABLE IF NOT EXISTS guild_configs (
  guild_id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  languages TEXT[] DEFAULT ARRAY['zh-tw', 'ja', 'en']::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: posted_articles
-- Tracks which articles have been posted to which servers
-- Prevents duplicate notifications
CREATE TABLE IF NOT EXISTS posted_articles (
  id SERIAL PRIMARY KEY,
  article_url TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  language TEXT NOT NULL,
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_url, guild_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_guild_configs_guild_id ON guild_configs(guild_id);
CREATE INDEX IF NOT EXISTS idx_posted_articles_lookup ON posted_articles(article_url, guild_id);
CREATE INDEX IF NOT EXISTS idx_posted_articles_guild ON posted_articles(guild_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on guild_configs
CREATE TRIGGER update_guild_configs_updated_at
  BEFORE UPDATE ON guild_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE guild_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE posted_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow service role to access everything)
CREATE POLICY "Enable all access for service role" ON guild_configs
  FOR ALL USING (true);

CREATE POLICY "Enable all access for service role" ON posted_articles
  FOR ALL USING (true);

-- Comments for documentation
COMMENT ON TABLE guild_configs IS 'Stores Discord server configuration for Pixivision notifications';
COMMENT ON TABLE posted_articles IS 'Tracks posted articles to prevent duplicates';
COMMENT ON COLUMN guild_configs.guild_id IS 'Discord server (guild) ID';
COMMENT ON COLUMN guild_configs.channel_id IS 'Discord channel ID where notifications are sent';
COMMENT ON COLUMN guild_configs.languages IS 'Array of language codes to monitor (zh-tw, ja, en)';
