# Cotton Agent: AI-Powered Minecraft Server Administrator

Cotton is an intelligent, autonomous AI Agent designed to monitor, interact with, and manage a Minecraft server. It uses LLMs to understand player actions, respond to events, and execute administrative commands through RCON.

## 🏗️ Architecture Overview

The agent operates as a **fully decoupled service**. It does not require modifications to the Minecraft server core or plugins; instead, it interfaces via external protocols.

- **Log Tailer**: Real-time monitoring of server logs.
- **Agent Loop**: Core logic engine for state management and triggers.
- **AI Provider**: Multi-LLM abstraction layer (Vercel AI SDK).
- **Rcon Client**: Execution layer via the standard RCON protocol.

---

## 🧠 Core Reasoning Strategy

Cotton uses a **Dual-Model Logic** to optimize for both cost and intelligence.

### 1. Sliding Window Summarization (Fast)
A lightweight model handles routine log summarization (default: 100-line buffer) to maintain long-term context without high costs.

### 2. Immediate Action Triggers (Smart)
A high-reasoning model is invoked for critical events (mentions, errors, deaths) with full tool access and historical context.

---

## 🛠️ Tool System

Integrates with the **Vercel AI SDK** to dynamically inject server commands into the AI's reasoning loop, allowing it to act as an autonomous Game Master.

---

## ⚙️ Configuration & Providers

Cotton supports any LLM provider compatible with the Vercel AI SDK (OpenAI, DeepSeek, Gemini, Qwen, etc.). 

- **Environment-Based**: All provider settings and API keys are managed via `.env`.
- **Flexible Intent**: Models are categorized by `smart` (reasoning) and `fast` (summarization) intents, allowing easy swapping of backend providers without code changes.

---

## 📜 Behavior Rules

1. **Safety First**: Destructive commands are restricted.
2. **Context-Aware**: Uses both historical snapshots and live logs.
3. **Decoupled Interaction**: Functions independently of server internals.
