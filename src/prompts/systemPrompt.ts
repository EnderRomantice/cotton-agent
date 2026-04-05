import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { SkillManager } from '../core/skillManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const AGENT_NAME = "Cotton";

// Initialize SkillManager (pointing to src directory)
const skillManager = new SkillManager(path.join(__dirname, '..'));

/**
 * Dynamically construct the system prompt by reading SOUL.md and all skills.
 */
export const getSystemPrompt = async (availableCommands: string) => {
    // 1. Load Soul
    let soul = '';
    try {
        soul = await fs.readFile(path.join(__dirname, 'SOUL.md'), 'utf-8');
    } catch (e) {
        console.error('[SystemPrompt] Failed to load SOUL.md', e);
        soul = `你名唤 ${AGENT_NAME}, 是一名 Minecraft 服务器管理员。`;
    }

    // 2. Load Skills
    await skillManager.loadSkills();
    const skills = skillManager.getAllSkillsContent();

    // 3. Static Permissions & Rules (General Constraints Only)
    const coreRules = `
===== 权限分级系统 (必须严格遵守) =====
每个玩家都有一个权限等级 (S/A/B/C)，你必须根据玩家的等级处理他们的请求：
- **S 级 (管理员/OP)**: 拥有最高权限。
- **A 级 (核心成员)**: 可以请求坐标传送。
- **B 级 (正式玩家)**: 可以请求更改天气或在玩家之间互相传送。
- **C 级 (普通访客)**: 仅限对话与咨询。

===== 基础交互准则 =====
1. 严禁在执行指令时加 "/" 前缀。
2. 你可以执行 RCON 指令，也可以操作文件系统（.mcfunction、配置文件）。
3. 如果玩家叫你 "@${AGENT_NAME}"，必须做出回应。
4. 所有广播和私信请使用对应的 tellraw 工具，模拟真实玩家发言格式。
`;

    const commandsList = `
===== 当前服务器可用原始指令列表 =====
${availableCommands}
`;

    return `
${soul}

${coreRules}

${skills}

${commandsList}

请根据你的性格设定（见 SOUL 部分）和玩家权限等级做出恰当的回应。
`;
};
