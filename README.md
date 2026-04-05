# Cotton Agent (原 Minecraft AI Agent)

Cotton Agent 是一个基于 **Node.js + TypeScript + Vercel AI SDK** 开发的独立智能守护程序。
系统采用“旁路解耦”架构，不侵入服务器进程的生命周期，而是通过读取 `latest.log` 和 RCON 协议与服务器建立“读取感官”和“执行动作”的双边链接，充当自动化运维 AI 或拟人化 NPC 管理员。

---

## ✨ 核心特性

*   **旁路挂载**: 仅需监听日志即可运行，Agent 挂了不影响玩家，服务器崩溃也不影响 Agent 发出最终判断。
*   **Vercel AI Model**: 原生支持调用最新的 OpenAI GPT-4o 等模型，依靠强大的 **Tool Calling** (行为树调用) 机制驱动控制台干预。
*   **自适应指令词典**: 系统启动第一次连入 RCON，会主动获取该服务器环境所有的合法指令组合（完美适配重魔改端/插件端），约束 Agent 生造无效指令的幻觉。
*   **滑动窗口心智缓冲循环 (Agent Loop)**:
    *   **定量快照浓缩**：为了节流 Token 消耗，会把枯燥的 100 条流水日志（走路、挖矿反馈等）使用低成本模型压缩为短短几句话的局势记忆。
    *   **打断优先队列**：当玩家公屏输入 `@agent` 或是服务器抛出 `FATAL/SEVERE` 等致命错误时，立刻跳离闲谈监控状态，载入“长程记忆+短期细节”给主脑做出即发式的行为响应。

---

## 📦 项目导航与二次开发

如果要调整该 AI 的脾性或者扩充玩法：
*   **修改性格与目标**: 调整 `src/prompts/systemPrompt.ts`。例如，把它设为严格执法的黑帮老大，或者温柔有爱的小精灵。
*   **增加 AI 的能力**: 调整 `src/core/tools.ts`。在此文件增加任何 Vercel `tool` 并在内部书写 RCON 指令。举例：扩展一个 `query_player_money` 工具，大模型在对话时就会先调用这个工具探底玩家钱包。
*   **调整核心大脑循环**: 调整 `src/core/agentLoop.ts` 改变触发打断规则。

---

## 🚀 部署与使用指南

### 1. 铺垫：准备 Minecraft 服务端
请确保您的 Minecraft 服务器已开放 RCON 通信机制。打开服务端的 `server.properties`，调整以下几项：
```properties
enable-rcon=true
rcon.port=25575
rcon.password=你设置的复杂密码
```
修改完成后，重启你的 Minecraft 服务端进程。

### 2. 克隆与配置本项目
将此 AI 项目放置在您的服务器（或具有共享日志文件读写权限的主机）内：

```bash
# 进入目录，拉取依赖
cd cotton-agent
npm install
```

利用样本复制出实际的环境变量参数配置表：
```bash
cp .env.example .env
```

修改 `.env` 内部的变量：
```env
# Minecraft 服务端 RCON 登录凭证配置
RCON_HOST=127.0.0.1
RCON_PORT=25575
RCON_PASSWORD=刚刚您在 properites 设置的密码

# Agent 需要能够读到 Minecraft 服务端的运行日志
MC_LOG_PATH=/path/to/your/server/logs/latest.log

# AI 提供商接口密钥
MODEL_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxxx...
```

### 3. 一键挂载启动
项目采用纯 TypeScript。您无需经过繁杂的 `tsc` 构建产出阶段，直接使用内置安装好的 `tsx` 在开发环境裸服拉起：

```bash
npm run start
# 或直接执行: npx tsx src/index.ts
```

大功告成！您现在可以在游戏内敲下 `Hello @agent，在不在！` 观察它的回复与决策了！
