/**
 * MCP Types - Tool definitions for LLM consumption
 */

export interface MCPTool {
  name: string;
  description: string;
  parameters: MCPParameter[];
  execute: (params: Record<string, any>) => Promise<MCPResult>;
}

export interface MCPParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
}

export interface MCPResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    tool: string;
    duration_ms: number;
    cost?: number;
  };
}

export interface MCPMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: MCPToolCall[];
  tool_results?: MCPResult[];
}

export interface MCPToolCall {
  id: string;
  tool: string;
  parameters: Record<string, any>;
}

// Messaging types
export interface MessagePayload {
  to: string;
  text: string;
  buttons?: MessageButton[];
  image?: string;
  document?: string;
}

export interface MessageButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface MessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}
