import type { Client, TextChannel } from "discord.js";
import { ChannelType } from "discord.js";
import type { PixivisionArticle } from "@/models/types.ts";
import { supabase } from "@/services/supabase.ts";
import { createArticleEmbed } from "@/utils/embed-builder.ts";

class NotificationService {
	private client: Client | null = null;

	setClient(client: Client): void {
		this.client = client;
	}

	async sendArticleNotification(article: PixivisionArticle): Promise<void> {
		if (!this.client) {
			throw new Error("Discord client not initialized");
		}

		try {
			// Get all guild configs and filter for matching language
			const allConfigs = await supabase.getAllGuildConfigs();
			const matchingConfigs = allConfigs.filter(
				(config) => config.language === article.language,
			);

			console.log(
				`Processing ${article.language} article for ${matchingConfigs.length} configured channel(s)...`,
			);

			for (const config of matchingConfigs) {
				try {
					// Check if already posted to this guild
					const alreadyPosted = await supabase.isArticlePosted(
						article.url,
						config.guild_id,
					);

					if (alreadyPosted) {
						continue;
					}

					// Get the channel
					const channel = await this.client.channels.fetch(config.channel_id);

					if (!channel) {
						console.warn(
							`Channel ${config.channel_id} not found for guild ${config.guild_id}`,
						);
						continue;
					}

					// Check if it's a text channel
					if (channel.type !== ChannelType.GuildText) {
						console.warn(`Channel ${config.channel_id} is not a text channel`);
						continue;
					}

					// Send the notification
					const textChannel = channel as TextChannel;
					const embed = createArticleEmbed(article);

					await textChannel.send({ embeds: [embed] });

					// Mark as posted
					await supabase.markArticleAsPosted(
						article.url,
						config.guild_id,
						article.language,
					);

					console.log(
						`  ✓ Sent to guild ${config.guild_id} in channel ${config.channel_id}`,
					);
				} catch (error) {
					console.error(
						`Error sending notification to guild ${config.guild_id}:`,
						error,
					);
				}
			}
		} catch (error) {
			console.error("Error in sendArticleNotification:", error);
		}
	}

	async testNotification(
		channelId: string,
		article: PixivisionArticle,
	): Promise<void> {
		if (!this.client) {
			throw new Error("Discord client not initialized");
		}

		const channel = await this.client.channels.fetch(channelId);

		if (!channel || channel.type !== ChannelType.GuildText) {
			throw new Error("Channel not found or is not a text channel");
		}

		const textChannel = channel as TextChannel;
		const embed = createArticleEmbed(article);

		await textChannel.send({ embeds: [embed] });
	}
}

// Export singleton instance
export const notificationService = new NotificationService();
