import { createOpenAI } from '@ai-sdk/openai';
import { config } from '../config.js';

export const aiProvider = createOpenAI({
  apiKey: config.llm.openaiApiKey || 'mock-key-please-change-in-env',
});
