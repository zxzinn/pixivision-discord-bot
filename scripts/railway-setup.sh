#!/bin/bash

# Railway Setup Script for Pixivision Discord Bot
# This script helps you quickly set up and deploy to Railway

set -e

echo "🚂 Pixivision Discord Bot - Railway Setup"
echo "=========================================="
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo ""
    echo "Please install Railway CLI first:"
    echo "macOS/Linux: curl -fsSL https://railway.app/install.sh | sh"
    echo "Windows: iwr https://railway.app/install.ps1 | iex"
    echo ""
    exit 1
fi

echo "✅ Railway CLI found"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "Please edit .env and fill in your credentials, then run this script again."
    exit 0
fi

# Load .env
export $(cat .env | grep -v '^#' | xargs)

# Check if required variables are set
if [ -z "$DISCORD_TOKEN" ] || [ "$DISCORD_TOKEN" = "your_discord_bot_token_here" ]; then
    echo "❌ DISCORD_TOKEN not set in .env"
    echo "Please edit .env and set your Discord bot token"
    exit 1
fi

if [ -z "$DISCORD_CLIENT_ID" ] || [ "$DISCORD_CLIENT_ID" = "your_discord_client_id_here" ]; then
    echo "❌ DISCORD_CLIENT_ID not set in .env"
    echo "Please edit .env and set your Discord client ID"
    exit 1
fi

if [ -z "$SUPABASE_URL" ] || [ "$SUPABASE_URL" = "https://your-project.supabase.co" ]; then
    echo "❌ SUPABASE_URL not set in .env"
    echo "Please edit .env and set your Supabase URL"
    exit 1
fi

if [ -z "$SUPABASE_ANON_KEY" ] || [ "$SUPABASE_ANON_KEY" = "your_supabase_anon_key_here" ]; then
    echo "❌ SUPABASE_ANON_KEY not set in .env"
    echo "Please edit .env and set your Supabase anon key"
    exit 1
fi

echo "✅ All required environment variables are set"
echo ""

# Login to Railway
echo "Logging in to Railway..."
railway login
echo ""

# Initialize project
echo "Initializing Railway project..."
railway init
echo ""

# Set environment variables
echo "Setting environment variables..."
railway variables set DISCORD_TOKEN="$DISCORD_TOKEN"
railway variables set DISCORD_CLIENT_ID="$DISCORD_CLIENT_ID"
railway variables set SUPABASE_URL="$SUPABASE_URL"
railway variables set SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
railway variables set RSS_CHECK_INTERVAL="${RSS_CHECK_INTERVAL:-300000}"
railway variables set NODE_ENV="production"
echo "✅ Environment variables set"
echo ""

# Deploy
echo "🚀 Deploying to Railway..."
railway up
echo ""

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Register Discord commands: bun run deploy-commands"
echo "2. Invite bot to your Discord server"
echo "3. Run /pixivision-config in your server to set up notifications"
echo ""
echo "View your deployment: railway open"
echo "View logs: railway logs"
