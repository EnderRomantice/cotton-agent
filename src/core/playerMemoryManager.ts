import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

/**
 * PlayerMemoryManager handles individual player profiles stored as .md files.
 * Provides a simple way for the agent to store/retrieve persistent player info.
 */
export class PlayerMemoryManager {
    private playersPath: string;

    constructor() {
        // We project the data folder inside the project root for better isolation.
        // If config.mcServerPath exists, we can also put it there.
        // Let's use the current workdir for now as per plan.
        this.playersPath = path.join(process.cwd(), 'data', 'players');
    }

    /**
     * Ensure the players directory exists.
     */
    private async ensureDir() {
        try {
            await fs.mkdir(this.playersPath, { recursive: true });
        } catch (error) {
            console.error(`[PlayerMemoryManager] Failed to create players directory:`, error);
        }
    }

    /**
     * Get memory for a player. Returns an empty string if no memory exists.
     */
    public async getMemory(playerName: string): Promise<string> {
        await this.ensureDir();
        const filePath = path.join(this.playersPath, `${playerName}.md`);
        try {
            return await fs.readFile(filePath, 'utf-8');
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return ''; // No record yet
            }
            console.error(`[PlayerMemoryManager] Error reading ${playerName}.md:`, error);
            return '';
        }
    }

    /**
     * Set/Update memory for a player.
     */
    public async setMemory(playerName: string, content: string): Promise<void> {
        await this.ensureDir();
        const filePath = path.join(this.playersPath, `${playerName}.md`);
        try {
            await fs.writeFile(filePath, content, 'utf-8');
            console.log(`[PlayerMemoryManager] Memory updated for player: ${playerName}`);
        } catch (error) {
            console.error(`[PlayerMemoryManager] Error writing ${playerName}.md:`, error);
        }
    }
}

// Export singleton
export const playerMemoryManager = new PlayerMemoryManager();
