import { config } from './config.js';
import { RconService } from './core/rconClient.js';
import { AgentLoop } from './core/agentLoop.js';
import { LogTailer } from './core/logTailer.js';
import { permissionManager } from './core/permissionManager.js';
import { AGENT_NAME } from './prompts/systemPrompt.js';

async function bootstrap() {
    console.log('='?.repeat(40));
    console.log(`🤖 Minecraft AI Agent [${AGENT_NAME}] 开始启动...`);
    console.log('='?.repeat(40));

    // 1. 初始化 RCON 客户端
    const rconService = new RconService();
    await rconService.connect();

    // 2. 发送加入游戏消息 (模拟官方提示)
    const joinMsg = JSON.stringify([
        { text: AGENT_NAME, color: "yellow" },
        { text: " 加入了游戏", color: "yellow" }
    ]);
    await rconService.executeCommand(`tellraw @a ${joinMsg}`);

    // 3. 初始化权限管理器并加载权限
    await permissionManager.loadPermissions();

    // 4. 初始化核心逻辑状态机
    const agentLoop = new AgentLoop(rconService);

    // 5. 初始化并启动日志侦听模块
    const logTailer = new LogTailer(config.mcLogPath, agentLoop);
    logTailer.start();
    
    console.log(`✅ [System] 所有系统加载完毕。当前配置模式：旁路监听`);
}

bootstrap().catch(err => {
    console.error('💥 致命错误，Agent无法启动: ', err);
    process.exit(1);
});
