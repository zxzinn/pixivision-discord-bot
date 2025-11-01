import {
	type ChatInputCommandInteraction,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import type { Language } from "@/models/types.ts";
import { LANGUAGE_NAMES } from "@/models/types.ts";
import { supabase } from "@/services/supabase.ts";
import { createConfigEmbed, createErrorEmbed } from "@/utils/embed-builder.ts";

export const data = new SlashCommandBuilder()
	.setName("pixivision-config")
	.setDescription("Configure Pixivision notifications for this server")
	.addChannelOption((option) =>
		option
			.setName("channel")
			.setDescription("The channel to send notifications to")
			.setRequired(true),
	)
	.addStringOption((option) =>
		option
			.setName("languages")
			.setDescription("Languages to monitor (comma-separated)")
			.setRequired(false)
			.addChoices(
				{ name: "All (中文, 日本語, English)", value: "zh-tw,ja,en" },
				{ name: "繁體中文 only", value: "zh-tw" },
				{ name: "日本語 only", value: "ja" },
				{ name: "English only", value: "en" },
				{ name: "中文 + 日本語", value: "zh-tw,ja" },
				{ name: "中文 + English", value: "zh-tw,en" },
				{ name: "日本語 + English", value: "ja,en" },
			),
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
	.setDMPermission(false);

export async function execute(
	interaction: ChatInputCommandInteraction,
): Promise<void> {
	if (!interaction.guildId) {
		await interaction.reply({
			embeds: [createErrorEmbed("This command can only be used in a server.")],
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	try {
		const channel = interaction.options.getChannel("channel", true);
		const languagesInput =
			interaction.options.getString("languages") || "zh-tw,ja,en";

		// Parse languages
		const languages = languagesInput
			.split(",")
			.map((lang) => lang.trim() as Language)
			.filter((lang) => ["zh-tw", "ja", "en"].includes(lang));

		if (languages.length === 0) {
			await interaction.editReply({
				embeds: [
					createErrorEmbed(
						"Invalid languages specified. Please use: zh-tw, ja, or en",
					),
				],
			});
			return;
		}

		// Save configuration
		await supabase.setGuildConfig(interaction.guildId, channel.id, languages);

		// Get friendly language names
		const languageNames = languages.map((lang) => LANGUAGE_NAMES[lang]);

		await interaction.editReply({
			embeds: [createConfigEmbed(channel.id, languageNames)],
		});
	} catch (error) {
		console.error("Error in config command:", error);
		await interaction.editReply({
			embeds: [
				createErrorEmbed(
					"An error occurred while saving the configuration. Please try again.",
				),
			],
		});
	}
}
