/**
 * UPI Tool - Unified Payments Interface
 * 
 * Note: UPI requires integration with payment gateway
 * Options: Razorpay, PayU, Cashfree, PhonePe Business
 * 
 * This tool creates payment links / checks status
 */

import axios from 'axios';
import type { MCPTool, MCPParameter, MCPResult } from '../types';

export class UPITool implements MCPTool {
  name = 'upi';
  description = 'Create UPI payment links and check payment status via Razorpay/PayU';
  
  private apiKey: string;
  private apiSecret: string;
  private provider: 'razorpay' | 'payu' | 'cashfree';

  parameters: MCPParameter[] = [
    { name: 'action', type: 'string', description: 'create_link, check_status, refund', required: true },
    { name: 'amount', type: 'number', description: 'Amount in INR', required: false },
    { name: 'description', type: 'string', description: 'Payment description', required: false },
    { name: 'payment_id', type: 'string', description: 'Payment ID for status check', required: false },
  ];

  constructor(config?: { apiKey?: string; apiSecret?: string; provider?: 'razorpay' | 'payu' | 'cashfree' }) {
    this.apiKey = config?.apiKey || process.env.RAZORPAY_KEY_ID || '';
    this.apiSecret = config?.apiSecret || process.env.RAZORPAY_KEY_SECRET || '';
    this.provider = config?.provider || 'razorpay';
  }

  async execute(params: Record<string, any>): Promise<MCPResult> {
    const startTime = Date.now();
    
    try {
      let data;
      
      switch (params.action) {
        case 'create_link':
          data = await this.createPaymentLink(params.amount, params.description);
          break;
        case 'check_status':
          data = await this.checkPaymentStatus(params.payment_id);
          break;
        default:
          throw new Error(`Unknown action: ${params.action}`);
      }

      return {
        success: true,
        data,
        metadata: {
          tool: 'upi',
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          tool: 'upi',
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async createPaymentLink(amount: number, description: string): Promise<any> {
    if (!this.apiKey) {
      return {
        payment_link: `upi://pay?pa=demo@upi&pn=WowTruck&am=${amount}&tn=${description}`,
        amount,
        description,
        _mock: true,
      };
    }

    // Razorpay payment link
    const response = await axios.post(
      'https://api.razorpay.com/v1/payment_links',
      {
        amount: amount * 100, // Razorpay uses paise
        currency: 'INR',
        description,
        customer: {
          notify: { sms: true, email: false },
        },
      },
      {
        auth: { username: this.apiKey, password: this.apiSecret },
      }
    );

    return {
      payment_link: response.data.short_url,
      payment_id: response.data.id,
      amount,
    };
  }

  async checkPaymentStatus(paymentId: string): Promise<any> {
    if (!this.apiKey) {
      return {
        payment_id: paymentId,
        status: 'captured',
        amount: 1000,
        _mock: true,
      };
    }

    const response = await axios.get(
      `https://api.razorpay.com/v1/payments/${paymentId}`,
      {
        auth: { username: this.apiKey, password: this.apiSecret },
      }
    );

    return {
      payment_id: response.data.id,
      status: response.data.status,
      amount: response.data.amount / 100,
      method: response.data.method,
    };
  }
}

export function createUPITool(config?: { apiKey?: string; apiSecret?: string }): UPITool {
  return new UPITool(config);
}
