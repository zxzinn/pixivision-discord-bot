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
				{ name: "All (中文, 日本語, English)", value: "all" },
				{ name: "繁體中文", value: "zh-tw" },
				{ name: "日本語", value: "ja" },
				{ name: "English", value: "en" },
			),
	)
	.addIntegerOption((option) =>
		option
			.setName("count")
			.setDescription(
				"Number of recent articles to resend per language (leave empty for all)",
			)
			.setRequired(false)
			.setMinValue(1),
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
		const languageInput = interaction.options.getString("language", true);
		const countInput = interaction.options.getInteger("count");
		// If count is not specified, fetch all available articles (typically ~20 per feed)
		const count = countInput ?? 100; // Set high enough to get all articles from feed

		// Determine which languages to fetch
		const languages: Language[] =
			languageInput === "all"
				? ["zh-tw", "ja", "en"]
				: [languageInput as Language];

		let totalSuccessCount = 0;
		let totalArticleCount = 0;

		// Fetch and send articles for each language
		for (const language of languages) {
			try {
				// Fetch recent articles using shared RSS parser
				const articles = await fetchRecentArticles(language, count);
				totalArticleCount += articles.length;

				if (articles.length === 0) {
					console.warn(`No articles found for ${language}`);
					continue;
				}

				// Send articles to current channel
				for (const article of articles) {
					try {
						await notificationService.testNotification(
							interaction.channelId,
							article,
						);
						totalSuccessCount++;
					} catch (error) {
						console.error("Error sending article:", error);
					}
				}
			} catch (error) {
				console.error(`Error fetching ${language} articles:`, error);
			}
		}

		if (totalArticleCount === 0) {
			await interaction.editReply({
				embeds: [createErrorEmbed("No articles found to resend.")],
			});
			return;
		}

		const languageText =
			languageInput === "all"
				? "all languages"
				: LANGUAGE_NAMES[languageInput as Language];

		await interaction.editReply({
			embeds: [
				createInfoEmbed(
					"✅ Articles Resent",
					`Successfully resent ${totalSuccessCount} article(s) (${languageText}) to this channel.`,
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
