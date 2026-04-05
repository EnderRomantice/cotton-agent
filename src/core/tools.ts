import fs from 'fs/promises';
import path from 'path';
import { jsonSchema, type Tool } from 'ai';
import { RconService } from './rconClient.js';
import { AGENT_NAME } from '../prompts/systemPrompt.js';
import { config } from '../config.js';
import { permissionManager } from './permissionManager.js';
import { PermissionLevel, PERMISSION_DEFINITIONS } from './permissions.js';
import { TaskQueue } from './taskQueue.js';
import { OpinionManager } from './opinionManager.js';

export function createAgentTools(rcon: RconService, taskQueue: TaskQueue, opinionManager: OpinionManager): Record<string, Tool<any, any>> {
    const chatPrefix = `<${AGENT_NAME}> `;

    return {
        // --- 权限管理 ---
        get_player_permission: {
            description: '查询特定玩家的权限等级（S/A/B/C）。在执行涉及权限的操作前，请务必先查询！',
            inputSchema: jsonSchema({
                type: 'object',
                properties: {
                    playerName: { type: 'string', description: '玩家的精准游戏名。' }
                },
                required: ['playerName']
            }),
            execute: async ({ playerName }: { playerName: string }) => {
                const level = permissionManager.getPlayerLevel(playerName);
                const def = PERMISSION_DEFINITIONS[level];
                return `玩家 ${playerName} 的权限等级为: ${level} (${def.description})`;
            }
        },

        // --- 任务与指令管理 ---
        execute_rcon_command: {
            description: '执行常规 RCON 指令。对于敏感指令（如修改规则），请优先使用 collect_opinions。',
            inputSchema: jsonSchema({
                type: 'object',
                properties: {
                    command: {
                        type: 'string',
                        description: '命令文本。不要加 "/"。'
                    },
                    description: {
                        type: 'string',
                        description: '简单描述你为什么要执行这个指令。'
                    }
                },
                required: ['command', 'description']
            }),
            execute: async ({ command, description }: { command: string, description: string }) => {
                try {
                    const result = await taskQueue.executeImmediate('RCON', command, description);
                    return result || '指令执行成功喵~';
                } catch (e: any) {
                    return `执行失败: ${e.message}`;
                }
            },
        },
        collect_opinions: {
            description: '发起“意见征集”。当你想要执行敏感指令（修改规则、清空、大规模传送）时，必须通过此工具征求意见。',
            inputSchema: jsonSchema({
                type: 'object',
                properties: {
                    command: { type: 'string', description: '待执行的 RCON 指令。' },
                    description: { type: 'string', description: '为什么要执行这条指令？' }
                },
                required: ['command', 'description']
            }),
            execute: async ({ command, description }: { command: string, description: string }) => {
                return await opinionManager.startCollection(command, description);
            }
        },
        broadcast_message: {
            description: '模拟玩家身份向全服发送消息。看起来就像 <${AGENT_NAME}> 在说话。',
            inputSchema: jsonSchema({
                type: 'object',
                properties: {
                    message: { type: 'string', description: '消息内容。' }
                },
                required: ['message']
            }),
            execute: async ({ message }: { message: string }) => {
                try {
                    // Use tellraw to simulate player chat: <Cotton> message
                    const tellrawObj = [
                        { text: `<${AGENT_NAME}> `, color: "white" },
                        { text: message, color: "white" }
                    ];
                    await rcon.executeCommand(`tellraw @a ${JSON.stringify(tellrawObj)}`);
                    return `消息已播报。`;
                } catch (e: any) {
                    return `播报失败: ${e.message}`;
                }
            },
        },
        whisper_player: {
            description: '给某位玩家发私信。模拟 <${AGENT_NAME}> -> 你 的样式。',
            inputSchema: jsonSchema({
                type: 'object',
                properties: {
                    playerName: { type: 'string', description: '目标玩家。' },
                    message: { type: 'string', description: '私信内容。' }
                },
                required: ['playerName', 'message']
            }),
            execute: async ({ playerName, message }: { playerName: string, message: string }) => {
                try {
                    const tellrawObj = [
                        { text: `[${AGENT_NAME} -> 你] `, color: "gray", italic: true },
                        { text: message, color: "white", italic: true }
                    ];
                    await rcon.executeCommand(`tellraw ${playerName} ${JSON.stringify(tellrawObj)}`);
                    return `私信已送达 ${playerName}。`;
                } catch (e: any) {
                    return `私信失败: ${e.message}`;
                }
            },
        },
        get_online_players: {
            description: '查询当前服务器内在线的玩家列表。',
            inputSchema: jsonSchema({
                type: 'object',
                properties: {}
            }),
            execute: async () => {
                try {
                    const result = await rcon.executeCommand('list');
                    return result || '获取列表为空。';
                } catch (e: any) {
                    return `获取失败 Error: ${e.message}`;
                }
            },
        },

        // --- 文件系统 (Bash CRUD) ---
        fs_list_dir: {
            description: '列出 Minecraft 服务器指定目录下的内容。',
            inputSchema: jsonSchema({
                type: 'object',
                properties: {
                    relPath: { type: 'string', description: '相对于服务器根目录的路径。' }
                },
                required: ['relPath']
            }),
            execute: async ({ relPath }: { relPath: string }) => {
                try {
                    const fullPath = path.join(config.mcServerPath, relPath);
                    const files = await fs.readdir(fullPath);
                    return `目录 ${relPath} 下的文件列表: \n${files.join('\n')}`;
                } catch (e: any) {
                    return `读取目录失败: ${e.message}`;
                }
            }
        },
        fs_read_file: {
            description: '读取服务器上的文件内容。',
            inputSchema: jsonSchema({
                type: 'object',
                properties: {
                    relPath: { type: 'string', description: '相对于服务器根目录的路径。' }
                },
                required: ['relPath']
            }),
            execute: async ({ relPath }: { relPath: string }) => {
                try {
                    const fullPath = path.join(config.mcServerPath, relPath);
                    const content = await fs.readFile(fullPath, 'utf8');
                    return `文件 ${relPath} 内容如下: \n\n${content}`;
                } catch (e: any) {
                    return `读取文件失败: ${e.message}`;
                }
            }
        },
        fs_write_file: {
            description: '在服务器上创建或修改文件。',
            inputSchema: jsonSchema({
                type: 'object',
                properties: {
                    relPath: { type: 'string', description: '相对于服务器根目录的路径。' },
                    content: { type: 'string', description: '文件内容。' }
                },
                required: ['relPath', 'content']
            }),
            execute: async ({ relPath, content }: { relPath: string, content: string }) => {
                try {
                    const fullPath = path.join(config.mcServerPath, relPath);
                    await fs.mkdir(path.dirname(fullPath), { recursive: true });
                    await fs.writeFile(fullPath, content, 'utf8');
                    return `文件 ${relPath} 已成功写入。`;
                } catch (e: any) {
                    return `写入文件失败: ${e.message}`;
                }
            }
        },
        fs_delete: {
            description: '递归删除服务器上的文件或文件夹。谨慎使用！',
            inputSchema: jsonSchema({
                type: 'object',
                properties: {
                    relPath: { type: 'string', description: '相对于服务器根目录的路径。' }
                },
                required: ['relPath']
            }),
            execute: async ({ relPath }: { relPath: string }) => {
                try {
                    const fullPath = path.join(config.mcServerPath, relPath);
                    await fs.rm(fullPath, { recursive: true, force: true });
                    return `已成功删除 ${relPath}。`;
                } catch (e: any) {
                    return `删除失败: ${e.message}`;
                }
            }
        },

        // --- Minecraft 函数工具 ---
        mc_create_function: {
            description: '在数据包中创建一个新的 mcfunction。',
            inputSchema: jsonSchema({
                type: 'object',
                properties: {
                    namespace: { type: 'string', description: '命名空间（推荐使用 ai）。' },
                    name: { type: 'string', description: '函数文件名。' },
                    commands: { type: 'string', description: '多行指令。' }
                },
                required: ['namespace', 'name', 'commands']
            }),
            execute: async ({ namespace, name, commands }: { namespace: string, name: string, commands: string }) => {
                try {
                    const functionPath = path.join(
                        config.mcServerPath,
                        config.worldName,
                        'datapacks',
                        'agent_pack',
                        'data',
                        namespace,
                        'functions',
                        `${name}.mcfunction`
                    );

                    const datapackRoot = path.join(config.mcServerPath, config.worldName, 'datapacks', 'agent_pack');
                    await fs.mkdir(path.dirname(functionPath), { recursive: true });
                    
                    const mcmetaPath = path.join(datapackRoot, 'pack.mcmeta');
                    try {
                        await fs.access(mcmetaPath);
                    } catch {
                        const mcmeta = {
                            pack: { pack_format: 10, description: "AI Agent generated tasks" }
                        };
                        await fs.writeFile(mcmetaPath, JSON.stringify(mcmeta, null, 2));
                    }

                    await fs.writeFile(functionPath, commands, 'utf8');
                    await rcon.executeCommand('reload');
                    return `函数 ${namespace}:${name} 已就绪。`;
                } catch (e: any) {
                    return `创建失败: ${e.message}`;
                }
            }
        },
        mc_run_function: {
            description: '执行一个已加载的 mcfunction。',
            inputSchema: jsonSchema({
                type: 'object',
                properties: {
                    functionName: { type: 'string', description: '函数名（如 ai:task1）。' }
                },
                required: ['functionName']
            }),
            execute: async ({ functionName }: { functionName: string }) => {
                try {
                    const result = await rcon.executeCommand(`function ${functionName}`);
                    return `函数已运行。反馈: ${result}`;
                } catch (e: any) {
                    return `执行失败: ${e.message}`;
                }
            }
        }
    };
}
