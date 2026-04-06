[中文版](README_zh.md)

# Cotton Agent: AI-Powered Minecraft Server Administrator

Cotton Agent is an independent intelligent daemon based on **Node.js + TypeScript + Vercel AI SDK**. It acts as an automated O&M AI or a humanoid NPC administrator by interfacing with server logs and RCON, without intruding into the server process lifecycle.

---

## ✨ Core Features

*   **Decoupled Architecture**: Runs independently; server or agent crashes do not affect each other.
*   **Adaptive Command Dictionary**: Automatically fetches valid server commands upon startup to prevent hallucinations.
*   **Agent Loop**:
    *   **Summarization**: Compresses routine logs into concise situational memory to save tokens.
    *   **Priority Interrupt**: Immediately triggers high-reasoning responses for player mentions (`@agent`) or fatal server errors.
*   **Player Memory [NEW]**: Individual Markdown-based profiles for each player to track preferences and interaction history.
*   **Permission Scaling [NEW]**: AI-driven player upgrades (Level C -> A) based on behavior and contributions (Max level A restricted).

---

## 🏗️ Architecture

The agent operates as a **fully decoupled service**:

1.  **Log Tailer**: Real-time monitoring of `latest.log`.
2.  **Agent Loop**: Core logic engine for state management.
3.  **Tool System**: Dynamic injection of RCON commands and file operations.
4.  **Player Manager**: Persistent storage of player profiles and memory.

---

## 🚀 Getting Started

### 1. Requirements
Ensure RCON is enabled in `server.properties`:
```properties
enable-rcon=true
rcon.port=25575
rcon.password=your_secure_password
```

### 2. Installation
```bash
git clone https://github.com/EnderRomantice/cotton-agent.git
cd cotton-agent
pnpm install
```

### 3. Configuration
Copy `.env.example` to `.env` and fill in your credentials:
```env
RCON_HOST=127.0.0.1
RCON_PORT=25575
RCON_PASSWORD=your_password
MC_LOG_PATH=/path/to/latest.log
OPENAI_API_KEY=sk-...
```

### 4. Run
```bash
pnpm start
```

---

## 🛠️ Development

*   **Personality**: Modify `src/prompts/SOUL.md`.
*   **Capabilities**: Add new Vercel tools in `src/core/tools.ts`.
*   **Trigger Rules**: Adjust interrupt logic in `src/core/agentLoop.ts`.
*   **Skills**: Add `.md` instructions to `src/skills/` to expand AI knowledge.

---

## 📜 License
MIT
