import type { Language, PixivisionArticle } from "@/models/types.ts";
import { RSS_FEEDS } from "@/models/types.ts";

// ============================================================================
// RSS/Atom Feed Types
// ============================================================================

export type RSSImageObject = {
	url?: string;
	link?: string;
	title?: string;
};

export type AtomNestedValue = {
	"@"?: Record<string, unknown>;
	"#"?: string;
};

export type AtomImageObject = {
	"@"?: Record<string, unknown>;
	url?: AtomNestedValue;
	link?: AtomNestedValue;
	title?: AtomNestedValue;
};

export type RSSFeedItem = {
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
	// Atom format fields (pixivision uses Atom feeds)
	"atom:image"?: AtomImageObject;
	"atom:smallimage"?: AtomImageObject;
	"atom:link"?: {
		"@"?: { href?: string };
	};
	"atom:category"?: AtomNestedValue;
	meta: {
		link: string;
		title: string;
		[key: string]: unknown;
	};
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract image URL from legacy RSS image field
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
 * Extract image URL from RSS feed item
 * Priority: atom:image (Atom feeds) > rss:image (RSS 2.0) > image (fallback)
 */
export function extractArticleImageUrl(item: RSSFeedItem): string {
	if (item["atom:image"]?.url?.["#"]) {
		return item["atom:image"].url["#"];
	}
	if (item["rss:image"]?.url?.["#"]) {
		return item["rss:image"].url["#"];
	}
	return extractImageUrl(item.image);
}

/**
 * Extract article URL from RSS feed item
 * Priority: atom:link (Atom feeds) > link (RSS 2.0)
 */
export function extractArticleUrl(item: RSSFeedItem): string {
	return item["atom:link"]?.["@"]?.href || item.link || "";
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
 * Parse RSS feed item into PixivisionArticle
 */
export function parseRSSItemToArticle(
	item: RSSFeedItem,
	language: Language,
): PixivisionArticle {
	return {
		title: cleanText(item.title),
		url: extractArticleUrl(item),
		description: cleanText(item.description || ""),
		category: item.category || "未分類",
		imageUrl: extractArticleImageUrl(item),
		language,
		pubDate: new Date(item.pubdate),
	};
}

// ============================================================================
// Fetch Functions
// ============================================================================

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

		feeder.on("new-item", (item: RSSFeedItem) => {
			if (itemCount >= count) {
				feeder.destroy();
				resolve(articles);
				return;
			}

			const article = parseRSSItemToArticle(item, language);
			articles.push(article);
			itemCount++;

			if (itemCount >= count) {
				feeder.destroy();
				resolve(articles);
			}
		});

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
