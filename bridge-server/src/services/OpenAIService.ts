import OpenAI from 'openai';
import logger from '../utils/logger';

export interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface FunctionCall {
  name: string;
  arguments: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: FunctionCall;
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export class OpenAIService {
  private client: OpenAI;
  private config: Required<OpenAIConfig>;

  constructor(config: OpenAIConfig) {
    this.config = {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 4000,
      baseURL: 'https://api.openai.com/v1',
      ...config
    };

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL
    });

    logger.info('OpenAI服务初始化完成', { model: this.config.model });
  }

  /**
   * 发送聊天请求
   */
  async chat(
    messages: ChatMessage[],
    functions?: FunctionDefinition[],
    stream = false
  ): Promise<OpenAI.Chat.Completions.ChatCompletion | AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    try {
      const params: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
        model: this.config.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          ...(msg.name && { name: msg.name }),
          ...(msg.function_call && { function_call: msg.function_call })
        })),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream
      };

      if (functions && functions.length > 0) {
        params.functions = functions;
        params.function_call = 'auto';
      }

      const response = await this.client.chat.completions.create(params);

      if (stream) {
        return response as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
      }

      logger.info('OpenAI聊天请求完成', {
        model: this.config.model,
        usage: (response as OpenAI.Chat.Completions.ChatCompletion).usage
      });

      return response as OpenAI.Chat.Completions.ChatCompletion;
    } catch (error: any) {
      logger.error('OpenAI聊天请求失败', error);
      throw new Error(`OpenAI API错误: ${error.message}`);
    }
  }

  /**
   * 流式聊天
   */
  async *streamChat(
    messages: ChatMessage[],
    functions?: FunctionDefinition[]
  ): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await this.chat(messages, functions, true) as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          yield delta.content;
        }
      }
    } catch (error: any) {
      logger.error('OpenAI流式聊天失败', error);
      throw error;
    }
  }

  /**
   * 函数调用
   */
  async callFunction(
    messages: ChatMessage[],
    functions: FunctionDefinition[]
  ): Promise<{
    message: string;
    functionCall?: {
      name: string;
      arguments: any;
    };
  }> {
    try {
      const response = await this.chat(messages, functions) as OpenAI.Chat.Completions.ChatCompletion;
      const choice = response.choices[0];

      if (choice.message.function_call) {
        return {
          message: choice.message.content || '',
          functionCall: {
            name: choice.message.function_call.name,
            arguments: JSON.parse(choice.message.function_call.arguments)
          }
        };
      }

      return {
        message: choice.message.content || ''
      };
    } catch (error: any) {
      logger.error('OpenAI函数调用失败', error);
      throw error;
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<OpenAIConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.apiKey || config.baseURL) {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseURL
      });
    }

    logger.info('OpenAI配置已更新', this.config);
  }

  /**
   * 获取当前配置
   */
  getConfig(): Omit<Required<OpenAIConfig>, 'apiKey'> {
    const { apiKey, ...config } = this.config;
    return config;
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.chat([{ role: 'user', content: 'Hello' }]);
      return true;
    } catch (error) {
      logger.error('OpenAI连接测试失败', error);
      return false;
    }
  }
}

export default OpenAIService;