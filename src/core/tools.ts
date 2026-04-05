import fs from 'fs/promises';
import path from 'path';
import { jsonSchema, type Tool } from 'ai';
import { RconService } from './rconClient.js';
import { AGENT_NAME } from '../prompts/systemPrompt.js';
import { config } from '../config.js';
import { permissionManager } from './permissionManager.js';
import { PermissionLevel, PERMISSION_DEFINITIONS } from './permissions.js';

export function createAgentTools(rcon: RconService): Record<string, Tool<any, any>> {
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

        // --- RCON 指令 ---
        execute_rcon_command: {
            description: '最高权限后门。允许你在 Minecraft 服务器执行任何原生的控制台指令。',
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
                    const parsedMsg = JSON.stringify({ text: `[${AGENT_NAME}] ${message}`, color: "yellow" });
                    const result = await rcon.executeCommand(`tellraw @a ${parsedMsg}`);
                    return `广播成功发送。反馈: ${result}`;
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
                    playerName: { type: 'string', description: '玩家的精准游戏名。' },
                    message: { type: 'string', description: '私密消息的内容。' }
                },
                required: ['playerName', 'message']
            }),
            execute: async ({ playerName, message }: { playerName: string, message: string }) => {
                try {
                    const result = await rcon.executeCommand(`tell ${playerName} [${AGENT_NAME}] ${message}`);
                    return `私密消息已发送给 ${playerName}。反馈: ${result}`;
                } catch (e: any) {
                    return `发信失败 Error: ${e.message}`;
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
                    return `文件 ${relPath} 已成功写入喵~`;
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
                    return `已清理 ${relPath}，哼，碍眼的东西终于消失了！`;
                } catch (e: any) {
                    return `删除失败: ${e.message}`;
                }
            }
        },

        // --- Minecraft 函数工具 ---
        mc_create_function: {
            description: '在数据包中创建一个新的 mcfunction。会自动处理数据包路径并触发 /reload。',
            inputSchema: jsonSchema({
                type: 'object',
                properties: {
                    namespace: { type: 'string', description: '命名空间（推荐使用 ai）。' },
                    name: { type: 'string', description: '函数文件名（不含 .mcfunction）。' },
                    commands: { type: 'string', description: '多行指令，每行一个。' }
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

                    // 确保 agent_pack 基础结构存在 (mcmeta 等)
                    const datapackRoot = path.join(config.mcServerPath, config.worldName, 'datapacks', 'agent_pack');
                    await fs.mkdir(path.dirname(functionPath), { recursive: true });
                    
                    const mcmetaPath = path.join(datapackRoot, 'pack.mcmeta');
                    try {
                        await fs.access(mcmetaPath);
                    } catch {
                        const mcmeta = {
                            pack: {
                                pack_format: 10,
                                description: "AI Agent generated tasks"
                            }
                        };
                        await fs.writeFile(mcmetaPath, JSON.stringify(mcmeta, null, 2));
                    }

                    await fs.writeFile(functionPath, commands, 'utf8');
                    await rcon.executeCommand('reload');
                    return `函数 ${namespace}:${name} 已创建并加载。你可以通过 run_function 运行它了喵！`;
                } catch (e: any) {
                    return `创建函数失败: ${e.message}`;
                }
            }
        },
        mc_run_function: {
            description: '执行一个已加载的 mcfunction。',
            inputSchema: jsonSchema({
                type: 'object',
                properties: {
                    functionName: { type: 'string', description: '带命名空间的函数名（如 ai:hell_for_u）。' }
                },
                required: ['functionName']
            }),
            execute: async ({ functionName }: { functionName: string }) => {
                try {
                    const result = await rcon.executeCommand(`function ${functionName}`);
                    return `函数执行完毕。反馈: ${result}`;
                } catch (e: any) {
                    return `执行函数失败: ${e.message}`;
                }
            }
        }
    };
}
