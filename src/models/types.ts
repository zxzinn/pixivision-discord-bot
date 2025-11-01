// Type definitions for Pixivision Discord Bot

export type Language = "zh-tw" | "ja" | "en";

export const LANGUAGE_NAMES: Record<Language, string> = {
	"zh-tw": "繁體中文",
	ja: "日本語",
	en: "English",
};

export const RSS_FEEDS: Record<Language, string> = {
	"zh-tw": "https://www.pixivision.net/zh-tw/rss",
	ja: "https://www.pixivision.net/ja/rss",
	en: "https://www.pixivision.net/en/rss",
};

// Database types
export interface GuildConfig {
	guild_id: string;
	language: Language;
	channel_id: string;
	created_at: string;
	updated_at: string;
}

export interface PostedArticle {
	id: number;
	article_url: string;
	guild_id: string;
	language: Language;
	posted_at: string;
}

// RSS Feed types
export interface RSSItem {
	title: string;
	link: string;
	pubDate: string;
	description: string;
	category?: string;
	image?: string;
	smallImage?: string;
}

export interface PixivisionArticle {
	title: string;
	url: string;
	description: string;
	category: string;
	imageUrl: string;
	language: Language;
	pubDate: Date;
}
