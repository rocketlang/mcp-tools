/**
 * WhatsApp Business Tool
 * 
 * SETUP (2-7 days):
 * 1. Create Meta Business account
 * 2. Verify business
 * 3. Set up WhatsApp Business API
 * 4. Get phone number ID and access token
 * 
 * Cost: ~₹0.50-1.50 per conversation
 * 
 * Alternatives (easier setup):
 * - Gupshup: gupshup.io
 * - Wati: wati.io  
 * - AiSensy: aisensy.com
 */

import axios from 'axios';
import type { MCPTool, MCPParameter, MCPResult, MessagePayload, MessageResponse } from '../types';

export class WhatsAppTool implements MCPTool {
  name = 'whatsapp';
  description = 'Send messages via WhatsApp Business API. Reaches 500M+ users in India.';
  
  private accessToken: string;
  private phoneNumberId: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  parameters: MCPParameter[] = [
    { name: 'to', type: 'string', description: 'Phone number with country code (e.g., 919876543210)', required: true },
    { name: 'text', type: 'string', description: 'Message text', required: true },
    { name: 'template', type: 'string', description: 'Template name (for first message)', required: false },
  ];

  constructor(config?: { accessToken?: string; phoneNumberId?: string }) {
    this.accessToken = config?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = config?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    
    if (!this.accessToken || !this.phoneNumberId) {
      console.warn('[WhatsAppTool] Missing config! Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID');
      console.warn('[WhatsAppTool] Or use BSP like Gupshup/Wati for easier setup');
    }
  }

  async execute(params: Record<string, any>): Promise<MCPResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.sendMessage({
        to: params.to,
        text: params.text,
      });

      return {
        success: result.success,
        data: result,
        metadata: {
          tool: 'whatsapp',
          duration_ms: Date.now() - startTime,
          cost: 0.01, // ~₹0.50-1.50 per conversation
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          tool: 'whatsapp',
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async sendMessage(payload: MessagePayload): Promise<MessageResponse> {
    if (!this.accessToken || !this.phoneNumberId) {
      return { 
        success: false, 
        error: 'WhatsApp not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID', 
        timestamp: new Date() 
      };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: payload.to,
          type: 'text',
          text: { body: payload.text },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        timestamp: new Date(),
      };
    }
  }

  async sendTemplate(to: string, templateName: string, params?: string[]): Promise<MessageResponse> {
    try {
      const components = params ? [{
        type: 'body',
        parameters: params.map(p => ({ type: 'text', text: p })),
      }] : [];

      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        timestamp: new Date(),
      };
    }
  }
}

// Factory function
export function createWhatsAppTool(config?: { accessToken?: string; phoneNumberId?: string }): WhatsAppTool {
  return new WhatsAppTool(config);
}
