import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger';

export interface ClaudeConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'tool_use' | 'tool_result';
    text?: string;
    id?: string;
    name?: string;
    input?: any;
    content?: any;
  }>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export class ClaudeService {
  private client: Anthropic;
  private config: Required<ClaudeConfig>;

  constructor(config: ClaudeConfig) {
    this.config = {
      model: 'claude-3-sonnet-20240229',
      maxTokens: 4000,
      temperature: 0.7,
      baseURL: 'https://api.anthropic.com',
      ...config
    };

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL
    });

    logger.info('Claude服务初始化完成', { model: this.config.model });
  }

  /**
   * 发送消息
   */
  async sendMessage(
    messages: ClaudeMessage[],
    tools?: ToolDefinition[],
    stream = false
  ): Promise<Anthropic.Messages.Message | AsyncIterable<Anthropic.Messages.MessageStreamEvent>> {
    try {
      const params: Anthropic.Messages.MessageCreateParams = {
        model: this.config.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream
      };

      if (tools && tools.length > 0) {
        params.tools = tools;
      }

      const response = await this.client.messages.create(params);

      if (stream) {
        return response as AsyncIterable<Anthropic.Messages.MessageStreamEvent>;
      }

      logger.info('Claude消息请求完成', {
        model: this.config.model,
        usage: (response as Anthropic.Messages.Message).usage
      });

      return response as Anthropic.Messages.Message;
    } catch (error: any) {
      logger.error('Claude消息请求失败', error);
      throw new Error(`Claude API错误: ${error.message}`);
    }
  }

  /**
   * 流式消息
   */
  async *streamMessage(
    messages: ClaudeMessage[],
    tools?: ToolDefinition[]
  ): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await this.sendMessage(messages, tools, true) as AsyncIterable<Anthropic.Messages.MessageStreamEvent>;

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield event.delta.text;
        }
      }
    } catch (error: any) {
      logger.error('Claude流式消息失败', error);
      throw error;
    }
  }

  /**
   * 工具使用
   */
  async useTools(
    messages: ClaudeMessage[],
    tools: ToolDefinition[]
  ): Promise<{
    message: string;
    toolUse?: Array<{
      id: string;
      name: string;
      input: any;
    }>;
  }> {
    try {
      const response = await this.sendMessage(messages, tools) as Anthropic.Messages.Message;

      let message = '';
      const toolUse: Array<{ id: string; name: string; input: any }> = [];

      for (const content of response.content) {
        if (content.type === 'text') {
          message += content.text;
        } else if (content.type === 'tool_use') {
          toolUse.push({
            id: content.id,
            name: content.name,
            input: content.input
          });
        }
      }

      return { message, toolUse: toolUse.length > 0 ? toolUse : undefined };
    } catch (error: any) {
      logger.error('Claude工具使用失败', error);
      throw error;
    }
  }

  /**
   * 添加工具结果
   */
  addToolResult(
    messages: ClaudeMessage[],
    toolCallId: string,
    result: any
  ): ClaudeMessage[] {
    const lastMessage = messages[messages.length - 1];

    if (lastMessage.role === 'assistant' && Array.isArray(lastMessage.content)) {
      // 添加工具结果到用户消息
      const toolResultMessage: ClaudeMessage = {
        role: 'user',
        content: [{
          type: 'tool_result',
          id: toolCallId,
          content: typeof result === 'string' ? result : JSON.stringify(result)
        }]
      };

      return [...messages, toolResultMessage];
    }

    return messages;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ClaudeConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.apiKey || config.baseURL) {
      this.client = new Anthropic({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseURL
      });
    }

    logger.info('Claude配置已更新', this.config);
  }

  /**
   * 获取当前配置
   */
  getConfig(): Omit<Required<ClaudeConfig>, 'apiKey'> {
    const { apiKey, ...config } = this.config;
    return config;
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.sendMessage([{ role: 'user', content: 'Hello' }]);
      return true;
    } catch (error) {
      logger.error('Claude连接测试失败', error);
      return false;
    }
  }
}

export default ClaudeService;