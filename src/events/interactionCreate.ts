import type { Interaction } from "discord.js";
import { Events } from "discord.js";
import * as configCommand from "@/commands/config.ts";

export const name = Events.InteractionCreate;

export async function execute(interaction: Interaction): Promise<void> {
	if (!interaction.isChatInputCommand()) return;

	try {
		switch (interaction.commandName) {
			case "pixivision-config":
				await configCommand.execute(interaction);
				break;
			default:
				console.warn(`Unknown command: ${interaction.commandName}`);
		}
	} catch (error) {
		console.error("Error executing command:", error);

		const errorMessage = {
			content: "There was an error executing this command.",
			ephemeral: true,
		};

		if (interaction.replied || interaction.deferred) {
			await interaction.followUp(errorMessage);
		} else {
			await interaction.reply(errorMessage);
		}
	}
}
