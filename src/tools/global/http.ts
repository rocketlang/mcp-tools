/**
 * HTTP Tool - Make API calls
 * 
 * Universal tool for any HTTP API
 * Status: 🟢 READY
 */

import axios from 'axios';
import type { MCPTool, MCPParameter, MCPResult } from '../../types';

export class HTTPTool implements MCPTool {
  name = 'http';
  description = 'Make HTTP requests to any API (GET, POST, PUT, DELETE)';
  
  parameters: MCPParameter[] = [
    { name: 'method', type: 'string', description: 'HTTP method: GET, POST, PUT, DELETE', required: true },
    { name: 'url', type: 'string', description: 'Full URL to call', required: true },
    { name: 'headers', type: 'object', description: 'HTTP headers', required: false },
    { name: 'body', type: 'object', description: 'Request body (for POST/PUT)', required: false },
  ];

  async execute(params: Record<string, any>): Promise<MCPResult> {
    const startTime = Date.now();
    
    try {
      const response = await axios({
        method: params.method,
        url: params.url,
        headers: params.headers,
        data: params.body,
        timeout: 30000,
      });

      return {
        success: true,
        data: {
          status: response.status,
          headers: response.headers,
          data: response.data,
        },
        metadata: {
          tool: 'http',
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        data: error.response?.data,
        metadata: {
          tool: 'http',
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }
}

export function createHTTPTool(): HTTPTool {
  return new HTTPTool();
}
