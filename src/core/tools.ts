import { tool } from 'ai';
import { z } from 'zod';
import { RconService } from './rconClient.js';

export function createAgentTools(rcon: RconService) {
    return {
        execute_rcon_command: tool({
            description: '最高权限后门。允许你在 Minecraft 服务器执行任何原生的控制台指令 (例如 weather clear, say hello, give Steve apple)。',
            parameters: z.object({
                command: z.string().describe('你想要执行的命令文本。切记：不要在开头加上 "/" 符号。'),
            }),
            execute: async ({ command }) => {
                try {
                    const result = await rcon.executeCommand(command);
                    return result || '指令执行成功，服务器没有返回额外输出。';
                } catch (e: any) {
                    return `指令执行失败 Error: ${e.message}`;
                }
            },
        }),
        broadcast_message: tool({
            description: '向全服玩家发送显眼的广播公告。',
            parameters: z.object({
                message: z.string().describe('广播信息的内容。'),
            }),
            execute: async ({ message }) => {
                try {
                    // 使用 tellraw 来实现颜色文本，如果没有 tellraw 可以退化为 say
                    const parsedMsg = JSON.stringify({ text: `[AI管理员] ${message}`, color: "yellow" });
                    const result = await rcon.executeCommand(`tellraw @a ${parsedMsg}`);
                    return `广播成功发送。输出反馈: ${result}`;
                } catch (e: any) {
                    return `送广播出错 Error: ${e.message}`;
                }
            },
        }),
        whisper_player: tool({
            description: '给当前在线的某位特定玩家发送私密消息。',
            parameters: z.object({
                playerName: z.string().describe('玩家的精准游戏名。'),
                message: z.string().describe('私信内容。'),
            }),
            execute: async ({ playerName, message }) => {
                try {
                    const result = await rcon.executeCommand(`tell ${playerName} [AI私信] ${message}`);
                    return `私密消息已发送给 ${playerName}。反馈: ${result}`;
                } catch (e: any) {
                    return `发信失败 Error: ${e.message}`;
                }
            },
        }),
        get_online_players: tool({
            description: '查询当前服务器内在线的玩家列表。让你知道你能和谁进行互动或干预。',
            parameters: z.object({}),
            execute: async () => {
                try {
                    const result = await rcon.executeCommand('list');
                    return result || '获取列表为空。';
                } catch (e: any) {
                    return `获取失败 Error: ${e.message}`;
                }
            },
        })
    };
}
