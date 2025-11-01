import {
	type ChatInputCommandInteraction,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import type { Language } from "@/models/types.ts";
import { LANGUAGE_NAMES } from "@/models/types.ts";
import { notificationService } from "@/services/notification.ts";
import { createErrorEmbed, createInfoEmbed } from "@/utils/embed-builder.ts";
import { fetchRecentArticles } from "@/utils/rss-parser.ts";

export const data = new SlashCommandBuilder()
	.setName("pv-resend")
	.setDescription("Resend recent Pixivision articles to the current channel")
	.addStringOption((option) =>
		option
			.setName("language")
			.setDescription("Language of articles to resend")
			.setRequired(true)
			.addChoices(
				{ name: "繁體中文", value: "zh-tw" },
				{ name: "日本語", value: "ja" },
				{ name: "English", value: "en" },
			),
	)
	.addIntegerOption((option) =>
		option
			.setName("count")
			.setDescription("Number of recent articles to resend (1-20)")
			.setRequired(false)
			.setMinValue(1)
			.setMaxValue(20),
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
	.setDMPermission(false);

export async function execute(
	interaction: ChatInputCommandInteraction,
): Promise<void> {
	if (!interaction.guildId || !interaction.channelId) {
		await interaction.reply({
			embeds: [createErrorEmbed("This command can only be used in a server.")],
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	await interaction.deferReply({ flags: MessageFlags.Ephemeral });

	try {
		const language = interaction.options.getString(
			"language",
			true,
		) as Language;
		const count = interaction.options.getInteger("count") || 5;

		// Fetch recent articles using shared RSS parser
		const articles = await fetchRecentArticles(language, count);

		if (articles.length === 0) {
			await interaction.editReply({
				embeds: [createErrorEmbed("No articles found to resend.")],
			});
			return;
		}

		// Send articles to current channel
		let successCount = 0;
		for (const article of articles) {
			try {
				await notificationService.testNotification(
					interaction.channelId,
					article,
				);
				successCount++;
			} catch (error) {
				console.error("Error sending article:", error);
			}
		}

		await interaction.editReply({
			embeds: [
				createInfoEmbed(
					"✅ Articles Resent",
					`Successfully resent ${successCount} ${LANGUAGE_NAMES[language]} article(s) to this channel.`,
				),
			],
		});
	} catch (error) {
		console.error("Error in resend command:", error);
		await interaction.editReply({
			embeds: [
				createErrorEmbed(
					"An error occurred while fetching articles. Please try again.",
				),
			],
		});
	}
}
