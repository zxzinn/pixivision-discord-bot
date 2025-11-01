import { Client, GatewayIntentBits } from "discord.js";
import * as interactionCreateEvent from "@/events/interactionCreate.ts";
import * as readyEvent from "@/events/ready.ts";

// Validate environment variables
const requiredEnvVars = [
	"DISCORD_TOKEN",
	"DISCORD_CLIENT_ID",
	"SUPABASE_URL",
	"SUPABASE_ANON_KEY",
];

for (const envVar of requiredEnvVars) {
	if (!process.env[envVar]) {
		console.error(`Missing required environment variable: ${envVar}`);
		console.error(
			"Please copy .env.example to .env and fill in the required values.",
		);
		process.exit(1);
	}
}

// Create Discord client
const client = new Client({
	intents: [GatewayIntentBits.Guilds],
});

// Register events
client.once(readyEvent.name, () => readyEvent.execute(client));
client.on(interactionCreateEvent.name, interactionCreateEvent.execute);

// Error handling
client.on("error", (error) => {
	console.error("Discord client error:", error);
});

process.on("unhandledRejection", (error) => {
	console.error("Unhandled promise rejection:", error);
});

process.on("SIGINT", () => {
	console.log("\nShutting down gracefully...");
	client.destroy();
	process.exit(0);
});

process.on("SIGTERM", () => {
	console.log("\nReceived SIGTERM, shutting down gracefully...");
	client.destroy();
	process.exit(0);
});

// Login
console.log("Starting Pixivision Discord Bot...");
client.login(process.env.DISCORD_TOKEN);
