import type { Client } from "discord.js";
import { Events } from "discord.js";
import { notificationService } from "@/services/notification.ts";
import { rssMonitor } from "@/services/rss-monitor.ts";

export const name = Events.ClientReady;
export const once = true;

export function execute(client: Client): void {
	if (!client.user) {
		console.error("Client user is not available");
		return;
	}

	console.log(`Logged in as ${client.user.tag}`);
	console.log(`Serving ${client.guilds.cache.size} guilds`);

	// Initialize notification service with client
	notificationService.setClient(client);

	// Set up RSS monitor callback
	rssMonitor.onNewArticle((article) => {
		notificationService.sendArticleNotification(article);
	});

	// Start RSS monitoring
	rssMonitor.start();

	console.log("Bot is ready!");
}
