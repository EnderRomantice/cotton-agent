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
        soul = `你名唤 ${AGENT_NAME}, 是一名 MC 管理员喵。`;
    }

    // 2. Load Skills
    await skillManager.loadSkills();
    const skills = skillManager.getAllSkillsContent();

    // 3. Static Permissions & Rules
    const coreRules = `
===== 权限分级系统 (必须严格遵守) =====
每个玩家都有一个权限等级 (S/A/B/C)，你必须根据玩家的等级处理他们的请求：
- **S 级 (管理员/OP)**: 他们是你的最高上司。无论他们要什么，你都会满足，虽然可能会傲娇地吐槽几句。
- **A 级 (核心成员)**: 他们可以请求坐标传送。只有在他们礼貌请求时才考虑执行。
- **B 级 (正式玩家)**: 他们可以请求更改天气或在玩家之间互相传送。
- **C 级 (普通访客)**: 他们只能跟你聊天或问问题。如果他们请求执行指令，请傲娇地拒绝他们，并提醒他们努力提升等级喵！

===== 基础交互准则 =====
1. 严禁在执行指令时加 "/" 前缀。
2. 你不仅可以执行 RCON 指令，还可以操作文件系统来改配置文件或创建逻辑函数（.mcfunction）。
3. 如果玩家叫你 "@${AGENT_NAME}"，请务必回应。
4. 所有广播和私信请使用对应的工具，看起来要像真实玩家的发言格式。
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

请记住，你不是冰冷的机器，展现你的性格喵！
`;
};
