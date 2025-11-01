import type { Language, PixivisionArticle } from "@/models/types.ts";
import { RSS_FEEDS } from "@/models/types.ts";

type RSSImageObject = {
	url?: string;
	link?: string;
	title?: string;
};

/**
 * Extract image URL from RSS item image field
 */
export function extractImageUrl(image?: string | RSSImageObject): string {
	if (typeof image === "string") {
		return image;
	}
	if (image && typeof image === "object" && image.url) {
		return image.url;
	}
	return "";
}

/**
 * Clean HTML text
 */
export function cleanText(text: string): string {
	return text
		.replace(/<[^>]*>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#039;/g, "'")
		.trim();
}

/**
 * Fetch and parse RSS feed to get recent articles
 */
export async function fetchRecentArticles(
	language: Language,
	count: number = 10,
): Promise<PixivisionArticle[]> {
	const RssFeedEmitter = (await import("rss-feed-emitter")).default;

	return new Promise((resolve, reject) => {
		const feeder = new RssFeedEmitter({
			userAgent: "Pixivision-Discord-Bot/1.0",
		});

		const articles: PixivisionArticle[] = [];
		let itemCount = 0;

		feeder.on(
			"new-item",
			(item: {
				title: string;
				link: string;
				pubdate: string;
				description: string;
				category?: string;
				image?: string | RSSImageObject;
			}) => {
				if (itemCount >= count) {
					feeder.destroy();
					resolve(articles);
					return;
				}

				const imageUrl = extractImageUrl(item.image);

				const article: PixivisionArticle = {
					title: cleanText(item.title),
					url: item.link,
					description: cleanText(item.description || ""),
					category: item.category || "未分類",
					imageUrl,
					language,
					pubDate: new Date(item.pubdate),
				};

				articles.push(article);
				itemCount++;

				if (itemCount >= count) {
					feeder.destroy();
					resolve(articles);
				}
			},
		);

		feeder.on("error", (error: Error) => {
			feeder.destroy();
			reject(error);
		});

		// Set a timeout in case we don't get enough items
		setTimeout(() => {
			feeder.destroy();
			if (articles.length > 0) {
				resolve(articles);
			} else {
				reject(new Error("No articles found"));
			}
		}, 10000); // 10 second timeout

		feeder.add({
			url: RSS_FEEDS[language],
			refresh: 60000, // Will only fetch once since we destroy after getting items
		});
	});
}
