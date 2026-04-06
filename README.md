# Cotton Agent: AI-Powered Minecraft Server Administrator
# Cotton Agent: 基于 AI 的 Minecraft 服务器管理员

Cotton Agent is an independent intelligent daemon based on **Node.js + TypeScript + Vercel AI SDK**. It acts as an automated O&M AI or a humanoid NPC administrator by interfacing with server logs and RCON, without intruding into the server process lifecycle.

Cotton Agent 是一个基于 **Node.js + TypeScript + Vercel AI SDK** 开发的独立智能守护程序。它通过读取日志和 RCON 协议与服务器建立链接，充当自动化运维 AI 或拟人化 NPC 管理员，且完全不侵入服务器进程。

---

## ✨ Core Features / 核心特性

*   **Decoupled Architecture (旁路挂载)**: Runs independently; server or agent crashes do not affect each other.
*   **Vercel AI SDK**: Native support for GPT-4o and other latest models via powerful **Tool Calling** (Behavior Tree) mechanisms.
*   **Adaptive Command Dictionary (自适应指令词典)**: Automatically fetches valid server commands upon startup to prevent hallucinations.
*   **Agent Loop (心智缓冲循环)**:
    *   **Summarization**: Compresses routine logs into concise situational memory to save tokens.
    *   **Priority Interrupt**: Immediately triggers high-reasoning responses for player mentions (`@agent`) or fatal server errors.
*   **Player Memory (玩家记忆系统) [NEW]**: Individual Markdown-based profiles for each player to track preferences and interaction history.
*   **Permission Scaling (等级晋升机制) [NEW]**: AI-driven player upgrades (Level C -> A) based on behavior and contributions (Max level A restricted).

---

## 🏗️ Architecture / 系统架构

The agent operates as a **fully decoupled service** / Agent 作为**完全解耦的服务**运行:

1.  **Log Tailer**: Real-time monitoring of `latest.log`.
2.  **Agent Loop**: Core logic engine for state management.
3.  **Tool System**: Dynamic injection of RCON commands and file operations.
4.  **Player Manager**: Persistent storage of player profiles and memory.

---

## 🚀 Getting Started / 快速开始

### 1. Requirements / 环境准备
Ensure RCON is enabled in `server.properties`:
确保 `server.properties` 中已启用 RCON：
```properties
enable-rcon=true
rcon.port=25575
rcon.password=your_secure_password
```

### 2. Installation / 安装
```bash
git clone https://github.com/EnderRomantice/cotton-agent.git
cd cotton-agent
pnpm install
```

### 3. Configuration / 配置
Copy `.env.example` to `.env` and fill in your credentials:
复制 `.env.example` 为 `.env` 并填写相关信息：
```env
RCON_HOST=127.0.0.1
RCON_PORT=25575
RCON_PASSWORD=your_password
MC_LOG_PATH=/path/to/latest.log
OPENAI_API_KEY=sk-...
```

### 4. Run / 启动
```bash
pnpm start
```

---

## 🛠️ Development / 二次开发

*   **Personality**: Modify `src/prompts/SOUL.md`.
*   **Capabilities**: Add new Vercel tools in `src/core/tools.ts`.
*   **Trigger Rules**: Adjust interrupt logic in `src/core/agentLoop.ts`.
*   **Skills**: Add `.md` instructions to `src/skills/` to expand AI knowledge.

---

## 📜 License / 许可证
MIT
