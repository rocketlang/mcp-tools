/**
 * Telegram Bot Tool
 * 
 * SETUP (5 minutes):
 * 1. Open Telegram, search @BotFather
 * 2. Send /newbot
 * 3. Follow prompts, get token
 * 4. Set TELEGRAM_BOT_TOKEN env var
 * 
 * Cost: FREE (unlimited messages!)
 */

import axios from 'axios';
import type { MCPTool, MCPParameter, MCPResult, MessagePayload, MessageResponse } from '../types';

export class TelegramTool implements MCPTool {
  name = 'telegram';
  description = 'Send messages via Telegram bot. FREE, instant setup, great for alerts and notifications.';
  
  private token: string;
  private baseUrl: string;

  parameters: MCPParameter[] = [
    { name: 'chat_id', type: 'string', description: 'Telegram chat ID or @username', required: true },
    { name: 'text', type: 'string', description: 'Message text (supports Markdown)', required: true },
    { name: 'parse_mode', type: 'string', description: 'Markdown or HTML', required: false, default: 'Markdown' },
    { name: 'buttons', type: 'array', description: 'Inline keyboard buttons', required: false },
  ];

  constructor(token?: string) {
    this.token = token || process.env.TELEGRAM_BOT_TOKEN || '';
    this.baseUrl = `https://api.telegram.org/bot${this.token}`;
    
    if (!this.token) {
      console.warn('[TelegramTool] No token! Set TELEGRAM_BOT_TOKEN env var');
      console.warn('[TelegramTool] Get token from @BotFather on Telegram');
    }
  }

  async execute(params: Record<string, any>): Promise<MCPResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.sendMessage({
        to: params.chat_id,
        text: params.text,
        buttons: params.buttons,
      });

      return {
        success: result.success,
        data: result,
        metadata: {
          tool: 'telegram',
          duration_ms: Date.now() - startTime,
          cost: 0, // FREE!
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          tool: 'telegram',
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async sendMessage(payload: MessagePayload): Promise<MessageResponse> {
    if (!this.token) {
      return { success: false, error: 'No bot token configured', timestamp: new Date() };
    }

    try {
      const body: any = {
        chat_id: payload.to,
        text: payload.text,
        parse_mode: 'Markdown',
      };

      // Add inline keyboard if buttons provided
      if (payload.buttons && payload.buttons.length > 0) {
        body.reply_markup = {
          inline_keyboard: [
            payload.buttons.map(btn => ({
              text: btn.text,
              callback_data: btn.callback_data,
              url: btn.url,
            })),
          ],
        };
      }

      const response = await axios.post(`${this.baseUrl}/sendMessage`, body);

      return {
        success: true,
        messageId: response.data.result.message_id.toString(),
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.description || error.message,
        timestamp: new Date(),
      };
    }
  }

  async sendPhoto(chatId: string, photoUrl: string, caption?: string): Promise<MessageResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/sendPhoto`, {
        chat_id: chatId,
        photo: photoUrl,
        caption,
        parse_mode: 'Markdown',
      });

      return {
        success: true,
        messageId: response.data.result.message_id.toString(),
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.description || error.message,
        timestamp: new Date(),
      };
    }
  }

  async sendDocument(chatId: string, documentUrl: string, caption?: string): Promise<MessageResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/sendDocument`, {
        chat_id: chatId,
        document: documentUrl,
        caption,
        parse_mode: 'Markdown',
      });

      return {
        success: true,
        messageId: response.data.result.message_id.toString(),
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.description || error.message,
        timestamp: new Date(),
      };
    }
  }

  async getUpdates(offset?: number): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/getUpdates`, {
        params: { offset, timeout: 30 },
      });
      return response.data.result || [];
    } catch {
      return [];
    }
  }

  async setWebhook(url: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseUrl}/setWebhook`, { url });
      return response.data.ok;
    } catch {
      return false;
    }
  }

  async getMe(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/getMe`);
      return response.data.result;
    } catch {
      return null;
    }
  }
}

// Factory function
export function createTelegramTool(token?: string): TelegramTool {
  return new TelegramTool(token);
}
