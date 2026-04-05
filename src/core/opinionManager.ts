import { generateText } from 'ai';
import { getProviderModel } from './aiProvider.js';
import { RconService } from './rconClient.js';
import { TaskQueue } from './taskQueue.js';
import { permissionManager } from './permissionManager.js';
import { AGENT_NAME } from '../prompts/systemPrompt.js';

export interface OpinionProposal {
    id: string;
    command: string;
    description: string;
    startTime: number;
    collectedLogs: string[];
}

export class OpinionManager {
    private activeProposal: OpinionProposal | null = null;

    constructor(
        private rcon: RconService,
        private taskQueue: TaskQueue
    ) {}

    /**
     * Start a 10s opinion collection window.
     */
    async startCollection(command: string, description: string) {
        if (this.activeProposal) {
            return "已经有一个意图征集在进行中了，请稍后再试。";
        }

        const id = this.taskQueue.addPendingTask('RCON', command, description);
        this.activeProposal = {
            id,
            command,
            description,
            startTime: Date.now(),
            collectedLogs: []
        };

        // 1. Broadcast the proposal
        const announcement = [
            { text: `<${AGENT_NAME}> `, color: "white" },
            { text: `提案发起：`, color: "white" },
            { text: `/${command}`, color: "aqua", bold: true },
            { text: `。原因：${description}。请在 10 秒内发表意见。`, color: "white" }
        ];
        await this.rcon.executeCommand(`tellraw @a ${JSON.stringify(announcement)}`);

        // 2. Wait 10 seconds
        setTimeout(() => this.finalizeCollection(), 10000);
        
        return `意见征集 #${id} 已开始，倒计时 10 秒...`;
    }

    /**
     * Add a log line to current active proposal.
     */
    public addLog(line: string) {
        if (this.activeProposal) {
            this.activeProposal.collectedLogs.push(line);
        }
    }

    /**
     * Analyze results and execute/cancel.
     */
    private async finalizeCollection() {
        if (!this.activeProposal) return;

        const proposal = this.activeProposal;
        this.activeProposal = null;

        console.log(`[OpinionManager] Finishing collection for #${proposal.id}. Analyzing ${proposal.collectedLogs.length} lines.`);

        try {
            // 1. Filter chat logs
            const chatLogs = proposal.collectedLogs.filter(l => l.includes('[Async Chat Thread/INFO]'));
            if (chatLogs.length === 0) {
                await this.reportFailure(proposal.id, "在规定的时间内未收到有效反馈，任务已取消。");
                return;
            }

            // 2. AI Semantic Analysis
            const analysisResult = await generateText({
                model: getProviderModel('fast'),
                system: `You are an opinion analyzer for a Minecraft server. 
                Identify which players showed SUPPORT or AGREEMENT for the proposal: "${proposal.description}".
                Input is raw chat logs. Output a JSON array of player names only: ["Player1", "Player2"].
                Agreement can be semantic: "ok", "go", "support", "行", "可以", "支持".
                If no one agreed, output [].`,
                prompt: chatLogs.join('\n')
            });

            const supporters: string[] = JSON.parse(analysisResult.text.match(/\[.*\]/s)?.[0] || '[]');
            
            // 3. Count by levels
            let countS = 0, countA = 0, countB = 0;
            const uniqueSupporters = [...new Set(supporters)];

            for (const name of uniqueSupporters) {
                const level = permissionManager.getPlayerLevel(name);
                if (level === 'S') countS++;
                else if (level === 'A') countA++;
                else if (level === 'B') countB++;
            }

            console.log(`[OpinionManager] Results: S:${countS}, A:${countA}, B:${countB}`);

            // 4. Approval Logic: 1S or 3A or 5B
            if (countS >= 1 || countA >= 3 || countB >= 5) {
                const success = await this.taskQueue.approveTask(proposal.id);
                if (success) {
                    await this.reportSuccess(proposal.id, countS, countA, countB);
                } else {
                    await this.reportFailure(proposal.id, "任务执行过程中发生意外错误。");
                }
            } else {
                await this.reportFailure(proposal.id, `支持度不足（S:${countS}/1, A:${countA}/3, B:${countB}/5），提案未通过。`);
            }

        } catch (e) {
            console.error('[OpinionManager] Error finalizing:', e);
            await this.reportFailure(proposal.id, "分析过程异常中断。");
        }
    }

    private async reportSuccess(id: string, s: number, a: number, b: number) {
        const msg = [
            { text: `<${AGENT_NAME}> `, color: "white" },
            { text: `提案已通过。支持人数：`, color: "white" },
            { text: `S:${s} A:${a} B:${b}`, color: "green" },
            { text: `。指令已执行。`, color: "white" }
        ];
        await this.rcon.executeCommand(`tellraw @a ${JSON.stringify(msg)}`);
    }

    private async reportFailure(id: string, reason: string) {
        const msg = [
            { text: `<${AGENT_NAME}> `, color: "white" },
            { text: `提案未执行：${reason}`, color: "white" }
        ];
        await this.rcon.executeCommand(`tellraw @a ${JSON.stringify(msg)}`);
    }
}
