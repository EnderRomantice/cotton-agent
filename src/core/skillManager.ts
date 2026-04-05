import fs from 'fs/promises';
import path from 'path';

/**
 * SkillManager handles modular instruction sets (Skills) for the agent.
 * Each skill is a .md file in the src/skills/ directory.
 */
export class SkillManager {
    private skillsPath: string;
    private skills: Map<string, string> = new Map();

    constructor(baseDir: string) {
        this.skillsPath = path.join(baseDir, 'skills');
    }

    /**
     * Load all .md files from the skills directory.
     */
    async loadSkills() {
        try {
            // Ensure directory exists
            await fs.mkdir(this.skillsPath, { recursive: true });
            
            const files = await fs.readdir(this.skillsPath);
            const mdFiles = files.filter(f => f.endsWith('.md'));

            for (const file of mdFiles) {
                const content = await fs.readFile(path.join(this.skillsPath, file), 'utf-8');
                const skillName = path.basename(file, '.md');
                this.skills.set(skillName, content);
                console.log(`[SkillManager] Loaded skill: ${skillName}`);
            }
        } catch (error) {
            console.error('[SkillManager] Error loading skills:', error);
        }
    }

    /**
     * Get all loaded skills concatenated with separators.
     */
    getAllSkillsContent(): string {
        let content = '';
        this.skills.forEach((value, key) => {
            content += `\n\n===== SKILL: ${key.toUpperCase()} =====\n${value}\n`;
        });
        return content;
    }

    /**
     * Get the count of loaded skills.
     */
    getSkillCount(): number {
        return this.skills.size;
    }
}
