import RssFeedEmitter from "rss-feed-emitter";
import type { Language, PixivisionArticle } from "@/models/types.ts";
import { LANGUAGE_NAMES, RSS_FEEDS } from "@/models/types.ts";
import { cleanText, extractImageUrl } from "@/utils/rss-parser.ts";

type RSSImageObject = {
	url?: string;
	link?: string;
	title?: string;
};

type RSSFeedEmitterItem = {
	title: string;
	link: string;
	pubdate: string;
	description: string;
	category?: string;
	image?: string | RSSImageObject;
	smallimage?: string | RSSImageObject;
	"rss:image"?: {
		url?: { "#": string };
	};
	meta: {
		link: string;
		title: string;
		[key: string]: unknown;
	};
};

class RSSMonitorService {
	private feeder: RssFeedEmitter;
	private onNewArticleCallback?: (article: PixivisionArticle) => void;

	constructor() {
		this.feeder = new RssFeedEmitter({
			userAgent: "Pixivision-Discord-Bot/1.0",
			skipFirstLoad: true,
		});

		// Set up event listeners
		this.feeder.on("new-item", (item: RSSFeedEmitterItem) => {
			this.handleNewItem(item);
		});

		this.feeder.on("error", (error: Error) => {
			console.error("RSS Feed Error:", error);
		});
	}

	start(): void {
		console.log("Starting RSS monitoring...");

		// Add all language feeds
		for (const [lang, url] of Object.entries(RSS_FEEDS)) {
			this.feeder.add({
				url,
				refresh: Number.parseInt(
					process.env.RSS_CHECK_INTERVAL || "300000",
					10,
				),
			});
			console.log(`  ✓ Monitoring ${LANGUAGE_NAMES[lang as Language]}: ${url}`);
		}
	}

	stop(): void {
		console.log("Stopping RSS monitoring...");
		this.feeder.destroy();
	}

	onNewArticle(callback: (article: PixivisionArticle) => void): void {
		this.onNewArticleCallback = callback;
	}

	private handleNewItem(item: RSSFeedEmitterItem): void {
		try {
			// Determine language from feed URL
			const language = this.detectLanguage(item.meta.link);

			if (!language) {
				console.warn("Could not detect language for item:", item.link);
				return;
			}

			// Extract image URL from RSS item
			let imageUrl = extractImageUrl(item.image);
			// rss-feed-emitter puts image data in "rss:image" field
			if (!imageUrl && item["rss:image"]?.url?.["#"]) {
				imageUrl = item["rss:image"].url["#"];
			}

			// Parse the RSS item into our article format
			const article: PixivisionArticle = {
				title: cleanText(item.title),
				url: item.link,
				description: cleanText(item.description || ""),
				category: item.category || "未分類",
				imageUrl,
				language,
				pubDate: new Date(item.pubdate),
			};

			console.log(
				`New article detected: [${LANGUAGE_NAMES[language]}] ${article.title}`,
			);

			// Call the callback if registered
			if (this.onNewArticleCallback) {
				this.onNewArticleCallback(article);
			}
		} catch (error) {
			console.error("Error handling RSS item:", error);
		}
	}

	private detectLanguage(feedUrl: string): Language | null {
		if (feedUrl.includes("/zh-tw/")) return "zh-tw";
		if (feedUrl.includes("/ja/")) return "ja";
		if (feedUrl.includes("/en/")) return "en";
		return null;
	}
}

// Export singleton instance
export const rssMonitor = new RSSMonitorService();
