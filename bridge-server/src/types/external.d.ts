// 外部依赖类型声明

declare module 'openai' {
  export default class OpenAI {
    constructor(config: { apiKey: string; baseURL?: string });
    chat: {
      completions: {
        create(params: any): Promise<any>;
      };
    };
  }

  export namespace OpenAI {
    export namespace Chat {
      export namespace Completions {
        export interface ChatCompletion {
          choices: Array<{
            message: {
              content: string;
              function_call?: {
                name: string;
                arguments: string;
              };
            };
          }>;
          usage?: any;
        }

        export interface ChatCompletionChunk {
          choices: Array<{
            delta: {
              content?: string;
            };
          }>;
        }

        export interface ChatCompletionCreateParams {
          model: string;
          messages: any[];
          temperature?: number;
          max_tokens?: number;
          stream?: boolean;
          functions?: any[];
          function_call?: string;
        }
      }
    }
  }
}

declare module '@anthropic-ai/sdk' {
  export default class Anthropic {
    constructor(config: { apiKey: string; baseURL?: string });
    messages: {
      create(params: any): Promise<any>;
    };
  }

  export namespace Anthropic {
    export namespace Messages {
      export interface Message {
        content: Array<{
          type: string;
          text?: string;
          id?: string;
          name?: string;
          input?: any;
        }>;
        usage?: any;
      }

      export interface MessageStreamEvent {
        type: string;
        delta?: {
          type: string;
          text?: string;
        };
      }

      export interface MessageCreateParams {
        model: string;
        messages: any[];
        max_tokens: number;
        temperature?: number;
        stream?: boolean;
        tools?: any[];
      }
    }
  }
}