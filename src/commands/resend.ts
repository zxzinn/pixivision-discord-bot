import {
	type ChatInputCommandInteraction,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import type { Language } from "@/models/types.ts";
import { LANGUAGE_NAMES, RSS_FEEDS } from "@/models/types.ts";
import { notificationService } from "@/services/notification.ts";
import { supabase } from "@/services/supabase.ts";
import { createErrorEmbed, createInfoEmbed } from "@/utils/embed-builder.ts";

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

		// Fetch RSS feed to get recent articles
		const response = await fetch(RSS_FEEDS[language]);
		const text = await response.text();

		// Parse RSS XML (simple parsing, could use xml2js for production)
		const items: Array<{
			title: string;
			link: string;
			pubDate: Date;
			description: string;
			category: string;
			imageUrl: string;
		}> = [];

		// Extract items using regex (basic parsing)
		const itemRegex = /<item>(.*?)<\/item>/gs;
		const matches = [...text.matchAll(itemRegex)];

		for (const match of matches.slice(0, count)) {
			const itemXml = match[1];

			const titleMatch = itemXml.match(
				/<title><!\[CDATA\[(.*?)\]\]><\/title>/s,
			);
			const linkMatch = itemXml.match(/<link>(.*?)<\/link>/s);
			const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/s);
			const descMatch = itemXml.match(
				/<description><!\[CDATA\[(.*?)\]\]><\/description>/s,
			);
			const categoryMatch = itemXml.match(
				/<category><!\[CDATA\[(.*?)\]\]><\/category>/s,
			);

			// Extract image URL
			let imageUrl = "";
			const imageUrlMatch = itemXml.match(
				/<image>\s*<url>(.*?)<\/url>.*?<\/image>/s,
			);
			if (imageUrlMatch) {
				imageUrl = imageUrlMatch[1].trim();
			}

			if (titleMatch && linkMatch && pubDateMatch) {
				items.push({
					title: titleMatch[1].trim(),
					link: linkMatch[1].trim(),
					pubDate: new Date(pubDateMatch[1].trim()),
					description: descMatch ? descMatch[1].trim() : "",
					category: categoryMatch ? categoryMatch[1].trim() : "未分類",
					imageUrl,
				});
			}
		}

		if (items.length === 0) {
			await interaction.editReply({
				embeds: [createErrorEmbed("No articles found to resend.")],
			});
			return;
		}

		// Send articles to current channel
		let successCount = 0;
		for (const item of items) {
			try {
				const article = {
					title: item.title,
					url: item.link,
					description: item.description,
					category: item.category,
					imageUrl: item.imageUrl,
					language,
					pubDate: item.pubDate,
				};

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
