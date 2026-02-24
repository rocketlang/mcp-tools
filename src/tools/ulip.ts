/**
 * ULIP Tool - Unified Logistics Interface Platform
 * India's government logistics portal
 * 
 * APIs available:
 * - Vehicle tracking
 * - E-way bill verification
 * - Fastag data
 * - VAHAN vehicle info
 * 
 * Docs: https://ulip.gov.in
 */

import axios from 'axios';
import type { MCPTool, MCPParameter, MCPResult } from '../types';

export class ULIPTool implements MCPTool {
  name = 'ulip';
  description = 'Access India Unified Logistics Interface Platform - vehicle tracking, e-way bills, Fastag data';
  
  private apiKey: string;
  private baseUrl = 'https://api.ulip.gov.in/v1';

  parameters: MCPParameter[] = [
    { name: 'action', type: 'string', description: 'Action: vehicle_info, eway_bill, fastag_txn', required: true },
    { name: 'vehicle_number', type: 'string', description: 'Vehicle registration number', required: false },
    { name: 'eway_bill_number', type: 'string', description: 'E-way bill number', required: false },
  ];

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ULIP_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('[ULIPTool] No API key! Register at https://ulip.gov.in');
    }
  }

  async execute(params: Record<string, any>): Promise<MCPResult> {
    const startTime = Date.now();
    
    try {
      let data;
      
      switch (params.action) {
        case 'vehicle_info':
          data = await this.getVehicleInfo(params.vehicle_number);
          break;
        case 'eway_bill':
          data = await this.verifyEwayBill(params.eway_bill_number);
          break;
        case 'fastag_txn':
          data = await this.getFastagTransactions(params.vehicle_number);
          break;
        default:
          throw new Error(`Unknown action: ${params.action}`);
      }

      return {
        success: true,
        data,
        metadata: {
          tool: 'ulip',
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          tool: 'ulip',
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async getVehicleInfo(vehicleNumber: string): Promise<any> {
    // ULIP VAHAN integration
    // Returns: owner, registration date, insurance, fitness, etc.
    
    if (!this.apiKey) {
      // Return mock data for demo
      return {
        vehicle_number: vehicleNumber,
        owner_name: 'Demo Owner',
        registration_date: '2020-01-15',
        insurance_valid_till: '2025-06-30',
        fitness_valid_till: '2025-12-31',
        vehicle_class: 'Transport',
        fuel_type: 'Diesel',
        _mock: true,
      };
    }

    const response = await axios.get(`${this.baseUrl}/vahan/vehicle/${vehicleNumber}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
    return response.data;
  }

  async verifyEwayBill(ewayBillNumber: string): Promise<any> {
    // E-way bill verification
    
    if (!this.apiKey) {
      return {
        eway_bill_number: ewayBillNumber,
        status: 'Active',
        valid_till: '2025-01-15T23:59:59',
        from: 'Delhi',
        to: 'Mumbai',
        transporter: 'WowTruck Logistics',
        _mock: true,
      };
    }

    const response = await axios.get(`${this.baseUrl}/eway/${ewayBillNumber}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
    return response.data;
  }

  async getFastagTransactions(vehicleNumber: string): Promise<any> {
    // Fastag toll transactions
    
    if (!this.apiKey) {
      return {
        vehicle_number: vehicleNumber,
        transactions: [
          { toll: 'Delhi-Gurgaon', amount: 45, timestamp: '2025-01-10T08:30:00' },
          { toll: 'Gurgaon-Jaipur', amount: 120, timestamp: '2025-01-10T10:15:00' },
        ],
        _mock: true,
      };
    }

    const response = await axios.get(`${this.baseUrl}/fastag/txn/${vehicleNumber}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
    return response.data;
  }
}

export function createULIPTool(apiKey?: string): ULIPTool {
  return new ULIPTool(apiKey);
}
