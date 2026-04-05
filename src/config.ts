import dotenv from 'dotenv';
dotenv.config();

export const config = {
  rcon: {
    host: process.env.RCON_HOST || '127.0.0.1',
    port: parseInt(process.env.RCON_PORT || '25575', 10),
    password: process.env.RCON_PASSWORD || '',
  },
  mcLogPath: process.env.MC_LOG_PATH || '',
  mcServerPath: process.env.MC_SERVER_PATH || '.', // Minecraft 服务器根目录
  worldName: process.env.WORLD_NAME || 'world', // 服务器世界名称
  llm: {
    provider: process.env.MODEL_PROVIDER || 'openai',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    qwenApiKey: process.env.QWEN_API_KEY || '',
  }
};
