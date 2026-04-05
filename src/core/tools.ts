import { jsonSchema, type Tool } from 'ai';
import { RconService } from './rconClient.js';

export function createAgentTools(rcon: RconService): Record<string, Tool<any, any>> {
    return {
        execute_rcon_command: {
            description: '最高权限后门。允许你在 Minecraft 服务器执行任何原生的控制台指令 (例如 weather clear, say hello, give Steve apple)。',
            inputSchema: jsonSchema({
                type: 'object',
                properties: {
                    command: {
                        type: 'string',
                        description: '你想要执行的命令文本。切记：不要在开头加上 "/" 符号。'
                    }
                },
                required: ['command']
            }),
            execute: async ({ command }: { command: string }) => {
                try {
                    const result = await rcon.executeCommand(command);
                    return result || '指令执行成功，服务器没有返回额外输出。';
                } catch (e: any) {
                    return `指令执行失败 Error: ${e.message}`;
                }
            },
        },
        broadcast_message: {
            description: '向全服玩家发送显眼的广播公告。',
            inputSchema: jsonSchema({
                type: 'object',
                properties: {
                    message: {
                        type: 'string',
                        description: '广播信息的内容。'
                    }
                },
                required: ['message']
            }),
            execute: async ({ message }: { message: string }) => {
                try {
                    // 使用 tellraw 来实现颜色文本，如果没有 tellraw 可以退化为 say
                    const parsedMsg = JSON.stringify({ text: `[AI管理员] ${message}`, color: "yellow" });
                    const result = await rcon.executeCommand(`tellraw @a ${parsedMsg}`);
                    return `广播成功发送。输出反馈: ${result}`;
                } catch (e: any) {
                    return `送广播出错 Error: ${e.message}`;
                }
            },
        },
        whisper_player: {
            description: '给当前在线的某位特定玩家发送私密消息。',
            inputSchema: jsonSchema({
                type: 'object',
                properties: {
                    playerName: {
                        type: 'string',
                        description: '玩家的精准游戏名。'
                    },
                    message: {
                        type: 'string',
                        description: '私密消息的内容。'
                    }
                },
                required: ['playerName', 'message']
            }),
            execute: async ({ playerName, message }: { playerName: string, message: string }) => {
                try {
                    const result = await rcon.executeCommand(`tell ${playerName} [AI私信] ${message}`);
                    return `私密消息已发送给 ${playerName}。反馈: ${result}`;
                } catch (e: any) {
                    return `发信失败 Error: ${e.message}`;
                }
            },
        },
        get_online_players: {
            description: '查询当前服务器内在线的玩家列表。让你知道你能和谁进行互动或干预。',
            inputSchema: jsonSchema({
                type: 'object',
                properties: {
                    _dummy: {
                        type: 'string',
                        description: '占位符'
                    }
                }
            }),
            execute: async () => {
                try {
                    const result = await rcon.executeCommand('list');
                    return result || '获取列表为空。';
                } catch (e: any) {
                    return `获取失败 Error: ${e.message}`;
                }
            },
        }
    };
}
