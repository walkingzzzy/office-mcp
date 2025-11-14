import { FunctionDefinition } from './OpenAIService';
import { ToolDefinition } from './ClaudeService';
import logger from '../utils/logger';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ConvertedFunction {
  openai: FunctionDefinition;
  claude: ToolDefinition;
  original: MCPTool;
}

export class MCPFunctionConverter {
  private convertedFunctions = new Map<string, ConvertedFunction>();

  /**
   * 转换MCP工具为LLM函数
   */
  convertTool(mcpTool: MCPTool): ConvertedFunction {
    const openaiFunction: FunctionDefinition = {
      name: mcpTool.name,
      description: mcpTool.description,
      parameters: {
        type: 'object',
        properties: mcpTool.inputSchema.properties,
        required: mcpTool.inputSchema.required || []
      }
    };

    const claudeTool: ToolDefinition = {
      name: mcpTool.name,
      description: mcpTool.description,
      input_schema: {
        type: 'object',
        properties: mcpTool.inputSchema.properties,
        required: mcpTool.inputSchema.required || []
      }
    };

    const converted: ConvertedFunction = {
      openai: openaiFunction,
      claude: claudeTool,
      original: mcpTool
    };

    this.convertedFunctions.set(mcpTool.name, converted);
    return converted;
  }

  /**
   * 批量转换MCP工具
   */
  convertTools(mcpTools: MCPTool[]): ConvertedFunction[] {
    const converted = mcpTools.map(tool => this.convertTool(tool));
    logger.info(`转换了${converted.length}个MCP工具为LLM函数`);
    return converted;
  }

  /**
   * 获取OpenAI函数定义
   */
  getOpenAIFunctions(toolNames?: string[]): FunctionDefinition[] {
    const functions = Array.from(this.convertedFunctions.values());

    if (toolNames) {
      return functions
        .filter(f => toolNames.includes(f.openai.name))
        .map(f => f.openai);
    }

    return functions.map(f => f.openai);
  }

  /**
   * 获取Claude工具定义
   */
  getClaudeTools(toolNames?: string[]): ToolDefinition[] {
    const tools = Array.from(this.convertedFunctions.values());

    if (toolNames) {
      return tools
        .filter(t => toolNames.includes(t.claude.name))
        .map(t => t.claude);
    }

    return tools.map(t => t.claude);
  }

  /**
   * 获取转换后的函数
   */
  getConvertedFunction(name: string): ConvertedFunction | undefined {
    return this.convertedFunctions.get(name);
  }

  /**
   * 获取所有转换后的函数
   */
  getAllConvertedFunctions(): ConvertedFunction[] {
    return Array.from(this.convertedFunctions.values());
  }

  /**
   * 按类别过滤工具
   */
  getToolsByCategory(category: string): ConvertedFunction[] {
    return Array.from(this.convertedFunctions.values())
      .filter(f => f.original.name.startsWith(category));
  }

  /**
   * 搜索工具
   */
  searchTools(query: string): ConvertedFunction[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.convertedFunctions.values())
      .filter(f =>
        f.original.name.toLowerCase().includes(queryLower) ||
        f.original.description.toLowerCase().includes(queryLower)
      );
  }

  /**
   * 验证函数参数
   */
  validateFunctionArgs(functionName: string, args: any): {
    valid: boolean;
    errors: string[];
  } {
    const converted = this.convertedFunctions.get(functionName);
    if (!converted) {
      return { valid: false, errors: [`函数 ${functionName} 不存在`] };
    }

    const schema = converted.original.inputSchema;
    const errors: string[] = [];

    // 检查必需参数
    if (schema.required) {
      for (const required of schema.required) {
        if (!(required in args)) {
          errors.push(`缺少必需参数: ${required}`);
        }
      }
    }

    // 检查参数类型
    for (const [key, value] of Object.entries(args)) {
      const propSchema = schema.properties[key];
      if (!propSchema) {
        errors.push(`未知参数: ${key}`);
        continue;
      }

      if (!this.validateType(value, propSchema)) {
        errors.push(`参数 ${key} 类型错误，期望: ${propSchema.type}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * 验证参数类型
   */
  private validateType(value: any, schema: any): boolean {
    switch (schema.type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalFunctions: number;
    categories: Record<string, number>;
  } {
    const functions = Array.from(this.convertedFunctions.values());
    const categories: Record<string, number> = {};

    for (const func of functions) {
      const category = func.original.name.split('_')[0];
      categories[category] = (categories[category] || 0) + 1;
    }

    return {
      totalFunctions: functions.length,
      categories
    };
  }

  /**
   * 清空转换缓存
   */
  clear(): void {
    this.convertedFunctions.clear();
    logger.info('已清空MCP函数转换缓存');
  }
}

export default MCPFunctionConverter;