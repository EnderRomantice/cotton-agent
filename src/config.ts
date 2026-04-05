import dotenv from 'dotenv';
dotenv.config();

export const config = {
  rcon: {
    host: process.env.RCON_HOST || '127.0.0.1',
    port: parseInt(process.env.RCON_PORT || '25575', 10),
    password: process.env.RCON_PASSWORD || '',
  },
  mcLogPath: process.env.MC_LOG_PATH || '',
  llm: {
    provider: process.env.MODEL_PROVIDER || 'openai',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    qwenApiKey: process.env.QWEN_API_KEY || '',
  }
};
