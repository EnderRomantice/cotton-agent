import { createOpenAI } from '@ai-sdk/openai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { config } from '../config.js';

export function getProviderModel(intent: 'fast' | 'smart') {
    const providerContext = config.llm.provider.toLowerCase();
    
    // DeepSeek 模型对接 (改用官方 Native Provider SDK，避免被抓去撞 OpenAI 专属 Schema 规则导致 400)
    if (providerContext === 'deepseek') {
        const dsProvider = createDeepSeek({
            apiKey: config.llm.deepseekApiKey || 'mock-key',
        });
        return dsProvider(intent === 'smart' ? 'deepseek-chat' : 'deepseek-chat');
    }
    
    // 阿里千问 Qwen (兼容 OpenAI 格式)
    if (providerContext === 'qwen') {
        const qwenProvider = createOpenAI({
            baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            apiKey: config.llm.qwenApiKey || 'mock-key',
        });
        return qwenProvider.chat(intent === 'smart' ? 'qwen-max' : 'qwen-turbo');
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
    return openaiProvider.chat(intent === 'smart' ? 'gpt-4o' : 'gpt-4o-mini');
}
