import { EmbedBuilder } from "discord.js";
import type { PixivisionArticle } from "@/models/types.ts";
import { LANGUAGE_NAMES } from "@/models/types.ts";

export function createArticleEmbed(article: PixivisionArticle): EmbedBuilder {
	const languageName = LANGUAGE_NAMES[article.language];

	// Create color based on language
	const colors = {
		"zh-tw": 0xe74c3c, // Red
		ja: 0x3498db, // Blue
		en: 0x2ecc71, // Green
	};

	const embed = new EmbedBuilder()
		.setTitle(article.title)
		.setURL(article.url)
		.setDescription(
			article.description.length > 300
				? `${article.description.substring(0, 297)}...`
				: article.description,
		)
		.setColor(colors[article.language])
		.setTimestamp(article.pubDate)
		.setFooter({
			text: `Pixivision ${languageName} • ${article.category}`,
		});

	// Add image if available
	if (article.imageUrl && typeof article.imageUrl === "string") {
		embed.setImage(article.imageUrl);
	}

	// Add language badge in the title area
	const languageEmojis = {
		"zh-tw": "🇹🇼",
		ja: "🇯🇵",
		en: "🇬🇧",
	};

	embed.setAuthor({
		name: `${languageEmojis[article.language]} ${languageName}`,
		url: article.url,
	});

	return embed;
}

export function createConfigEmbed(
	channelId: string,
	languages: string[],
): EmbedBuilder {
	return new EmbedBuilder()
		.setTitle("✅ Configuration Updated")
		.setDescription(
			`Pixivision notifications have been configured for this server.`,
		)
		.addFields(
			{
				name: "📢 Notification Channel",
				value: `<#${channelId}>`,
				inline: false,
			},
			{
				name: "🌐 Languages",
				value: languages.join(", "),
				inline: false,
			},
		)
		.setColor(0x00d4aa)
		.setTimestamp();
}

export function createErrorEmbed(message: string): EmbedBuilder {
	return new EmbedBuilder()
		.setTitle("❌ Error")
		.setDescription(message)
		.setColor(0xff0000)
		.setTimestamp();
}

export function createInfoEmbed(title: string, message: string): EmbedBuilder {
	return new EmbedBuilder()
		.setTitle(title)
		.setDescription(message)
		.setColor(0x3498db)
		.setTimestamp();
}
