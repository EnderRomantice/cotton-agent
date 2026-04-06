import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

interface UserCacheEntry {
    name: string;
    uuid: string;
    expiresOn: string;
}

/**
 * StatsManager handles reading Minecraft player statistics and mapping names to UUIDs.
 */
export class StatsManager {
    private serverPath: string;
    private worldPath: string;

    constructor() {
        this.serverPath = config.mcServerPath;
        this.worldPath = path.join(this.serverPath, config.worldName);
    }

    /**
     * Map a player name to their UUID using usercache.json.
     */
    public async getUuid(playerName: string): Promise<string | null> {
        const cachePath = path.join(this.serverPath, 'usercache.json');
        try {
            const content = await fs.readFile(cachePath, 'utf-8');
            const cache: UserCacheEntry[] = JSON.parse(content);
            const entry = cache.find(e => e.name.toLowerCase() === playerName.toLowerCase());
            return entry ? entry.uuid : null;
        } catch (error) {
            console.error(`[StatsManager] Error reading usercache.json:`, error);
            return null;
        }
    }

    /**
     * Get player statistics (playtime and deaths).
     */
    public async getPlayerStats(playerName: string): Promise<{ playtimeHours: number, deaths: number } | null> {
        const uuid = await this.getUuid(playerName);
        if (!uuid) return null;

        const statsPath = path.join(this.worldPath, 'stats', `${uuid}.json`);
        try {
            const content = await fs.readFile(statsPath, 'utf-8');
            const stats = JSON.parse(content);
            
            // Statistics keys can vary slightly between MC versions. 
            // In 1.17+, they are deeply nested.
            const customStats = stats.stats?.['minecraft:custom'] || {};
            
            const playTimeTicks = customStats['minecraft:play_time'] || customStats['minecraft:total_world_time'] || 0;
            const deaths = customStats['minecraft:deaths'] || 0;

            // 20 ticks = 1 second
            const playtimeHours = Math.floor(playTimeTicks / (20 * 60 * 60));

            return { playtimeHours, deaths };
        } catch (error) {
            console.error(`[StatsManager] Error reading stats for ${playerName} (${uuid}):`, error);
            return null;
        }
    }
}

export const statsManager = new StatsManager();
