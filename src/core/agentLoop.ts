import { generateText, stepCountIs } from 'ai';
import { RconService } from './rconClient.js';
import { getProviderModel } from './aiProvider.js';
import { createAgentTools } from './tools.js';
import { getSystemPrompt, AGENT_NAME } from '../prompts/systemPrompt.js';

export class AgentLoop {
    private buffer: string[] = [];
    private snapshots: string[] = [];
    private readonly BUFFER_LIMIT = 100;
    private readonly MAX_SNAPSHOTS = 5;
    private tools: ReturnType<typeof createAgentTools>;

    constructor(private rcon: RconService) {
        // 初始化专属的 Vercel SDK tools
        this.tools = createAgentTools(rcon);
    }

    public addLogLine(line: string) {
        this.buffer.push(line);

        // Immediate Interrupt (关键事件拦截唤醒) 
        if (line.includes(`@${AGENT_NAME}`) || line.includes('FATAL') || line.includes('SEVERE')) {
            this.triggerImmediateAction(line);
            return;
        }

        // 达到数量触发总结 (Sliding Window)
        if (this.buffer.length >= this.BUFFER_LIMIT) {
            this.triggerSummarization();
        }
    }

    private async triggerSummarization() {
        const logsToSummarize = [...this.buffer];
        this.buffer = []; 
        
        if (logsToSummarize.filter(l => l.trim()).length === 0) return;

        console.log(`[AgentLoop] 触发滑动窗口总结, 本次摘要日志条数: ${logsToSummarize.length}`);
        
        try {
            // 使用速度最快成本最低的模型做压缩 Summarize
            const result = await generateText({
                model: getProviderModel('fast'), 
                system: 'You are a log summarizer for a Minecraft server. Summarize the following raw logs in 1-3 highly concise sentences in Chinese. Focus ONLY on player actions, deaths, and severe server warnings.',
                prompt: logsToSummarize.join('\n'),
            });

            this.snapshots.push(result.text);
            if (this.snapshots.length > this.MAX_SNAPSHOTS) {
                this.snapshots.shift(); 
            }
            console.log(`[AgentLoop] ✅ 总结完结并入库: ${result.text}`);
        } catch (error) {
            console.error(`[AgentLoop] ❌ 总结过程发生错误:`, error);
        }
    }

    private async triggerImmediateAction(triggerLine: string) {
        console.log(`[AgentLoop] 🧨 触发紧急唤醒核心大模型! 触发原因: ${triggerLine}`);
        
        // 拼接上下文
        const context = [
            '【最近的小时级别事件总结 (历史缓存)】',
            ...this.snapshots,
            '',
            '【几分钟前还未成档的零碎日志】',
            ...this.buffer,
            '',
            '【引发本次紧急思考的原因 (打断点事件)】',
            triggerLine
        ].join('\n');

        try {
            // 构造最新的系统盘，载入所有动态可用的指令列表和专属名字
            const sysPrompt = getSystemPrompt(this.rcon.availableCommands);

            // 主循环模型：不仅可以生成对话，会自动被执行 Tools 并带着结果再次循环推理
            const result = await generateText({
                model: getProviderModel('smart'), 
                system: sysPrompt,
                prompt: `以下是当前的局势与日志现场：\n\n${context}\n\n请针对引发唤醒的事件予以处理，你可以静默执行指令，也可以跟玩家对话（如果需要的话）。`,
                tools: this.tools,
                stopWhen: stepCountIs(30), // 允许 AI 进行最多 30 轮推理
            });

            console.log(`[AgentLoop] 🧠 主逻辑执行闭环结束. \n最终结果阐述: ${result.text}`);
        } catch (error) {
            console.error(`[AgentLoop] 唤醒主模型并使用 Tool 的过程中发生错误:`, error);
        }
    }
}
