import MCPClient from './MCPClient';
import MCPFunctionConverter from './MCPFunctionConverter';
import logger from '../utils/logger';

export interface ToolExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  toolName: string;
}

export interface ToolExecutionContext {
  conversationId?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export class ToolExecutionEngine {
  private mcpClient: any;
  private converter: MCPFunctionConverter;
  private executionHistory = new Map<string, ToolExecutionResult[]>();

  constructor(mcpClient: any, converter: MCPFunctionConverter) {
    this.mcpClient = mcpClient;
    this.converter = converter;
    logger.info('工具执行引擎初始化完成');
  }

  /**
   * 执行工具
   */
  async executeTool(
    toolName: string,
    args: any,
    context?: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      // 验证工具是否存在
      const convertedFunction = this.converter.getConvertedFunction(toolName);
      if (!convertedFunction) {
        throw new Error(`工具 ${toolName} 不存在`);
      }

      // 验证参数
      const validation = this.converter.validateFunctionArgs(toolName, args);
      if (!validation.valid) {
        throw new Error(`参数验证失败: ${validation.errors.join(', ')}`);
      }

      logger.info('开始执行工具', { toolName, args, context });

      // 执行MCP工具
      const result = await this.mcpClient.callTool(toolName, args);

      const executionTime = Date.now() - startTime;
      const executionResult: ToolExecutionResult = {
        success: true,
        result: result.content,
        executionTime,
        toolName
      };

      // 记录执行历史
      this.recordExecution(context?.conversationId || 'default', executionResult);

      logger.info('工具执行成功', {
        toolName,
        executionTime,
        resultSize: JSON.stringify(result.content).length
      });

      return executionResult;
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const executionResult: ToolExecutionResult = {
        success: false,
        error: error.message,
        executionTime,
        toolName
      };

      // 记录执行历史
      this.recordExecution(context?.conversationId || 'default', executionResult);

      logger.error('工具执行失败', {
        toolName,
        error: error.message,
        executionTime
      });

      return executionResult;
    }
  }

  /**
   * 批量执行工具
   */
  async executeTools(
    toolCalls: Array<{ name: string; args: any }>,
    context?: ToolExecutionContext
  ): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = [];

    for (const toolCall of toolCalls) {
      const result = await this.executeTool(toolCall.name, toolCall.args, context);
      results.push(result);

      // 如果有工具执行失败，可以选择继续或停止
      if (!result.success) {
        logger.warn('工具执行失败，继续执行其他工具', {
          failedTool: toolCall.name,
          error: result.error
        });
      }
    }

    return results;
  }

  /**
   * 并行执行工具
   */
  async executeToolsParallel(
    toolCalls: Array<{ name: string; args: any }>,
    context?: ToolExecutionContext
  ): Promise<ToolExecutionResult[]> {
    const promises = toolCalls.map(toolCall =>
      this.executeTool(toolCall.name, toolCall.args, context)
    );

    return Promise.all(promises);
  }

  /**
   * 获取可用工具列表
   */
  getAvailableTools(): Array<{
    name: string;
    description: string;
    category: string;
  }> {
    return this.converter.getAllConvertedFunctions().map(func => ({
      name: func.original.name,
      description: func.original.description,
      category: func.original.name.split('_')[0]
    }));
  }

  /**
   * 搜索工具
   */
  searchTools(query: string): Array<{
    name: string;
    description: string;
    relevance: number;
  }> {
    const tools = this.converter.searchTools(query);
    return tools.map(tool => ({
      name: tool.original.name,
      description: tool.original.description,
      relevance: this.calculateRelevance(query, tool.original)
    })).sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * 获取工具详情
   */
  getToolDetails(toolName: string): {
    name: string;
    description: string;
    parameters: any;
    examples?: any[];
  } | null {
    const convertedFunction = this.converter.getConvertedFunction(toolName);
    if (!convertedFunction) return null;

    return {
      name: convertedFunction.original.name,
      description: convertedFunction.original.description,
      parameters: convertedFunction.original.inputSchema,
      examples: this.generateExamples(convertedFunction.original)
    };
  }

  /**
   * 获取执行历史
   */
  getExecutionHistory(conversationId: string = 'default'): ToolExecutionResult[] {
    return this.executionHistory.get(conversationId) || [];
  }

  /**
   * 获取执行统计
   */
  getExecutionStats(conversationId?: string): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    mostUsedTools: Array<{ name: string; count: number }>;
  } {
    let allResults: ToolExecutionResult[] = [];

    if (conversationId) {
      allResults = this.executionHistory.get(conversationId) || [];
    } else {
      for (const results of this.executionHistory.values()) {
        allResults.push(...results);
      }
    }

    const totalExecutions = allResults.length;
    const successfulExecutions = allResults.filter(r => r.success).length;
    const failedExecutions = totalExecutions - successfulExecutions;
    const averageExecutionTime = totalExecutions > 0
      ? allResults.reduce((sum, r) => sum + r.executionTime, 0) / totalExecutions
      : 0;

    // 统计最常用的工具
    const toolCounts = new Map<string, number>();
    for (const result of allResults) {
      toolCounts.set(result.toolName, (toolCounts.get(result.toolName) || 0) + 1);
    }

    const mostUsedTools = Array.from(toolCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime: Math.round(averageExecutionTime),
      mostUsedTools
    };
  }

  /**
   * 清理执行历史
   */
  clearExecutionHistory(conversationId?: string): void {
    if (conversationId) {
      this.executionHistory.delete(conversationId);
    } else {
      this.executionHistory.clear();
    }
    logger.info('清理工具执行历史', { conversationId });
  }

  /**
   * 记录执行结果
   */
  private recordExecution(conversationId: string, result: ToolExecutionResult): void {
    if (!this.executionHistory.has(conversationId)) {
      this.executionHistory.set(conversationId, []);
    }

    const history = this.executionHistory.get(conversationId)!;
    history.push(result);

    // 限制历史记录数量
    const maxHistory = 100;
    if (history.length > maxHistory) {
      history.splice(0, history.length - maxHistory);
    }
  }

  /**
   * 计算相关性分数
   */
  private calculateRelevance(query: string, tool: any): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    // 名称匹配
    if (tool.name.toLowerCase().includes(queryLower)) {
      score += 10;
    }

    // 描述匹配
    const descriptionWords = tool.description.toLowerCase().split(' ');
    const queryWords = queryLower.split(' ');

    for (const queryWord of queryWords) {
      for (const descWord of descriptionWords) {
        if (descWord.includes(queryWord)) {
          score += 1;
        }
      }
    }

    return score;
  }

  /**
   * 生成工具使用示例
   */
  private generateExamples(tool: any): any[] {
    const examples: any[] = [];

    // 基于参数schema生成示例
    if (tool.inputSchema && tool.inputSchema.properties) {
      const example: any = {};

      for (const [key, prop] of Object.entries(tool.inputSchema.properties)) {
        const propSchema = prop as any;
        example[key] = this.generateExampleValue(propSchema);
      }

      examples.push({
        description: `基本使用示例`,
        parameters: example
      });
    }

    return examples;
  }

  /**
   * 生成示例值
   */
  private generateExampleValue(schema: any): any {
    switch (schema.type) {
      case 'string':
        return schema.example || 'example_string';
      case 'number':
        return schema.example || 42;
      case 'boolean':
        return schema.example || true;
      case 'array':
        return schema.example || [];
      case 'object':
        return schema.example || {};
      default:
        return null;
    }
  }
}

export default ToolExecutionEngine;