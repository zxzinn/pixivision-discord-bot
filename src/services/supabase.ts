import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { GuildConfig, Language, PostedArticle } from "@/models/types.ts";

class SupabaseService {
	private client: SupabaseClient;

	constructor() {
		const supabaseUrl = process.env.SUPABASE_URL;
		const supabaseKey = process.env.SUPABASE_ANON_KEY;

		if (!supabaseUrl || !supabaseKey) {
			throw new Error(
				"Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_ANON_KEY in .env",
			);
		}

		this.client = createClient(supabaseUrl, supabaseKey);
	}

	// Guild Configuration Methods

	/**
	 * Get all language configs for a guild
	 */
	async getGuildConfigs(guildId: string): Promise<GuildConfig[]> {
		const { data, error } = await this.client
			.from("guild_configs")
			.select("*")
			.eq("guild_id", guildId);

		if (error) throw error;
		return data || [];
	}

	/**
	 * Get config for a specific language in a guild
	 */
	async getGuildLanguageConfig(
		guildId: string,
		language: Language,
	): Promise<GuildConfig | null> {
		const { data, error } = await this.client
			.from("guild_configs")
			.select("*")
			.eq("guild_id", guildId)
			.eq("language", language)
			.maybeSingle();

		if (error) throw error;
		return data;
	}

	/**
	 * Get all guild configs (for notification service)
	 */
	async getAllGuildConfigs(): Promise<GuildConfig[]> {
		const { data, error } = await this.client.from("guild_configs").select("*");

		if (error) throw error;
		return data || [];
	}

	/**
	 * Set channel for specific language(s) in a guild
	 * If multiple languages provided, creates one config per language
	 */
	async setGuildLanguageConfigs(
		guildId: string,
		channelId: string,
		languages: Language[],
	): Promise<GuildConfig[]> {
		const configs = languages.map((language) => ({
			guild_id: guildId,
			language,
			channel_id: channelId,
			updated_at: new Date().toISOString(),
		}));

		const { data, error } = await this.client
			.from("guild_configs")
			.upsert(configs, {
				onConflict: "guild_id,language",
			})
			.select();

		if (error) throw error;
		return data || [];
	}

	/**
	 * Delete specific language config
	 */
	async deleteGuildLanguageConfig(
		guildId: string,
		language: Language,
	): Promise<void> {
		const { error } = await this.client
			.from("guild_configs")
			.delete()
			.eq("guild_id", guildId)
			.eq("language", language);

		if (error) throw error;
	}

	/**
	 * Delete all configs for a guild
	 */
	async deleteAllGuildConfigs(guildId: string): Promise<void> {
		const { error } = await this.client
			.from("guild_configs")
			.delete()
			.eq("guild_id", guildId);

		if (error) throw error;
	}

	// Posted Articles Methods

	async isArticlePosted(articleUrl: string, guildId: string): Promise<boolean> {
		const { data, error } = await this.client
			.from("posted_articles")
			.select("id")
			.eq("article_url", articleUrl)
			.eq("guild_id", guildId)
			.maybeSingle();

		if (error) throw error;
		return data !== null;
	}

	async markArticleAsPosted(
		articleUrl: string,
		guildId: string,
		language: Language,
	): Promise<PostedArticle> {
		const { data, error } = await this.client
			.from("posted_articles")
			.insert({
				article_url: articleUrl,
				guild_id: guildId,
				language,
			})
			.select()
			.single();

		if (error) {
			// If it's a duplicate key error, it's already posted - that's fine
			if (error.code === "23505") {
				throw new Error("Article already posted");
			}
			throw error;
		}

		return data;
	}

	async getPostedArticlesCount(guildId: string): Promise<number> {
		const { count, error } = await this.client
			.from("posted_articles")
			.select("*", { count: "exact", head: true })
			.eq("guild_id", guildId);

		if (error) throw error;
		return count || 0;
	}

	async cleanupOldArticles(daysToKeep = 30): Promise<number> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

		const { data, error } = await this.client
			.from("posted_articles")
			.delete()
			.lt("posted_at", cutoffDate.toISOString())
			.select();

		if (error) throw error;
		return data?.length || 0;
	}
}

// Export singleton instance
export const supabase = new SupabaseService();
