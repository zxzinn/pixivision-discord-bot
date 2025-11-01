# Pixivision Discord Bot

A Discord bot that monitors Pixivision RSS feeds and automatically sends notifications to configured channels. Supports multiple languages (繁體中文, 日本語, English) with multi-server support.

## Features

- 🌐 **Multi-language Support**: Monitor Chinese, Japanese, and English Pixivision feeds
- 🔔 **Real-time Notifications**: Instant notifications when new articles are published
- 🎨 **Beautiful Embeds**: Rich Discord embeds with images and article information
- 🔧 **Per-Server Configuration**: Each Discord server can configure its own notification channel and preferred languages
- 💾 **Duplicate Prevention**: Built-in database tracking to prevent duplicate notifications
- ☁️ **Cloud Ready**: Optimized for deployment on GCP Cloud Run

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Discord API**: discord.js v14
- **Database**: Supabase (PostgreSQL)
- **RSS Parser**: rss-feed-emitter
- **Linting/Formatting**: Biome.js

## Prerequisites

1. **Discord Bot Token**
   - Create a bot at [Discord Developer Portal](https://discord.com/developers/applications)
   - Enable these bot permissions: `Send Messages`, `Embed Links`, `Read Messages/View Channels`
   - Enable the `applications.commands` scope

2. **Supabase Account**
   - Create a project at [Supabase](https://supabase.com)
   - Get your project URL and anon key

3. **Bun Runtime**
   - Install from [bun.sh](https://bun.sh)

## Setup

### 1. Clone and Install

```bash
cd pixivision-discord-bot
bun install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
RSS_CHECK_INTERVAL=300000
NODE_ENV=development
```

### 3. Set Up Database

1. Go to your Supabase project's SQL Editor
2. Run the SQL script from `database/schema.sql`
3. This will create the required tables and indexes

### 4. Deploy Slash Commands

Register the bot's slash commands with Discord:

```bash
bun run deploy-commands
```

### 5. Invite Bot to Your Server

Generate an invite link with these permissions:
- Bot Permissions: `Send Messages`, `Embed Links`, `View Channels`
- Scopes: `bot`, `applications.commands`

Example invite URL:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=52224&scope=bot%20applications.commands
```

## Usage

### Running the Bot

**Development mode (with auto-reload):**
```bash
bun run dev
```

**Production mode:**
```bash
bun start
```

### Configuring Notifications

Use the `/pixivision-config` slash command in your Discord server:

```
/pixivision-config channel:#notifications languages:All
```

**Parameters:**
- `channel` (required): The channel where notifications will be sent
- `languages` (optional): Choose which language feeds to monitor
  - All (中文, 日本語, English) [default]
  - Individual languages or combinations

**Note**: You need `Manage Server` permission to use this command.

## Development

### Project Structure

```
pixivision-discord-bot/
├── src/
│   ├── commands/          # Slash command definitions
│   │   └── config.ts      # Configuration command
│   ├── events/            # Discord event handlers
│   │   ├── ready.ts       # Bot ready event
│   │   └── interactionCreate.ts
│   ├── services/          # Core services
│   │   ├── rss-monitor.ts    # RSS feed monitoring
│   │   ├── supabase.ts       # Database operations
│   │   └── notification.ts   # Notification sending
│   ├── models/            # Type definitions
│   │   └── types.ts
│   ├── utils/             # Utility functions
│   │   └── embed-builder.ts  # Discord embed formatting
│   ├── index.ts           # Main entry point
│   └── deploy-commands.ts # Command deployment script
├── database/
│   └── schema.sql         # Database schema
├── .env.example           # Environment variables template
├── Dockerfile             # Docker configuration for deployment
├── package.json
├── tsconfig.json
└── biome.json
```

### Linting and Formatting

```bash
# Check for issues
bun run lint

# Fix issues automatically
bun run lint:fix

# Format code
bun run format

# Run both lint and format
bun run check
```

## Deployment

### 🚂 Railway (Recommended - $5/month)

**The easiest way to deploy!**

1. Push your code to GitHub
2. Create a new project on [Railway.app](https://railway.app)
3. Connect your GitHub repository
4. Set environment variables in Railway Dashboard
5. Deploy automatically!

📖 **See [RAILWAY.md](./RAILWAY.md) for detailed step-by-step guide**

### 🐳 Other Platforms

This bot includes a Dockerfile and can be deployed to any platform that supports Docker:

**Alternative Options:**
- **Oracle Cloud** (Free tier: 4 cores, 24GB RAM)
- **Fly.io** (~$5/month)
- **Google Compute Engine** (VM-based)
- **DigitalOcean** ($4-6/month)

**Note**: Avoid Cloud Run, Vercel, or serverless platforms as Discord bots need persistent WebSocket connections.

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DISCORD_TOKEN` | Discord bot token | ✅ | - |
| `DISCORD_CLIENT_ID` | Discord application client ID | ✅ | - |
| `SUPABASE_URL` | Supabase project URL | ✅ | - |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ | - |
| `RSS_CHECK_INTERVAL` | RSS feed check interval (ms) | ❌ | 300000 (5 min) |
| `NODE_ENV` | Environment (development/production) | ❌ | development |

## RSS Feeds

The bot monitors these Pixivision RSS feeds:

- 🇹🇼 繁體中文: `https://www.pixivision.net/zh-tw/rss`
- 🇯🇵 日本語: `https://www.pixivision.net/ja/rss`
- 🇬🇧 English: `https://www.pixivision.net/en/rss`

## Database Schema

The bot uses two main tables:

- **guild_configs**: Stores server-specific configuration (channel, languages)
- **posted_articles**: Tracks posted articles to prevent duplicates

See `database/schema.sql` for the complete schema.

## Troubleshooting

### Bot not responding to commands
- Ensure you ran `bun run deploy-commands`
- Check that the bot has proper permissions in your server
- Verify the bot is online and connected

### No notifications appearing
- Check that you've configured a channel using `/pixivision-config`
- Verify the bot has permission to send messages in that channel
- Check the console logs for errors

### Database errors
- Ensure you've run the schema.sql in Supabase
- Verify your Supabase credentials are correct
- Check that Row Level Security policies allow access

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - feel free to use this bot for your own projects!

## Credits

Built with ❤️ using:
- [Bun](https://bun.sh)
- [discord.js](https://discord.js.org)
- [Supabase](https://supabase.com)
- [Pixivision](https://www.pixivision.net)
