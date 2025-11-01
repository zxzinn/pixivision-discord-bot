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

	async getGuildConfig(guildId: string): Promise<GuildConfig | null> {
		const { data, error } = await this.client
			.from("guild_configs")
			.select("*")
			.eq("guild_id", guildId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				// No rows returned
				return null;
			}
			throw error;
		}

		return data;
	}

	async getAllGuildConfigs(): Promise<GuildConfig[]> {
		const { data, error } = await this.client.from("guild_configs").select("*");

		if (error) throw error;
		return data || [];
	}

	async setGuildConfig(
		guildId: string,
		channelId: string,
		languages: Language[],
	): Promise<GuildConfig> {
		const { data, error } = await this.client
			.from("guild_configs")
			.upsert(
				{
					guild_id: guildId,
					channel_id: channelId,
					languages,
					updated_at: new Date().toISOString(),
				},
				{
					onConflict: "guild_id",
				},
			)
			.select()
			.single();

		if (error) throw error;
		return data;
	}

	async deleteGuildConfig(guildId: string): Promise<void> {
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
