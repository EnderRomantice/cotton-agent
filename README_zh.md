<img width="2816" height="1536" alt="Cotton Agent" src="https://github.com/user-attachments/assets/ca8a2ad6-a2f1-4ed9-ba72-ed36a441bf8d" />

[English Version](README.md)

# Cotton Agent

Cotton Agent 是一个基于 **Node.js + TypeScript + Vercel AI SDK** 开发的独立智能守护程序。它通过读取日志和 RCON 协议与服务器建立链接，充当自动化运维 AI 或拟人化 NPC 管理员，且完全不侵入服务器进程。


## ✨ 核心特性

*   **旁路挂载**: 独立运行；服务器或 Agent 崩溃互不影响。
*   **自适应指令词典**: 启动时自动获取有效的服务器指令，防止幻觉发生。
*   **心智缓冲循环 (Agent Loop)**:
    *   **总结归档**: 将常规日志压缩为简洁的情境记忆以节省 Token。
    *   **优先级中断**: 针对玩家提及 (`@agent`) 或严重的服务器错误立即触发高推理响应。
*   **玩家记忆系统 [NEW]**: 为每位玩家提供基于 Markdown 的独立档案，追踪偏好和交互历史。
*   **等级晋升机制 [NEW]**: 基于行为和贡献的 AI 驱动玩家等级晋升（从 C 到 A，最高等级 A 受限）。


## 🏗️ 系统架构

Agent 作为**完全解耦的服务**运行:

1.  **Log Tailer**: 实时监控 `latest.log`。
2.  **Agent Loop**: 状态管理的逻辑核心。
3.  **Tool System**: 动态注入 RCON 指令和文件操作。
4.  **Player Manager**: 玩家档案和记忆的持久化存储。


## 🚀 快速开始

### 1. 环境准备
确保 `server.properties` 中已启用 RCON：
```properties
enable-rcon=true
rcon.port=25575
rcon.password=your_secure_password
```

### 2. 安装
```bash
git clone https://github.com/EnderRomantice/cotton-agent.git
cd cotton-agent
pnpm install
```

### 3. 配置
复制 `.env.example` 为 `.env` 并填写相关信息：
```env
RCON_HOST=127.0.0.1
RCON_PORT=25575
RCON_PASSWORD=your_password
MC_LOG_PATH=/path/to/latest.log
OPENAI_API_KEY=sk-...
```

### 4. 启动
```bash
pnpm start
```


## 🛠️ 二次开发

*   **性格模组**: 修改 `src/prompts/SOUL.md`。
*   **能力扩展**: 在 `src/core/tools.ts` 中添加新的 Vercel tools。
*   **触发规则**: 在 `src/core/agentLoop.ts` 中调整中断逻辑。
*   **技能插件**: 在 `src/skills/` 中添加 `.md` 指令来扩展 AI 知识库。


## 📜 许可证
MIT
