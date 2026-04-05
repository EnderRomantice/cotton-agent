import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { config } from '../config.js';

export function getProviderModel(intent: 'fast' | 'smart') {
    const providerContext = config.llm.provider.toLowerCase();
    
    // DeepSeek 模型对接 (兼容 OpenAI 格式)
    if (providerContext === 'deepseek') {
        const deepseekProvider = createOpenAI({
            baseURL: 'https://api.deepseek.com',
            apiKey: config.llm.deepseekApiKey || 'mock-key',
        });
        return deepseekProvider(intent === 'smart' ? 'deepseek-chat' : 'deepseek-chat');
    }
    
    // 阿里千问 Qwen (兼容 OpenAI 格式)
    if (providerContext === 'qwen') {
        const qwenProvider = createOpenAI({
            baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            apiKey: config.llm.qwenApiKey || 'mock-key',
        });
        return qwenProvider(intent === 'smart' ? 'qwen-max' : 'qwen-turbo');
    }
    
    // Google Gemini (原生协议)
    if (providerContext === 'gemini') {
        const googleProvider = createGoogleGenerativeAI({
            apiKey: config.llm.geminiApiKey || 'mock-key',
        });
        return googleProvider(intent === 'smart' ? 'gemini-1.5-pro-latest' : 'gemini-1.5-flash-latest');
    }
    
    // 降级 / 默认回落至 OpenAI
    const openaiProvider = createOpenAI({
        apiKey: config.llm.openaiApiKey || 'mock-key',
    });
    return openaiProvider(intent === 'smart' ? 'gpt-4o' : 'gpt-4o-mini');
}
