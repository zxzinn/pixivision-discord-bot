import { REST, Routes } from "discord.js";
import * as configCommand from "@/commands/config.ts";
import * as resendCommand from "@/commands/resend.ts";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token || !clientId) {
	console.error(
		"Missing DISCORD_TOKEN or DISCORD_CLIENT_ID environment variables",
	);
	process.exit(1);
}

const commands = [configCommand.data.toJSON(), resendCommand.data.toJSON()];

const rest = new REST().setToken(token);

console.log(
	`Started refreshing ${commands.length} application (/) commands...`,
);

try {
	const data = await rest.put(Routes.applicationCommands(clientId), {
		body: commands,
	});

	console.log(
		`Successfully reloaded ${(data as unknown[]).length} application (/) commands.`,
	);
} catch (error) {
	console.error("Error deploying commands:", error);
	process.exit(1);
}
