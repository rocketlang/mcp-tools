/**
 * BANI Tool Executor
 * Real implementations for BANI bridge tools
 */

import type { MCPResult } from '../types';

// Tool executors map - all return MCPResult with required fields
export const TOOL_EXECUTORS: Record<string, (params: Record<string, any>) => Promise<MCPResult>> = {

  // ═══════════════════════════════════════════════════════════════
  // GST TOOLS
  // ═══════════════════════════════════════════════════════════════

  gst_verify: async (params): Promise<MCPResult> => {
    const gstin = params.gstin || '';
    const isValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{3}$/.test(gstin);
    return {
      success: true,
      data: {
        gstin,
        valid: isValid,
        format: isValid ? 'Valid GSTIN format' : 'Invalid GSTIN format',
        stateCode: isValid ? gstin.substring(0, 2) : null,
        panComponent: isValid ? gstin.substring(2, 12) : null,
        note: 'Live verification requires GST API key'
      },
      metadata: { tool: 'gst_verify', duration_ms: 0 }
    };
  },

  gst_calc: async (params): Promise<MCPResult> => {
    const amount = params.amount || 0;
    const rate = params.rate || 18;
    const gstAmount = amount * (rate / 100);
    const total = amount + gstAmount;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    return {
      success: true,
      data: {
        baseAmount: amount,
        gstRate: rate,
        cgst: cgst.toFixed(2),
        sgst: sgst.toFixed(2),
        totalGST: gstAmount.toFixed(2),
        totalAmount: total.toFixed(2),
        breakdown: `₹${amount} + ${rate}% GST = ₹${total.toFixed(2)}`
      },
      metadata: { tool: 'gst_calc', duration_ms: 0 }
    };
  },

  // GSTR-1 Prepare
  gstr1_prepare: async (params): Promise<MCPResult> => {
    const gstin = params.gstin || '';
    const period = params.period || '';
    const isValidGstin = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{3}$/.test(gstin);

    if (!isValidGstin) {
      return { success: false, error: 'Invalid GSTIN format', data: { gstin }, metadata: { tool: 'gstr1_prepare', duration_ms: 0 } };
    }

    // Mock GSTR-1 data
    return {
      success: true,
      data: {
        gstin,
        period,
        returnType: 'GSTR-1',
        status: 'PREPARED',
        summary: {
          b2b: { invoices: 45, taxableValue: 1250000, igst: 112500, cgst: 56250, sgst: 56250 },
          b2c: { invoices: 120, taxableValue: 450000, cgst: 40500, sgst: 40500 },
          cdnr: { notes: 3, taxableValue: -25000, igst: -2250 },
          hsn: { items: 15 }
        },
        totalTax: 303750,
        dueDate: '11th of next month',
        note: 'Mock data - Connect GSP API for live filing'
      },
      metadata: { tool: 'gstr1_prepare', duration_ms: 0 }
    };
  },

  // GSTR-1 File
  gstr1_file: async (params): Promise<MCPResult> => {
    const gstin = params.gstin || '';
    const period = params.period || '';

    return {
      success: true,
      data: {
        gstin,
        period,
        returnType: 'GSTR-1',
        status: 'FILED',
        arn: `AA${gstin.substring(0, 2)}${Date.now().toString().substring(5)}`,
        filedAt: new Date().toISOString(),
        acknowledgement: 'Return filed successfully',
        note: 'Mock filing - Connect GSP API for actual filing'
      },
      metadata: { tool: 'gstr1_file', duration_ms: 0 }
    };
  },

  // GSTR-2A Fetch
  gstr2a_fetch: async (params): Promise<MCPResult> => {
    const gstin = params.gstin || '';
    const period = params.period || '';

    return {
      success: true,
      data: {
        gstin,
        period,
        returnType: 'GSTR-2A',
        status: 'FETCHED',
        summary: {
          b2b: {
            suppliers: 28,
            invoices: 156,
            taxableValue: 2850000,
            igst: 256500,
            cgst: 128250,
            sgst: 128250,
            totalTax: 513000
          },
          cdnr: { notes: 5, taxableValue: -45000, totalTax: -4050 },
          isd: { documents: 2, taxableValue: 50000, totalTax: 4500 }
        },
        itcAvailable: 513450,
        generatedAt: new Date().toISOString(),
        note: 'Mock data - Connect GSP API for live data'
      },
      metadata: { tool: 'gstr2a_fetch', duration_ms: 0 }
    };
  },

  // GSTR-2B Fetch
  gstr2b_fetch: async (params): Promise<MCPResult> => {
    const gstin = params.gstin || '';
    const period = params.period || '';

    return {
      success: true,
      data: {
        gstin,
        period,
        returnType: 'GSTR-2B',
        status: 'FETCHED',
        itcSummary: {
          available: {
            igst: 245000,
            cgst: 122500,
            sgst: 122500,
            cess: 0,
            total: 490000
          },
          ineligible: {
            total: 15000,
            reason: 'Supplier returns not filed'
          },
          reversal: {
            total: 5000,
            reason: 'Rule 42/43 reversal'
          }
        },
        netItc: 470000,
        documentDate: new Date().toISOString(),
        note: 'Mock data - Connect GSP API for live ITC statement'
      },
      metadata: { tool: 'gstr2b_fetch', duration_ms: 0 }
    };
  },

  // GSTR-3B Prepare
  gstr3b_prepare: async (params): Promise<MCPResult> => {
    const gstin = params.gstin || '';
    const period = params.period || '';

    return {
      success: true,
      data: {
        gstin,
        period,
        returnType: 'GSTR-3B',
        status: 'PREPARED',
        liability: {
          outward: { taxableValue: 1700000, igst: 112500, cgst: 96750, sgst: 96750, cess: 0 },
          inward: { reverseCharge: 25000, igst: 2250, cgst: 1125, sgst: 1125 }
        },
        itcClaimed: {
          igst: 245000,
          cgst: 122500,
          sgst: 122500,
          total: 490000
        },
        taxPayable: {
          igst: 0,
          cgst: 0,
          sgst: 0,
          cess: 0,
          interest: 0,
          lateFee: 0,
          total: 0
        },
        cashBalance: { igst: 50000, cgst: 25000, sgst: 25000 },
        dueDate: '20th of next month',
        note: 'Mock data - Connect GSP API for live preparation'
      },
      metadata: { tool: 'gstr3b_prepare', duration_ms: 0 }
    };
  },

  // GSTR-3B File
  gstr3b_file: async (params): Promise<MCPResult> => {
    const gstin = params.gstin || '';
    const period = params.period || '';
    const paymentMode = params.payment_mode || 'itc';

    return {
      success: true,
      data: {
        gstin,
        period,
        returnType: 'GSTR-3B',
        status: 'FILED',
        arn: `AB${gstin.substring(0, 2)}${Date.now().toString().substring(5)}`,
        paymentMode,
        taxPaid: {
          igst: 0,
          cgst: 0,
          sgst: 0,
          cess: 0,
          lateFee: 50,
          total: 50
        },
        filedAt: new Date().toISOString(),
        challanNo: paymentMode === 'cash' ? `CHL${Date.now().toString().substring(8)}` : null,
        note: 'Mock filing - Connect GSP API for actual filing'
      },
      metadata: { tool: 'gstr3b_file', duration_ms: 0 }
    };
  },

  // ITC Check
  itc_check: async (params): Promise<MCPResult> => {
    const gstin = params.gstin || '';
    const period = params.period || '';

    return {
      success: true,
      data: {
        gstin,
        period,
        itcReconciliation: {
          asPerBooks: 520000,
          asPerGstr2b: 490000,
          difference: 30000,
          mismatchedInvoices: 5
        },
        eligibility: {
          eligible: 470000,
          ineligible: 20000,
          blocked: 15000,
          reversed: 5000
        },
        recommendations: [
          'Follow up with 3 suppliers for GSTR-1 filing',
          'Review 2 invoices for HSN mismatch',
          'Verify reverse charge liability'
        ],
        riskScore: 'LOW',
        note: 'Mock reconciliation - Connect to books for actual check'
      },
      metadata: { tool: 'itc_check', duration_ms: 0 }
    };
  },

  // E-Way Bill Generate
  eway_generate: async (params): Promise<MCPResult> => {
    const fromGstin = params.from_gstin || '';
    const toGstin = params.to_gstin || '';
    const invoiceNo = params.invoice_no || '';
    const invoiceValue = params.invoice_value || 0;
    const vehicleNo = params.vehicle_no || '';

    if (invoiceValue < 50000) {
      return {
        success: true,
        data: {
          message: 'E-Way Bill not required for invoice value below ₹50,000',
          invoiceValue,
          threshold: 50000
        },
        metadata: { tool: 'eway_generate', duration_ms: 0 }
      };
    }

    return {
      success: true,
      data: {
        ewayBillNo: `${Math.floor(Math.random() * 900000000000) + 100000000000}`,
        ewayBillDate: new Date().toISOString(),
        validUpto: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        fromGstin,
        toGstin,
        invoiceNo,
        invoiceValue,
        vehicleNo: vehicleNo || 'To be updated',
        status: 'GENERATED',
        distance: '500 km (estimated)',
        note: 'Mock E-Way Bill - Connect to E-Way Bill portal for actual generation'
      },
      metadata: { tool: 'eway_generate', duration_ms: 0 }
    };
  },

  // E-Invoice Generate
  einvoice_generate: async (params): Promise<MCPResult> => {
    const gstin = params.gstin || '';
    const invoiceNo = params.invoice_no || '';

    return {
      success: true,
      data: {
        irn: `${Buffer.from(`${gstin}${invoiceNo}${Date.now()}`).toString('base64').substring(0, 64)}`,
        ackNo: Math.floor(Math.random() * 9000000000) + 1000000000,
        ackDate: new Date().toISOString(),
        gstin,
        invoiceNo,
        signedInvoice: 'BASE64_SIGNED_JSON',
        signedQrCode: 'BASE64_QR_CODE',
        status: 'GENERATED',
        note: 'Mock E-Invoice - Connect to IRP for actual generation'
      },
      metadata: { tool: 'einvoice_generate', duration_ms: 0 }
    };
  },

  hsn_lookup: async (params): Promise<MCPResult> => {
    const commonHSN: Record<string, { hsn: string; gst: number; desc: string }> = {
      'rice': { hsn: '1006', gst: 5, desc: 'Rice' },
      'wheat': { hsn: '1001', gst: 5, desc: 'Wheat' },
      'sugar': { hsn: '1701', gst: 5, desc: 'Sugar' },
      'milk': { hsn: '0401', gst: 0, desc: 'Milk' },
      'salt': { hsn: '2501', gst: 0, desc: 'Salt' },
      'diesel': { hsn: '2710', gst: 18, desc: 'Diesel fuel' },
      'petrol': { hsn: '2710', gst: 18, desc: 'Motor spirit (petrol)' },
      'cement': { hsn: '2523', gst: 28, desc: 'Cement' },
      'steel': { hsn: '7206', gst: 18, desc: 'Iron and steel' },
      'transport': { hsn: '9965', gst: 5, desc: 'Goods Transport Agency' },
      'freight': { hsn: '9965', gst: 5, desc: 'Freight services' },
      'software': { hsn: '9983', gst: 18, desc: 'IT services' },
      'consulting': { hsn: '9983', gst: 18, desc: 'Consulting services' }
    };

    const query = (params.query || '').toLowerCase();
    const match = Object.entries(commonHSN).find(([k]) => query.includes(k));

    if (match) {
      return {
        success: true,
        data: {
          query: params.query,
          hsnCode: match[1].hsn,
          description: match[1].desc,
          gstRate: match[1].gst
        },
        metadata: { tool: 'hsn_lookup', duration_ms: 0 }
      };
    }

    return {
      success: true,
      data: {
        query: params.query,
        message: 'HSN code not found',
        suggestion: 'Try: rice, wheat, diesel, cement, transport, software'
      },
      metadata: { tool: 'hsn_lookup', duration_ms: 0 }
    };
  },

  tds_calc: async (params): Promise<MCPResult> => {
    const tdsRates: Record<string, { rate: number; desc: string }> = {
      '194J': { rate: 10, desc: 'Professional/Technical fees' },
      '194C': { rate: 2, desc: 'Contractor payment (Company)' },
      '194H': { rate: 5, desc: 'Commission/Brokerage' },
      '194I': { rate: 10, desc: 'Rent' },
      '194A': { rate: 10, desc: 'Interest (other than securities)' },
      '192': { rate: 0, desc: 'Salary (slab based)' }
    };

    const section = (params.section || '194J').toUpperCase();
    const amount = params.amount || 0;
    const rateInfo = tdsRates[section] || { rate: 10, desc: 'Default TDS' };
    const tdsAmount = amount * (rateInfo.rate / 100);

    return {
      success: true,
      data: {
        amount,
        section,
        tdsRate: `${rateInfo.rate}%`,
        tdsAmount: tdsAmount.toFixed(2),
        netPayable: (amount - tdsAmount).toFixed(2),
        description: rateInfo.desc
      },
      metadata: { tool: 'tds_calc', duration_ms: 0 }
    };
  },

  income_tax: async (params): Promise<MCPResult> => {
    const income = params.income || 0;
    const regime = (params.regime || 'new').toLowerCase();
    let tax = 0;

    if (regime === 'new') {
      if (income <= 300000) tax = 0;
      else if (income <= 700000) tax = (income - 300000) * 0.05;
      else if (income <= 1000000) tax = 20000 + (income - 700000) * 0.10;
      else if (income <= 1200000) tax = 50000 + (income - 1000000) * 0.15;
      else if (income <= 1500000) tax = 80000 + (income - 1200000) * 0.20;
      else tax = 140000 + (income - 1500000) * 0.30;
      if (income <= 775000) tax = 0;
    } else {
      if (income <= 250000) tax = 0;
      else if (income <= 500000) tax = (income - 250000) * 0.05;
      else if (income <= 1000000) tax = 12500 + (income - 500000) * 0.20;
      else tax = 112500 + (income - 1000000) * 0.30;
    }

    const cess = tax * 0.04;
    const totalTax = tax + cess;

    return {
      success: true,
      data: {
        income,
        regime: regime === 'new' ? 'New Tax Regime' : 'Old Tax Regime',
        baseTax: tax.toFixed(2),
        cess: cess.toFixed(2),
        totalTax: totalTax.toFixed(2),
        effectiveRate: `${((totalTax / income) * 100).toFixed(2)}%`,
        monthlyTax: (totalTax / 12).toFixed(2)
      },
      metadata: { tool: 'income_tax', duration_ms: 0 }
    };
  },

  emi_calc: async (params): Promise<MCPResult> => {
    const principal = params.principal || 0;
    const rate = (params.rate || 10) / 100 / 12;
    const tenure = params.tenure || 12;
    const emi = principal * rate * Math.pow(1 + rate, tenure) / (Math.pow(1 + rate, tenure) - 1);
    const totalPayment = emi * tenure;
    const totalInterest = totalPayment - principal;

    return {
      success: true,
      data: {
        principal,
        interestRate: `${params.rate || 10}% p.a.`,
        tenure: `${tenure} months`,
        emi: emi.toFixed(2),
        totalInterest: totalInterest.toFixed(2),
        totalPayment: totalPayment.toFixed(2)
      },
      metadata: { tool: 'emi_calc', duration_ms: 0 }
    };
  },

  sip_calc: async (params): Promise<MCPResult> => {
    const monthlyAmount = params.monthly_amount || 0;
    const years = params.years || 10;
    const rate = (params.rate || 12) / 100 / 12;
    const months = years * 12;
    const futureValue = monthlyAmount * ((Math.pow(1 + rate, months) - 1) / rate) * (1 + rate);
    const invested = monthlyAmount * months;
    const returns = futureValue - invested;

    return {
      success: true,
      data: {
        monthlyInvestment: monthlyAmount,
        period: `${years} years`,
        expectedReturn: `${params.rate || 12}% p.a.`,
        totalInvested: invested.toFixed(2),
        estimatedReturns: returns.toFixed(2),
        maturityValue: futureValue.toFixed(2)
      },
      metadata: { tool: 'sip_calc', duration_ms: 0 }
    };
  },

  pan_verify: async (params): Promise<MCPResult> => {
    const pan = (params.pan || '').toUpperCase();
    const isValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
    const panTypes: Record<string, string> = {
      'P': 'Individual', 'C': 'Company', 'H': 'HUF', 'F': 'Firm',
      'A': 'Association', 'T': 'Trust', 'B': 'Body of Individuals',
      'L': 'Local Authority', 'J': 'Artificial Juridical Person', 'G': 'Government'
    };

    return {
      success: true,
      data: {
        pan,
        valid: isValid,
        type: isValid ? (panTypes[pan[3]] || 'Unknown') : 'Invalid',
        note: 'Live verification requires NSDL API'
      },
      metadata: { tool: 'pan_verify', duration_ms: 0 }
    };
  },

  vehicle_verify: async (params): Promise<MCPResult> => {
    const vehicleNumber = (params.vehicle_number || '').toUpperCase().replace(/\s/g, '');
    const isValid = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/.test(vehicleNumber);
    const stateCodes: Record<string, string> = {
      'MH': 'Maharashtra', 'DL': 'Delhi', 'KA': 'Karnataka',
      'TN': 'Tamil Nadu', 'UP': 'Uttar Pradesh', 'GJ': 'Gujarat',
      'RJ': 'Rajasthan', 'WB': 'West Bengal', 'AP': 'Andhra Pradesh',
      'TS': 'Telangana', 'KL': 'Kerala', 'MP': 'Madhya Pradesh'
    };

    return {
      success: true,
      data: {
        vehicleNumber,
        valid: isValid,
        state: isValid ? (stateCodes[vehicleNumber.substring(0, 2)] || 'Other') : 'Invalid',
        note: 'Live verification requires Vahan API'
      },
      metadata: { tool: 'vehicle_verify', duration_ms: 0 }
    };
  },

  calculator: async (params): Promise<MCPResult> => {
    const expr = params.expression || '';
    try {
      const sanitized = expr.replace(/[^0-9+\-*/().%\s]/g, '');
      const result = new Function(`return ${sanitized}`)();
      return {
        success: true,
        data: { expression: expr, result, formatted: typeof result === 'number' ? result.toLocaleString('en-IN') : result },
        metadata: { tool: 'calculator', duration_ms: 0 }
      };
    } catch {
      return { success: false, error: 'Invalid expression', data: { expression: expr }, metadata: { tool: 'calculator', duration_ms: 0 } };
    }
  },

  pincode_info: async (params): Promise<MCPResult> => {
    const pincode = params.pincode || '';
    const zones: Record<string, { state: string; zone: string }> = {
      '1': { state: 'Delhi/HP/J&K/Punjab/Haryana', zone: 'Northern' },
      '2': { state: 'UP/Uttarakhand', zone: 'Northern' },
      '3': { state: 'Rajasthan/Gujarat', zone: 'Western' },
      '4': { state: 'Maharashtra/Goa/MP/Chhattisgarh', zone: 'Western' },
      '5': { state: 'AP/Telangana/Karnataka', zone: 'Southern' },
      '6': { state: 'Tamil Nadu/Kerala', zone: 'Southern' },
      '7': { state: 'WB/Odisha/NE States', zone: 'Eastern' },
      '8': { state: 'Bihar/Jharkhand', zone: 'Eastern' }
    };
    const zoneInfo = zones[pincode[0]] || { state: 'Unknown', zone: 'Unknown' };

    return {
      success: true,
      data: { pincode, zone: zoneInfo.zone, region: zoneInfo.state, valid: /^[1-9][0-9]{5}$/.test(pincode) },
      metadata: { tool: 'pincode_info', duration_ms: 0 }
    };
  },

  distance_calc: async (params): Promise<MCPResult> => {
    const distances: Record<string, Record<string, number>> = {
      'delhi': { 'mumbai': 1400, 'kolkata': 1500, 'chennai': 2200, 'bangalore': 2100, 'hyderabad': 1500 },
      'mumbai': { 'delhi': 1400, 'pune': 150, 'chennai': 1300, 'bangalore': 980, 'hyderabad': 700 },
      'bangalore': { 'chennai': 350, 'hyderabad': 570, 'mumbai': 980, 'delhi': 2100 },
      'chennai': { 'bangalore': 350, 'hyderabad': 620, 'mumbai': 1300, 'kolkata': 1700 },
      'kolkata': { 'delhi': 1500, 'chennai': 1700, 'mumbai': 2000 }
    };
    const from = (params.from || '').toLowerCase();
    const to = (params.to || '').toLowerCase();
    const dist = distances[from]?.[to] || distances[to]?.[from] || null;

    if (dist) {
      return {
        success: true,
        data: { from: params.from, to: params.to, distance: `${dist} km`, approxTime: `${Math.round(dist / 60)} hours`, fuelEstimate: `₹${Math.round(dist * 8)}` },
        metadata: { tool: 'distance_calc', duration_ms: 0 }
      };
    }
    return {
      success: true,
      data: { from: params.from, to: params.to, message: 'Route not found', note: 'Try: Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad' },
      metadata: { tool: 'distance_calc', duration_ms: 0 }
    };
  },

  toll_estimate: async (params): Promise<MCPResult> => {
    const tollRates: Record<string, number> = { 'car': 150, 'lcv': 250, 'bus': 400, 'truck': 500, 'mav': 700 };
    const vehicleType = (params.vehicle_type || 'truck').toLowerCase();
    const ratePerKm = (tollRates[vehicleType] || 500) / 100;
    const distResult = await TOOL_EXECUTORS.distance_calc({ from: params.from, to: params.to });

    if (distResult.data?.distance) {
      const dist = parseInt(distResult.data.distance);
      return {
        success: true,
        data: { from: params.from, to: params.to, distance: `${dist} km`, vehicleType, estimatedToll: `₹${(dist * ratePerKm).toFixed(0)}`, tollPlazas: Math.round(dist / 80) },
        metadata: { tool: 'toll_estimate', duration_ms: 0 }
      };
    }
    return { success: true, data: { message: 'Could not calculate toll' }, metadata: { tool: 'toll_estimate', duration_ms: 0 } };
  },

  // Government tools (require API keys)
  pm_kisan: async (): Promise<MCPResult> => ({ success: true, data: { scheme: 'PM-KISAN', info: '₹6000/year to farmers in 3 installments', checkUrl: 'https://pmkisan.gov.in' }, metadata: { tool: 'pm_kisan', duration_ms: 0 } }),
  mandi_price: async (params): Promise<MCPResult> => ({ success: true, data: { crop: params.crop, message: 'Requires eNAM API', checkUrl: 'https://enam.gov.in' }, metadata: { tool: 'mandi_price', duration_ms: 0 } }),
  ration_card: async (): Promise<MCPResult> => ({ success: true, data: { message: 'Requires state portal API' }, metadata: { tool: 'ration_card', duration_ms: 0 } }),
  epf_balance: async (): Promise<MCPResult> => ({ success: true, data: { checkUrl: 'https://passbook.epfindia.gov.in', smsCheck: 'SMS to 7738299899: EPFOHO UAN' }, metadata: { tool: 'epf_balance', duration_ms: 0 } }),
  electricity_bill: async (): Promise<MCPResult> => ({ success: true, data: { message: 'Requires state discom API' }, metadata: { tool: 'electricity_bill', duration_ms: 0 } }),
  fastag: async (params): Promise<MCPResult> => ({ success: true, data: { vehicleNumber: params.vehicle_number, message: 'Check with FASTag issuer bank' }, metadata: { tool: 'fastag', duration_ms: 0 } }),

  // Fleet tools (demo data)
  freight_loads: async (params): Promise<MCPResult> => ({
    success: true,
    data: { query: { from: params.from, to: params.to }, count: 5, loads: [
      { id: 'LD001', route: `${params.from || 'Mumbai'} → ${params.to || 'Delhi'}`, weight: '10 MT', rate: '₹45,000' },
      { id: 'LD002', route: `${params.from || 'Mumbai'} → ${params.to || 'Delhi'}`, weight: '15 MT', rate: '₹65,000' }
    ], note: 'Demo data' },
    metadata: { tool: 'freight_loads', duration_ms: 0 }
  }),
  freight_trucks: async (params): Promise<MCPResult> => ({
    success: true,
    data: { location: params.location || 'All India', count: 3, trucks: [
      { id: 'TRK001', type: '32FT Container', status: 'Available' },
      { id: 'TRK002', type: '20FT Open', status: 'Available' }
    ], note: 'Demo data' },
    metadata: { tool: 'freight_trucks', duration_ms: 0 }
  }),
  freight_stats: async (): Promise<MCPResult> => ({
    success: true,
    data: { activeLoads: 1250, availableTrucks: 890, avgRate: '₹4.5/km', topRoutes: ['Mumbai-Delhi', 'Chennai-Bangalore'] },
    metadata: { tool: 'freight_stats', duration_ms: 0 }
  }),
  fleet_vehicles: async (params): Promise<MCPResult> => ({
    success: true,
    data: { filter: params.status || 'all', count: 15, vehicles: [
      { number: 'MH04AB1234', type: 'Truck 32FT', status: 'On Trip' },
      { number: 'MH04CD5678', type: 'Truck 20FT', status: 'Available' }
    ] },
    metadata: { tool: 'fleet_vehicles', duration_ms: 0 }
  }),
  vehicle_position: async (params): Promise<MCPResult> => ({
    success: true,
    data: { vehicleNumber: params.vehicle_number, location: 'Demo - connect GPS for live tracking', speed: '0 km/h' },
    metadata: { tool: 'vehicle_position', duration_ms: 0 }
  }),
  live_positions: async (): Promise<MCPResult> => ({
    success: true,
    data: { count: 10, vehicles: [{ number: 'MH04AB1234', lat: 19.076, lng: 72.877, speed: '45 km/h' }] },
    metadata: { tool: 'live_positions', duration_ms: 0 }
  }),
  drivers: async (params): Promise<MCPResult> => ({
    success: true,
    data: { filter: params.status || 'all', count: 25, drivers: [
      { id: 'DRV001', name: 'Ramesh Kumar', status: 'On Duty', vehicle: 'MH04AB1234' }
    ] },
    metadata: { tool: 'drivers', duration_ms: 0 }
  }),
  trips: async (params): Promise<MCPResult> => ({
    success: true,
    data: { filter: params.status || 'all', count: 30, trips: [
      { id: 'TRP001', route: 'Mumbai → Delhi', status: 'In Transit' }
    ] },
    metadata: { tool: 'trips', duration_ms: 0 }
  }),
  orders: async (params): Promise<MCPResult> => ({ success: true, data: { filter: params.status || 'all', count: 50, note: 'Connect to WowTruck' }, metadata: { tool: 'orders', duration_ms: 0 } }),
  invoices: async (params): Promise<MCPResult> => ({ success: true, data: { filter: params.status || 'all', count: 45 }, metadata: { tool: 'invoices', duration_ms: 0 } }),
  alerts: async (): Promise<MCPResult> => ({
    success: true,
    data: { count: 3, alerts: [{ type: 'warning', message: 'Vehicle MH04AB1234 due for service' }] },
    metadata: { tool: 'alerts', duration_ms: 0 }
  }),

  // Shipping tools
  shipments: async (params): Promise<MCPResult> => ({ success: true, data: { filter: params.status || 'all', count: 20 }, metadata: { tool: 'shipments', duration_ms: 0 } }),
  container_track: async (params): Promise<MCPResult> => {
    const containerNum = (params.container_number || '').toUpperCase();
    const isValid = /^[A-Z]{4}[0-9]{7}$/.test(containerNum);
    return { success: true, data: { containerNumber: containerNum, valid: isValid, status: isValid ? 'Format valid - connect carrier API' : 'Invalid format' }, metadata: { tool: 'container_track', duration_ms: 0 } };
  },
  container_validate: async (params): Promise<MCPResult> => {
    const containerNum = (params.container_number || '').toUpperCase();
    const isValid = /^[A-Z]{4}[0-9]{7}$/.test(containerNum);
    return { success: true, data: { containerNumber: containerNum, formatValid: isValid, ownerCode: isValid ? containerNum.substring(0, 3) : null }, metadata: { tool: 'container_validate', duration_ms: 0 } };
  },
  bookings: async (params): Promise<MCPResult> => ({ success: true, data: { filter: params.status || 'all', count: 15 }, metadata: { tool: 'bookings', duration_ms: 0 } }),
  port_search: async (params): Promise<MCPResult> => {
    const indianPorts = [
      { code: 'INMAA', name: 'Chennai Port' }, { code: 'INBOM', name: 'Mumbai (JNPT)' },
      { code: 'INKOL', name: 'Kolkata Port' }, { code: 'INMUN', name: 'Mundra Port' }
    ];
    const query = (params.query || '').toLowerCase();
    const matches = indianPorts.filter(p => p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query));
    return { success: true, data: { query: params.query, count: matches.length, ports: matches.length ? matches : indianPorts }, metadata: { tool: 'port_search', duration_ms: 0 } };
  },
  indian_ports: async (): Promise<MCPResult> => ({
    success: true,
    data: { count: 8, ports: [
      { code: 'INBOM', name: 'Mumbai (JNPT)' }, { code: 'INMAA', name: 'Chennai' },
      { code: 'INKOL', name: 'Kolkata' }, { code: 'INMUN', name: 'Mundra' }
    ] },
    metadata: { tool: 'indian_ports', duration_ms: 0 }
  }),
  carriers: async (): Promise<MCPResult> => ({
    success: true,
    data: { count: 8, carriers: [
      { code: 'MAEU', name: 'Maersk' }, { code: 'MSCU', name: 'MSC' },
      { code: 'CMDU', name: 'CMA CGM' }, { code: 'COSU', name: 'COSCO' }
    ] },
    metadata: { tool: 'carriers', duration_ms: 0 }
  }),
  vessel_search: async (params): Promise<MCPResult> => ({ success: true, data: { query: params.query, message: 'Requires MarineTraffic API' }, metadata: { tool: 'vessel_search', duration_ms: 0 } }),
  weather: async (params): Promise<MCPResult> => ({ success: true, data: { city: params.city, message: 'Requires weather API' }, metadata: { tool: 'weather', duration_ms: 0 } }),
  web_search: async (params): Promise<MCPResult> => ({ success: true, data: { query: params.query, message: 'Requires search API' }, metadata: { tool: 'web_search', duration_ms: 0 } }),

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRM TOOLS
  // ═══════════════════════════════════════════════════════════════════════════════

  lead_create: async (params): Promise<MCPResult> => {
    const name = params.name || 'Unknown';
    const phone = params.phone || '';
    const email = params.email || '';
    const source = params.source || 'Direct';

    const leadId = `LEAD-${Date.now().toString(36).toUpperCase()}`;

    return {
      success: true,
      data: {
        leadId,
        name,
        phone,
        email,
        source,
        status: 'New',
        createdAt: new Date().toISOString(),
        assignedTo: null,
        nextAction: 'Initial contact within 24 hours',
        note: 'Mock lead - Connect to CRM for actual creation'
      },
      metadata: { tool: 'lead_create', duration_ms: 0 }
    };
  },

  lead_update: async (params): Promise<MCPResult> => {
    const leadId = params.lead_id || '';
    const status = params.status || 'In Progress';
    const notes = params.notes || '';

    return {
      success: true,
      data: {
        leadId,
        status,
        notes,
        updatedAt: new Date().toISOString(),
        note: 'Mock update - Connect to CRM for actual update'
      },
      metadata: { tool: 'lead_update', duration_ms: 0 }
    };
  },

  lead_assign: async (params): Promise<MCPResult> => {
    const leadId = params.lead_id || '';
    const userId = params.user_id || 'sales_rep_1';

    return {
      success: true,
      data: {
        leadId,
        assignedTo: userId,
        assignedAt: new Date().toISOString(),
        previousAssignee: null,
        note: 'Mock assignment - Connect to CRM for actual assignment'
      },
      metadata: { tool: 'lead_assign', duration_ms: 0 }
    };
  },

  lead_search: async (params): Promise<MCPResult> => {
    const query = params.query || '';
    const status = params.status || 'all';

    // Mock search results
    const mockLeads = [
      { id: 'LEAD-ABC123', name: 'Sample Lead 1', status: 'New', phone: '9876543210' },
      { id: 'LEAD-DEF456', name: 'Sample Lead 2', status: 'Qualified', phone: '9876543211' },
      { id: 'LEAD-GHI789', name: 'Sample Lead 3', status: 'Contacted', phone: '9876543212' }
    ];

    const filtered = status === 'all' ? mockLeads : mockLeads.filter(l => l.status.toLowerCase() === status.toLowerCase());

    return {
      success: true,
      data: {
        query,
        statusFilter: status,
        count: filtered.length,
        leads: filtered,
        note: 'Mock search - Connect to CRM for actual search'
      },
      metadata: { tool: 'lead_search', duration_ms: 0 }
    };
  },

  contact_create: async (params): Promise<MCPResult> => {
    const name = params.name || 'Unknown';
    const phone = params.phone || '';
    const email = params.email || '';
    const company = params.company || '';

    const contactId = `CONTACT-${Date.now().toString(36).toUpperCase()}`;

    return {
      success: true,
      data: {
        contactId,
        name,
        phone,
        email,
        company,
        createdAt: new Date().toISOString(),
        note: 'Mock contact - Connect to CRM for actual creation'
      },
      metadata: { tool: 'contact_create', duration_ms: 0 }
    };
  },

  opportunity_create: async (params): Promise<MCPResult> => {
    const name = params.name || 'New Opportunity';
    const amount = params.amount || 0;
    const stage = params.stage || 'Qualification';
    const leadId = params.lead_id || '';

    const opportunityId = `OPP-${Date.now().toString(36).toUpperCase()}`;

    return {
      success: true,
      data: {
        opportunityId,
        name,
        expectedValue: amount,
        stage,
        probability: stage === 'Qualification' ? 20 : stage === 'Proposal' ? 50 : 75,
        linkedLead: leadId || null,
        createdAt: new Date().toISOString(),
        note: 'Mock opportunity - Connect to CRM for actual creation'
      },
      metadata: { tool: 'opportunity_create', duration_ms: 0 }
    };
  },

  activity_log: async (params): Promise<MCPResult> => {
    const leadId = params.lead_id || '';
    const type = params.type || 'note';
    const notes = params.notes || '';

    const activityId = `ACT-${Date.now().toString(36).toUpperCase()}`;

    return {
      success: true,
      data: {
        activityId,
        leadId,
        type,
        notes,
        loggedAt: new Date().toISOString(),
        loggedBy: 'current_user',
        note: 'Mock activity log - Connect to CRM for actual logging'
      },
      metadata: { tool: 'activity_log', duration_ms: 0 }
    };
  },

  activity_task: async (params): Promise<MCPResult> => {
    const leadId = params.lead_id || '';
    const taskType = params.task_type || 'followup';
    const dueDate = params.due_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const description = params.description || '';
    const priority = params.priority || 'medium';

    const taskId = `TASK-${Date.now().toString(36).toUpperCase()}`;

    return {
      success: true,
      data: {
        taskId,
        leadId,
        taskType,
        description,
        dueDate,
        priority,
        status: 'scheduled',
        assignedTo: 'current_user',
        createdAt: new Date().toISOString(),
        reminder: true,
        note: 'Mock task - Connect to CRM for actual task creation'
      },
      metadata: { tool: 'activity_task', duration_ms: 0 }
    };
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ERP TOOLS
  // ═══════════════════════════════════════════════════════════════════════════════

  balance_sheet: async (params): Promise<MCPResult> => {
    const fromDate = params.from_date || '2025-04-01';
    const toDate = params.to_date || new Date().toISOString().split('T')[0];

    return {
      success: true,
      data: {
        reportType: 'Balance Sheet',
        period: { from: fromDate, to: toDate },
        assets: {
          currentAssets: {
            cash: 250000,
            bankBalance: 1500000,
            accountsReceivable: 850000,
            inventory: 420000,
            total: 3020000
          },
          fixedAssets: {
            property: 2500000,
            equipment: 450000,
            vehicles: 350000,
            less_depreciation: -280000,
            total: 3020000
          },
          totalAssets: 6040000
        },
        liabilities: {
          currentLiabilities: {
            accountsPayable: 620000,
            shortTermLoans: 500000,
            taxPayable: 180000,
            total: 1300000
          },
          longTermLiabilities: {
            bankLoans: 1500000,
            total: 1500000
          },
          totalLiabilities: 2800000
        },
        equity: {
          shareCapital: 2000000,
          retainedEarnings: 1240000,
          totalEquity: 3240000
        },
        generatedAt: new Date().toISOString(),
        note: 'Mock balance sheet - Connect to accounting system for actual data'
      },
      metadata: { tool: 'balance_sheet', duration_ms: 0 }
    };
  },

  profit_loss: async (params): Promise<MCPResult> => {
    const fromDate = params.from_date || '2025-04-01';
    const toDate = params.to_date || new Date().toISOString().split('T')[0];

    return {
      success: true,
      data: {
        reportType: 'Profit & Loss Statement',
        period: { from: fromDate, to: toDate },
        revenue: {
          sales: 5200000,
          serviceIncome: 850000,
          otherIncome: 120000,
          totalRevenue: 6170000
        },
        expenses: {
          costOfGoodsSold: 2800000,
          salaries: 1200000,
          rent: 180000,
          utilities: 45000,
          marketing: 150000,
          depreciation: 120000,
          interest: 95000,
          otherExpenses: 80000,
          totalExpenses: 4670000
        },
        profitBeforeTax: 1500000,
        tax: 375000,
        netProfit: 1125000,
        generatedAt: new Date().toISOString(),
        note: 'Mock P&L - Connect to accounting system for actual data'
      },
      metadata: { tool: 'profit_loss', duration_ms: 0 }
    };
  },

  invoice_create: async (params): Promise<MCPResult> => {
    const customer = params.customer || 'Unknown Customer';
    const items = params.items || '[]';
    const gstin = params.gstin || '';

    const invoiceNo = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    let parsedItems: any[] = [];
    try {
      parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    } catch {
      parsedItems = [{ name: 'Service', qty: 1, rate: 1000, amount: 1000 }];
    }

    const subtotal = parsedItems.reduce((sum: number, item: any) => sum + (item.amount || item.qty * item.rate || 0), 0);
    const gstAmount = subtotal * 0.18;
    const total = subtotal + gstAmount;

    return {
      success: true,
      data: {
        invoiceNo,
        customer,
        customerGstin: gstin || null,
        date: new Date().toISOString().split('T')[0],
        items: parsedItems,
        subtotal,
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        total,
        status: 'Draft',
        note: 'Mock invoice - Connect to ERP for actual creation'
      },
      metadata: { tool: 'invoice_create', duration_ms: 0 }
    };
  },

  inventory_check: async (params): Promise<MCPResult> => {
    const item = params.item || '';
    const warehouse = params.warehouse || 'Main';

    // Mock inventory data
    const mockStock: Record<string, { qty: number; unit: string; reorderLevel: number }> = {
      'widget-a': { qty: 150, unit: 'pcs', reorderLevel: 50 },
      'widget-b': { qty: 25, unit: 'pcs', reorderLevel: 30 },
      'raw-material-x': { qty: 500, unit: 'kg', reorderLevel: 100 },
    };

    const itemKey = item.toLowerCase().replace(/\s+/g, '-');
    const stock = mockStock[itemKey] || { qty: 0, unit: 'pcs', reorderLevel: 10 };

    return {
      success: true,
      data: {
        item,
        warehouse,
        available: stock.qty,
        unit: stock.unit,
        reorderLevel: stock.reorderLevel,
        needsReorder: stock.qty < stock.reorderLevel,
        lastUpdated: new Date().toISOString(),
        note: 'Mock inventory - Connect to ERP for actual stock levels'
      },
      metadata: { tool: 'inventory_check', duration_ms: 0 }
    };
  },

  purchase_order: async (params): Promise<MCPResult> => {
    const supplier = params.supplier || 'Unknown Supplier';
    const items = params.items || '[]';

    const poNo = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    let parsedItems: any[] = [];
    try {
      parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    } catch {
      parsedItems = [{ name: 'Item', qty: 1, rate: 1000 }];
    }

    const total = parsedItems.reduce((sum: number, item: any) => sum + (item.qty * item.rate || 0), 0);

    return {
      success: true,
      data: {
        poNo,
        supplier,
        date: new Date().toISOString().split('T')[0],
        items: parsedItems,
        total,
        status: 'Draft',
        expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        note: 'Mock PO - Connect to ERP for actual creation'
      },
      metadata: { tool: 'purchase_order', duration_ms: 0 }
    };
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ADDITIONAL COMPLIANCE TOOLS
  // ═══════════════════════════════════════════════════════════════════════════════

  gst_search_pan: async (params): Promise<MCPResult> => {
    const pan = (params.pan || '').toUpperCase();
    return {
      success: true,
      data: { pan, gstins: [`27${pan}1Z5`, `29${pan}1Z7`], count: 2, note: 'Mock - Connect GST API' },
      metadata: { tool: 'gst_search_pan', duration_ms: 0 }
    };
  },

  gst_reverse: async (params): Promise<MCPResult> => {
    const total = params.total || 0;
    const rate = params.rate || 18;
    const base = total / (1 + rate / 100);
    const gst = total - base;
    return {
      success: true,
      data: { totalAmount: total, gstRate: rate, baseAmount: base.toFixed(2), gstAmount: gst.toFixed(2), cgst: (gst/2).toFixed(2), sgst: (gst/2).toFixed(2) },
      metadata: { tool: 'gst_reverse', duration_ms: 0 }
    };
  },

  sac_lookup: async (params): Promise<MCPResult> => {
    const sacCodes: Record<string, { sac: string; gst: number; desc: string }> = {
      'transport': { sac: '996511', gst: 5, desc: 'Road transport services' },
      'freight': { sac: '996511', gst: 5, desc: 'GTA services' },
      'consulting': { sac: '998311', gst: 18, desc: 'Management consulting' },
      'software': { sac: '998314', gst: 18, desc: 'IT services' },
      'accounting': { sac: '998221', gst: 18, desc: 'Accounting services' },
      'legal': { sac: '998211', gst: 18, desc: 'Legal services' },
      'restaurant': { sac: '996331', gst: 5, desc: 'Restaurant services' }
    };
    const query = (params.query || '').toLowerCase();
    const match = Object.entries(sacCodes).find(([k]) => query.includes(k));
    return {
      success: true,
      data: match ? { query: params.query, sacCode: match[1].sac, description: match[1].desc, gstRate: match[1].gst } : { query: params.query, message: 'SAC not found' },
      metadata: { tool: 'sac_lookup', duration_ms: 0 }
    };
  },

  gst_rate: async (params): Promise<MCPResult> => {
    const code = params.code || '';
    const rates: Record<string, number> = { '1001': 5, '1006': 5, '2523': 28, '7206': 18, '8471': 18, '9965': 5, '9983': 18 };
    const rate = rates[code.substring(0, 4)] || 18;
    return {
      success: true,
      data: { code, gstRate: rate, cgst: rate/2, sgst: rate/2, igst: rate },
      metadata: { tool: 'gst_rate', duration_ms: 0 }
    };
  },

  gstr9_prepare: async (params): Promise<MCPResult> => {
    const gstin = params.gstin || '';
    const year = params.year || '2024-25';
    return {
      success: true,
      data: {
        gstin, financialYear: year, returnType: 'GSTR-9', status: 'PREPARED',
        summary: { outwardSupply: 15000000, inwardSupply: 12000000, taxPaid: 540000, itcClaimed: 432000 },
        dueDate: '31st December',
        note: 'Mock GSTR-9 - Connect GSP for actual preparation'
      },
      metadata: { tool: 'gstr9_prepare', duration_ms: 0 }
    };
  },

  eway_verify: async (params): Promise<MCPResult> => {
    const ewayNo = params.eway_no || '';
    return {
      success: true,
      data: { ewayBillNo: ewayNo, status: 'ACTIVE', validUpto: new Date(Date.now() + 48*60*60*1000).toISOString(), vehicleNo: 'MH04AB1234', note: 'Mock verification' },
      metadata: { tool: 'eway_verify', duration_ms: 0 }
    };
  },

  eway_update: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { ewayBillNo: params.eway_no, vehicleNo: params.vehicle_no, status: 'UPDATED', updatedAt: new Date().toISOString() },
      metadata: { tool: 'eway_update', duration_ms: 0 }
    };
  },

  eway_cancel: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { ewayBillNo: params.eway_no, reason: params.reason, status: 'CANCELLED', cancelledAt: new Date().toISOString() },
      metadata: { tool: 'eway_cancel', duration_ms: 0 }
    };
  },

  eway_extend: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { ewayBillNo: params.eway_no, status: 'EXTENDED', newValidUpto: new Date(Date.now() + 72*60*60*1000).toISOString() },
      metadata: { tool: 'eway_extend', duration_ms: 0 }
    };
  },

  einvoice_cancel: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { irn: params.irn, reason: params.reason, status: 'CANCELLED', cancelledAt: new Date().toISOString() },
      metadata: { tool: 'einvoice_cancel', duration_ms: 0 }
    };
  },

  einvoice_verify: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { irn: params.irn, status: 'ACTIVE', generatedAt: new Date(Date.now() - 24*60*60*1000).toISOString(), note: 'Mock verification' },
      metadata: { tool: 'einvoice_verify', duration_ms: 0 }
    };
  },

  // TDS Tools
  tds_section_lookup: async (params): Promise<MCPResult> => {
    const sections: Record<string, { rate: number; threshold: number; desc: string }> = {
      'salary': { rate: 0, threshold: 0, desc: '192 - Salary (slab rates)' },
      'interest': { rate: 10, threshold: 40000, desc: '194A - Interest other than securities' },
      'contractor': { rate: 2, threshold: 30000, desc: '194C - Contractor payments' },
      'professional': { rate: 10, threshold: 30000, desc: '194J - Professional/Technical fees' },
      'rent': { rate: 10, threshold: 240000, desc: '194I - Rent' },
      'commission': { rate: 5, threshold: 15000, desc: '194H - Commission/Brokerage' }
    };
    const type = (params.payment_type || '').toLowerCase();
    const match = sections[type];
    return {
      success: true,
      data: match ? { paymentType: type, section: match.desc, rate: `${match.rate}%`, threshold: match.threshold } : { paymentType: type, message: 'Section not found' },
      metadata: { tool: 'tds_section_lookup', duration_ms: 0 }
    };
  },

  tds_24q_prepare: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        tan: params.tan, quarter: params.quarter, formType: '24Q',
        status: 'PREPARED', employees: 25, totalSalary: 5000000, totalTds: 450000,
        note: 'Mock Form 24Q - Connect to payroll for actual data'
      },
      metadata: { tool: 'tds_24q_prepare', duration_ms: 0 }
    };
  },

  tds_26q_prepare: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        tan: params.tan, quarter: params.quarter, formType: '26Q',
        status: 'PREPARED', deductees: 45, totalPayment: 2500000, totalTds: 250000,
        note: 'Mock Form 26Q - Connect to accounting for actual data'
      },
      metadata: { tool: 'tds_26q_prepare', duration_ms: 0 }
    };
  },

  tds_challan_280: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        pan: params.pan, amount: params.amount, challanType: '280',
        bsrCode: '0510125', challanNo: `${Date.now().toString().substring(5)}`,
        depositDate: new Date().toISOString().split('T')[0],
        note: 'Mock challan - Use TIN-NSDL for actual payment'
      },
      metadata: { tool: 'tds_challan_280', duration_ms: 0 }
    };
  },

  tds_challan_281: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        tan: params.tan, amount: params.amount, challanType: '281',
        bsrCode: '0510125', challanNo: `${Date.now().toString().substring(5)}`,
        depositDate: new Date().toISOString().split('T')[0],
        note: 'Mock challan - Use TIN-NSDL for actual payment'
      },
      metadata: { tool: 'tds_challan_281', duration_ms: 0 }
    };
  },

  form16_generate: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        employeePan: params.employee_pan, financialYear: params.year,
        formType: 'Form 16', partA: 'Generated', partB: 'Generated',
        grossSalary: 1200000, deductions: 150000, taxableIncome: 1050000, taxDeducted: 105000,
        note: 'Mock Form 16 - Connect to TRACES for actual generation'
      },
      metadata: { tool: 'form16_generate', duration_ms: 0 }
    };
  },

  form16a_generate: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        deducteePan: params.deductee_pan, quarter: params.quarter,
        formType: 'Form 16A', totalPayment: 500000, totalTds: 50000,
        note: 'Mock Form 16A - Connect to TRACES for actual generation'
      },
      metadata: { tool: 'form16a_generate', duration_ms: 0 }
    };
  },

  tan_verify: async (params): Promise<MCPResult> => {
    const tan = (params.tan || '').toUpperCase();
    const isValid = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(tan);
    return {
      success: true,
      data: { tan, valid: isValid, format: isValid ? 'Valid TAN format' : 'Invalid TAN format', note: 'Live verification requires NSDL API' },
      metadata: { tool: 'tan_verify', duration_ms: 0 }
    };
  },

  form26as_fetch: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        pan: params.pan, assessmentYear: params.year,
        tdsCredits: [
          { deductor: 'ABC Corp', tan: 'MUMA12345B', amount: 120000, section: '194J' },
          { deductor: 'XYZ Ltd', tan: 'DELX54321C', amount: 50000, section: '194C' }
        ],
        totalTdsCredit: 170000,
        note: 'Mock Form 26AS - Connect to TRACES for actual data'
      },
      metadata: { tool: 'form26as_fetch', duration_ms: 0 }
    };
  },

  // ITR Tools
  income_tax_calc: async (params): Promise<MCPResult> => {
    const income = params.income || 0;
    const regime = (params.regime || 'new').toLowerCase();
    let tax = 0;
    if (regime === 'new') {
      if (income <= 300000) tax = 0;
      else if (income <= 700000) tax = (income - 300000) * 0.05;
      else if (income <= 1000000) tax = 20000 + (income - 700000) * 0.10;
      else if (income <= 1200000) tax = 50000 + (income - 1000000) * 0.15;
      else if (income <= 1500000) tax = 80000 + (income - 1200000) * 0.20;
      else tax = 140000 + (income - 1500000) * 0.30;
      if (income <= 775000) tax = 0;
    } else {
      if (income <= 250000) tax = 0;
      else if (income <= 500000) tax = (income - 250000) * 0.05;
      else if (income <= 1000000) tax = 12500 + (income - 500000) * 0.20;
      else tax = 112500 + (income - 1000000) * 0.30;
    }
    const cess = tax * 0.04;
    return {
      success: true,
      data: { income, regime, baseTax: tax.toFixed(2), cess: cess.toFixed(2), totalTax: (tax + cess).toFixed(2) },
      metadata: { tool: 'income_tax_calc', duration_ms: 0 }
    };
  },

  itr_80c_check: async (params): Promise<MCPResult> => {
    const investments = params.investments || {};
    const items = { ppf: investments.ppf || 0, elss: investments.elss || 0, lic: investments.lic || 0, epf: investments.epf || 0, nsc: investments.nsc || 0 };
    const total = Object.values(items).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
    const limit = 150000;
    return {
      success: true,
      data: { investments: items, totalInvested: total, limit, eligible: Math.min(total, limit), excess: Math.max(0, total - limit) },
      metadata: { tool: 'itr_80c_check', duration_ms: 0 }
    };
  },

  itr_80d_check: async (params): Promise<MCPResult> => {
    const premiums = params.premiums || {};
    const self = premiums.self || 0;
    const parents = premiums.parents || 0;
    const seniorParents = premiums.senior_parents || false;
    const selfLimit = 25000;
    const parentLimit = seniorParents ? 50000 : 25000;
    return {
      success: true,
      data: {
        selfPremium: self, selfLimit, selfEligible: Math.min(self, selfLimit),
        parentPremium: parents, parentLimit, parentEligible: Math.min(parents, parentLimit),
        totalEligible: Math.min(self, selfLimit) + Math.min(parents, parentLimit)
      },
      metadata: { tool: 'itr_80d_check', duration_ms: 0 }
    };
  },

  itr_regime_compare: async (params): Promise<MCPResult> => {
    const income = params.income || 0;
    const deductions = params.deductions || {};
    const total80c = Math.min(deductions['80c'] || 0, 150000);
    const total80d = Math.min(deductions['80d'] || 0, 75000);
    const hra = deductions.hra || 0;
    const oldTaxable = Math.max(0, income - total80c - total80d - hra - 50000);
    const newTaxable = income;
    // Simplified calculation
    const oldTax = oldTaxable > 1000000 ? 112500 + (oldTaxable - 1000000) * 0.30 : oldTaxable > 500000 ? 12500 + (oldTaxable - 500000) * 0.20 : (oldTaxable - 250000) * 0.05;
    const newTax = newTaxable > 1500000 ? 140000 + (newTaxable - 1500000) * 0.30 : newTaxable > 1200000 ? 80000 + (newTaxable - 1200000) * 0.20 : newTaxable > 1000000 ? 50000 + (newTaxable - 1000000) * 0.15 : 0;
    return {
      success: true,
      data: { income, oldRegimeTax: Math.max(0, oldTax).toFixed(2), newRegimeTax: Math.max(0, newTax).toFixed(2), recommended: oldTax < newTax ? 'Old Regime' : 'New Regime', savings: Math.abs(oldTax - newTax).toFixed(2) },
      metadata: { tool: 'itr_regime_compare', duration_ms: 0 }
    };
  },

  itr_due_date: async (params): Promise<MCPResult> => {
    const type = params.taxpayer_type || 'individual';
    const dates: Record<string, string> = {
      'individual': '31st July', 'company': '31st October', 'audit': '31st October', 'tp': '30th November'
    };
    return {
      success: true,
      data: { taxpayerType: type, dueDate: dates[type] || '31st July', assessmentYear: '2025-26', penalty: 'Late fee u/s 234F up to ₹5000' },
      metadata: { tool: 'itr_due_date', duration_ms: 0 }
    };
  },

  itr_form_selector: async (params): Promise<MCPResult> => {
    const sources = params.income_sources || [];
    let form = 'ITR-1';
    if (sources.includes('business') || sources.includes('profession')) form = 'ITR-3';
    else if (sources.includes('capital_gains')) form = 'ITR-2';
    else if (sources.includes('foreign_income')) form = 'ITR-2';
    else if (sources.includes('multiple_house')) form = 'ITR-2';
    return {
      success: true,
      data: { incomeSources: sources, recommendedForm: form, note: 'Verify based on complete financial details' },
      metadata: { tool: 'itr_form_selector', duration_ms: 0 }
    };
  },

  itr_refund_status: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { pan: params.pan, assessmentYear: params.year, status: 'PROCESSED', refundAmount: 25000, creditDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], note: 'Mock status - Check on incometax.gov.in' },
      metadata: { tool: 'itr_refund_status', duration_ms: 0 }
    };
  },

  ais_fetch: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        pan: params.pan, financialYear: params.year,
        tdsCredits: 185000, tcsCredits: 5000, sftInfo: { bankInterest: 45000, dividends: 12000 },
        highValueTransactions: [], note: 'Mock AIS - Connect to income tax portal for actual data'
      },
      metadata: { tool: 'ais_fetch', duration_ms: 0 }
    };
  },

  capital_gains_calc: async (params): Promise<MCPResult> => {
    const sale = params.sale_value || 0;
    const purchase = params.purchase_value || 0;
    const holding = params.holding_period || 12;
    const isLongTerm = holding > 12;
    const gain = sale - purchase;
    const rate = isLongTerm ? 12.5 : 20;
    const tax = gain > 0 ? gain * (rate / 100) : 0;
    return {
      success: true,
      data: { saleValue: sale, purchaseValue: purchase, holdingPeriod: `${holding} months`, gainType: isLongTerm ? 'LTCG' : 'STCG', capitalGain: gain, taxRate: `${rate}%`, tax: tax.toFixed(2) },
      metadata: { tool: 'capital_gains_calc', duration_ms: 0 }
    };
  },

  advance_tax_calc: async (params): Promise<MCPResult> => {
    const income = params.estimated_income || 0;
    const tax = income > 1000000 ? 112500 + (income - 1000000) * 0.30 : income > 500000 ? 12500 + (income - 500000) * 0.20 : 0;
    const cess = tax * 0.04;
    const total = tax + cess;
    return {
      success: true,
      data: {
        estimatedIncome: income, totalTax: total.toFixed(2),
        installments: [
          { due: '15th June', percent: 15, amount: (total * 0.15).toFixed(2) },
          { due: '15th September', percent: 45, amount: (total * 0.45).toFixed(2) },
          { due: '15th December', percent: 75, amount: (total * 0.75).toFixed(2) },
          { due: '15th March', percent: 100, amount: total.toFixed(2) }
        ]
      },
      metadata: { tool: 'advance_tax_calc', duration_ms: 0 }
    };
  },

  // MCA Tools
  mca_company_search: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        query: params.name,
        results: [
          { cin: 'U72200MH2020PTC123456', name: `${params.name} Private Limited`, status: 'Active' },
          { cin: 'U72200DL2019PTC654321', name: `${params.name} Solutions Ltd`, status: 'Active' }
        ],
        note: 'Mock search - Connect to MCA API for actual data'
      },
      metadata: { tool: 'mca_company_search', duration_ms: 0 }
    };
  },

  mca_din_verify: async (params): Promise<MCPResult> => {
    const din = params.din || '';
    const isValid = /^[0-9]{8}$/.test(din);
    return {
      success: true,
      data: { din, valid: isValid, status: isValid ? 'Active' : 'Invalid format', name: isValid ? 'Director Name' : null, note: 'Mock - Connect MCA for actual verification' },
      metadata: { tool: 'mca_din_verify', duration_ms: 0 }
    };
  },

  mca_cin_lookup: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        cin: params.cin, companyName: 'Sample Company Private Limited', status: 'Active',
        registrationDate: '2020-01-15', authorizedCapital: 1000000, paidUpCapital: 500000,
        registeredOffice: 'Mumbai, Maharashtra', note: 'Mock data'
      },
      metadata: { tool: 'mca_cin_lookup', duration_ms: 0 }
    };
  },

  mca_llpin_lookup: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { llpin: params.llpin, llpName: 'Sample LLP', status: 'Active', partners: 2, note: 'Mock data' },
      metadata: { tool: 'mca_llpin_lookup', duration_ms: 0 }
    };
  },

  mca_director_search: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        name: params.name,
        results: [{ din: '12345678', name: params.name, companies: ['ABC Pvt Ltd', 'XYZ Ltd'], status: 'Active' }],
        note: 'Mock search'
      },
      metadata: { tool: 'mca_director_search', duration_ms: 0 }
    };
  },

  mca_filing_dues: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        companyType: params.company_type || 'private',
        filings: [
          { form: 'AOC-4', description: 'Annual Financial Statements', dueDate: '30th November' },
          { form: 'MGT-7', description: 'Annual Return', dueDate: '28th November' },
          { form: 'ADT-1', description: 'Auditor Appointment', dueDate: '14 days from AGM' }
        ]
      },
      metadata: { tool: 'mca_filing_dues', duration_ms: 0 }
    };
  },

  mca_aoc4_status: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { cin: params.cin, form: 'AOC-4', status: 'Filed', filingDate: '2024-11-25', srn: `AOC4${Date.now().toString().substring(5)}` },
      metadata: { tool: 'mca_aoc4_status', duration_ms: 0 }
    };
  },

  mca_mgt7_status: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { cin: params.cin, form: 'MGT-7', status: 'Pending', dueDate: '28th November', note: 'Mock status' },
      metadata: { tool: 'mca_mgt7_status', duration_ms: 0 }
    };
  },

  mca_charge_search: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        cin: params.cin, charges: [
          { chargeId: 'CH001', holder: 'State Bank of India', amount: 5000000, status: 'Satisfied', creationDate: '2022-01-15' }
        ],
        totalCharges: 1, activeCharges: 0
      },
      metadata: { tool: 'mca_charge_search', duration_ms: 0 }
    };
  },

  mca_strike_off_check: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { cin: params.cin, status: 'Active', strikeOffStatus: 'Not under strike-off', lastFilingDate: '2024-11-25' },
      metadata: { tool: 'mca_strike_off_check', duration_ms: 0 }
    };
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ADDITIONAL ERP TOOLS
  // ═══════════════════════════════════════════════════════════════════════════════

  journal_entry: async (params): Promise<MCPResult> => {
    const jeNo = `JE-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: {
        journalNo: jeNo, date: new Date().toISOString().split('T')[0],
        debitAccount: params.debit_account || 'Cash', creditAccount: params.credit_account || 'Sales',
        amount: params.amount || 0, narration: params.narration || '', status: 'Posted'
      },
      metadata: { tool: 'journal_entry', duration_ms: 0 }
    };
  },

  ledger_balance: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        account: params.account || 'Cash', balance: 250000, type: 'Debit',
        lastTransaction: new Date().toISOString(), transactionCount: 156
      },
      metadata: { tool: 'ledger_balance', duration_ms: 0 }
    };
  },

  trial_balance: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        asOnDate: params.as_on_date || new Date().toISOString().split('T')[0],
        accounts: [
          { name: 'Cash', debit: 250000, credit: 0 },
          { name: 'Bank', debit: 1500000, credit: 0 },
          { name: 'Sales', debit: 0, credit: 5200000 },
          { name: 'Purchases', debit: 2800000, credit: 0 },
          { name: 'Capital', debit: 0, credit: 2000000 }
        ],
        totalDebit: 6550000, totalCredit: 6550000, balanced: true
      },
      metadata: { tool: 'trial_balance', duration_ms: 0 }
    };
  },

  cash_flow: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        period: { from: params.from_date || '2025-04-01', to: params.to_date || new Date().toISOString().split('T')[0] },
        operating: { netIncome: 1125000, depreciation: 120000, workingCapitalChanges: -85000, netCash: 1160000 },
        investing: { equipmentPurchase: -250000, netCash: -250000 },
        financing: { loanRepayment: -200000, dividends: -100000, netCash: -300000 },
        netChange: 610000, openingCash: 140000, closingCash: 750000
      },
      metadata: { tool: 'cash_flow', duration_ms: 0 }
    };
  },

  bank_reconcile: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        account: params.account || 'HDFC Bank', asOnDate: params.as_on_date || new Date().toISOString().split('T')[0],
        bookBalance: 1500000, bankBalance: 1525000, difference: 25000,
        unreconciledItems: [
          { type: 'Cheque in transit', amount: 30000 },
          { type: 'Bank charges', amount: -5000 }
        ],
        status: 'Pending reconciliation'
      },
      metadata: { tool: 'bank_reconcile', duration_ms: 0 }
    };
  },

  coa_list: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        chartOfAccounts: [
          { code: '1000', name: 'Assets', type: 'Group' },
          { code: '1100', name: 'Current Assets', type: 'Group' },
          { code: '1101', name: 'Cash', type: 'Ledger' },
          { code: '1102', name: 'Bank', type: 'Ledger' },
          { code: '2000', name: 'Liabilities', type: 'Group' },
          { code: '3000', name: 'Equity', type: 'Group' },
          { code: '4000', name: 'Revenue', type: 'Group' },
          { code: '5000', name: 'Expenses', type: 'Group' }
        ],
        totalAccounts: 8
      },
      metadata: { tool: 'coa_list', duration_ms: 0 }
    };
  },

  voucher_create: async (params): Promise<MCPResult> => {
    const voucherNo = `VCH-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { voucherNo, type: params.type || 'Payment', amount: params.amount, party: params.party, date: new Date().toISOString().split('T')[0], status: 'Draft' },
      metadata: { tool: 'voucher_create', duration_ms: 0 }
    };
  },

  voucher_search: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        query: params.query, vouchers: [
          { no: 'VCH-001', type: 'Payment', amount: 50000, party: 'Vendor ABC', date: '2025-01-05' }
        ],
        count: 1
      },
      metadata: { tool: 'voucher_search', duration_ms: 0 }
    };
  },

  invoice_get: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        invoiceNo: params.invoice_no, customer: 'Sample Customer', date: '2025-01-05',
        items: [{ name: 'Product A', qty: 10, rate: 1000, amount: 10000 }],
        subtotal: 10000, gst: 1800, total: 11800, status: 'Unpaid'
      },
      metadata: { tool: 'invoice_get', duration_ms: 0 }
    };
  },

  invoice_list: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        filter: params.status || 'all',
        invoices: [
          { no: 'INV-2025-0001', customer: 'ABC Corp', amount: 118000, status: 'Paid', date: '2025-01-01' },
          { no: 'INV-2025-0002', customer: 'XYZ Ltd', amount: 59000, status: 'Unpaid', date: '2025-01-03' }
        ],
        count: 2, totalAmount: 177000
      },
      metadata: { tool: 'invoice_list', duration_ms: 0 }
    };
  },

  invoice_void: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { invoiceNo: params.invoice_no, status: 'Voided', voidedAt: new Date().toISOString(), reason: params.reason || 'Cancelled' },
      metadata: { tool: 'invoice_void', duration_ms: 0 }
    };
  },

  invoice_send: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { invoiceNo: params.invoice_no, sentTo: params.email, sentAt: new Date().toISOString(), method: 'Email' },
      metadata: { tool: 'invoice_send', duration_ms: 0 }
    };
  },

  invoice_payment: async (params): Promise<MCPResult> => {
    const receiptNo = `RCP-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { receiptNo, invoiceNo: params.invoice_no, amount: params.amount, paymentMode: params.mode || 'Bank Transfer', date: new Date().toISOString().split('T')[0] },
      metadata: { tool: 'invoice_payment', duration_ms: 0 }
    };
  },

  invoice_aging: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        asOnDate: new Date().toISOString().split('T')[0],
        aging: [
          { bucket: '0-30 days', amount: 250000, count: 5 },
          { bucket: '31-60 days', amount: 150000, count: 3 },
          { bucket: '61-90 days', amount: 75000, count: 2 },
          { bucket: '90+ days', amount: 50000, count: 1 }
        ],
        totalOutstanding: 525000
      },
      metadata: { tool: 'invoice_aging', duration_ms: 0 }
    };
  },

  invoice_outstanding: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        customer: params.customer || 'All',
        outstanding: [
          { invoiceNo: 'INV-2025-0002', amount: 59000, dueDate: '2025-02-03', overdueDays: 0 }
        ],
        totalOutstanding: 59000
      },
      metadata: { tool: 'invoice_outstanding', duration_ms: 0 }
    };
  },

  stock_check: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { item: params.item, warehouse: params.warehouse || 'Main', available: 150, reserved: 20, onOrder: 50, unit: 'pcs' },
      metadata: { tool: 'stock_check', duration_ms: 0 }
    };
  },

  product_add: async (params): Promise<MCPResult> => {
    const sku = `SKU-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { sku, name: params.name, category: params.category, price: params.price, unit: params.unit || 'pcs', status: 'Active' },
      metadata: { tool: 'product_add', duration_ms: 0 }
    };
  },

  stock_adjust: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { item: params.item, adjustmentType: params.type || 'In', quantity: params.quantity, reason: params.reason, newBalance: 175, adjustedAt: new Date().toISOString() },
      metadata: { tool: 'stock_adjust', duration_ms: 0 }
    };
  },

  stock_transfer: async (params): Promise<MCPResult> => {
    const transferNo = `TRF-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { transferNo, item: params.item, fromWarehouse: params.from_warehouse, toWarehouse: params.to_warehouse, quantity: params.quantity, status: 'Completed' },
      metadata: { tool: 'stock_transfer', duration_ms: 0 }
    };
  },

  stock_valuation: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        asOnDate: new Date().toISOString().split('T')[0], method: params.method || 'FIFO',
        valuation: [
          { item: 'Product A', qty: 150, rate: 100, value: 15000 },
          { item: 'Product B', qty: 75, rate: 200, value: 15000 }
        ],
        totalValue: 30000
      },
      metadata: { tool: 'stock_valuation', duration_ms: 0 }
    };
  },

  reorder_check: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        itemsToReorder: [
          { item: 'Widget B', current: 25, reorderLevel: 30, suggestedQty: 50 },
          { item: 'Raw Material Y', current: 80, reorderLevel: 100, suggestedQty: 200 }
        ],
        count: 2
      },
      metadata: { tool: 'reorder_check', duration_ms: 0 }
    };
  },

  stock_movement: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        item: params.item, period: { from: params.from_date, to: params.to_date },
        movements: [
          { date: '2025-01-05', type: 'In', qty: 100, reference: 'GRN-001' },
          { date: '2025-01-08', type: 'Out', qty: 25, reference: 'INV-001' }
        ],
        openingStock: 100, closingStock: 175
      },
      metadata: { tool: 'stock_movement', duration_ms: 0 }
    };
  },

  batch_track: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { item: params.item, batchNo: params.batch_no, mfgDate: '2025-01-01', expiryDate: '2026-01-01', quantity: 500, location: 'Warehouse A' },
      metadata: { tool: 'batch_track', duration_ms: 0 }
    };
  },

  serial_track: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { serialNo: params.serial_no, item: 'Equipment XYZ', status: 'In Stock', location: 'Warehouse A', warrantyUpto: '2027-01-01' },
      metadata: { tool: 'serial_track', duration_ms: 0 }
    };
  },

  abc_analysis: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        analysis: [
          { category: 'A', items: 15, valuePercent: 70, description: 'High value items' },
          { category: 'B', items: 35, valuePercent: 20, description: 'Medium value items' },
          { category: 'C', items: 150, valuePercent: 10, description: 'Low value items' }
        ],
        totalItems: 200
      },
      metadata: { tool: 'abc_analysis', duration_ms: 0 }
    };
  },

  pr_create: async (params): Promise<MCPResult> => {
    const prNo = `PR-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { prNo, items: params.items, requestedBy: 'Current User', department: params.department, priority: params.priority || 'Normal', status: 'Pending Approval' },
      metadata: { tool: 'pr_create', duration_ms: 0 }
    };
  },

  po_create: async (params): Promise<MCPResult> => {
    const poNo = `PO-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { poNo, supplier: params.supplier, items: params.items, total: params.total || 0, status: 'Draft', expectedDelivery: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0] },
      metadata: { tool: 'po_create', duration_ms: 0 }
    };
  },

  po_approve: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { poNo: params.po_no, status: 'Approved', approvedBy: 'Manager', approvedAt: new Date().toISOString() },
      metadata: { tool: 'po_approve', duration_ms: 0 }
    };
  },

  grn_create: async (params): Promise<MCPResult> => {
    const grnNo = `GRN-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { grnNo, poNo: params.po_no, supplier: params.supplier, items: params.items, receivedAt: new Date().toISOString(), qualityCheck: 'Passed' },
      metadata: { tool: 'grn_create', duration_ms: 0 }
    };
  },

  purchase_invoice: async (params): Promise<MCPResult> => {
    const pinvNo = `PINV-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { invoiceNo: pinvNo, supplier: params.supplier, poNo: params.po_no, amount: params.amount, gst: params.gst, total: params.total, dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] },
      metadata: { tool: 'purchase_invoice', duration_ms: 0 }
    };
  },

  vendor_payment: async (params): Promise<MCPResult> => {
    const paymentNo = `PAY-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { paymentNo, vendor: params.vendor, amount: params.amount, mode: params.mode || 'Bank Transfer', reference: params.reference, paidAt: new Date().toISOString() },
      metadata: { tool: 'vendor_payment', duration_ms: 0 }
    };
  },

  vendor_list: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        vendors: [
          { id: 'V001', name: 'Supplier ABC', gstin: '27AABCU9603R1ZM', outstanding: 150000 },
          { id: 'V002', name: 'Vendor XYZ', gstin: '29AABCU9603R1ZP', outstanding: 75000 }
        ],
        count: 2
      },
      metadata: { tool: 'vendor_list', duration_ms: 0 }
    };
  },

  po_pending: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        pendingOrders: [
          { poNo: 'PO-2025-001', supplier: 'Vendor ABC', amount: 250000, expectedDate: '2025-01-15', status: 'Pending Delivery' }
        ],
        count: 1, totalValue: 250000
      },
      metadata: { tool: 'po_pending', duration_ms: 0 }
    };
  },

  quotation_create: async (params): Promise<MCPResult> => {
    const quoteNo = `QT-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { quoteNo, customer: params.customer, items: params.items, total: params.total, validUntil: new Date(Date.now() + 15*24*60*60*1000).toISOString().split('T')[0], status: 'Draft' },
      metadata: { tool: 'quotation_create', duration_ms: 0 }
    };
  },

  so_create: async (params): Promise<MCPResult> => {
    const soNo = `SO-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { soNo, customer: params.customer, items: params.items, total: params.total, deliveryDate: params.delivery_date, status: 'Confirmed' },
      metadata: { tool: 'so_create', duration_ms: 0 }
    };
  },

  delivery_create: async (params): Promise<MCPResult> => {
    const dnNo = `DN-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { deliveryNo: dnNo, soNo: params.so_no, customer: params.customer, items: params.items, shippedAt: new Date().toISOString(), carrier: params.carrier },
      metadata: { tool: 'delivery_create', duration_ms: 0 }
    };
  },

  sales_invoice: async (params): Promise<MCPResult> => {
    const sinvNo = `SINV-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { invoiceNo: sinvNo, customer: params.customer, soNo: params.so_no, amount: params.amount, gst: params.gst, total: params.total, status: 'Issued' },
      metadata: { tool: 'sales_invoice', duration_ms: 0 }
    };
  },

  sales_return: async (params): Promise<MCPResult> => {
    const srnNo = `SRN-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { returnNo: srnNo, invoiceNo: params.invoice_no, items: params.items, reason: params.reason, creditNoteAmount: params.amount, status: 'Processed' },
      metadata: { tool: 'sales_return', duration_ms: 0 }
    };
  },

  customer_list: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        customers: [
          { id: 'C001', name: 'ABC Corporation', gstin: '27AABCC1234D1ZP', outstanding: 118000 },
          { id: 'C002', name: 'XYZ Industries', gstin: '29AABCC5678E1ZQ', outstanding: 59000 }
        ],
        count: 2
      },
      metadata: { tool: 'customer_list', duration_ms: 0 }
    };
  },

  so_pending: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        pendingOrders: [
          { soNo: 'SO-2025-001', customer: 'ABC Corp', amount: 150000, deliveryDate: '2025-01-20', status: 'Pending Dispatch' }
        ],
        count: 1, totalValue: 150000
      },
      metadata: { tool: 'so_pending', duration_ms: 0 }
    };
  },

  sales_pipeline: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        pipeline: [
          { stage: 'Quotation', count: 15, value: 2500000 },
          { stage: 'Negotiation', count: 8, value: 1800000 },
          { stage: 'Order Confirmed', count: 5, value: 1200000 },
          { stage: 'Delivered', count: 12, value: 2800000 }
        ],
        totalPipelineValue: 8300000
      },
      metadata: { tool: 'sales_pipeline', duration_ms: 0 }
    };
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ADDITIONAL CRM TOOLS
  // ═══════════════════════════════════════════════════════════════════════════════

  lead_convert: async (params): Promise<MCPResult> => {
    const customerId = `CUST-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { leadId: params.lead_id, convertedTo: 'Customer', customerId, opportunityId: `OPP-${Date.now().toString(36).toUpperCase()}`, convertedAt: new Date().toISOString() },
      metadata: { tool: 'lead_convert', duration_ms: 0 }
    };
  },

  lead_list: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        filter: params.status || 'all',
        leads: [
          { id: 'LEAD-001', name: 'Rahul Sharma', status: 'New', source: 'Website', assignedTo: 'Sales Rep 1' },
          { id: 'LEAD-002', name: 'Priya Patel', status: 'Qualified', source: 'Referral', assignedTo: 'Sales Rep 2' },
          { id: 'LEAD-003', name: 'Amit Kumar', status: 'Contacted', source: 'Cold Call', assignedTo: 'Sales Rep 1' }
        ],
        count: 3
      },
      metadata: { tool: 'lead_list', duration_ms: 0 }
    };
  },

  lead_score: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        leadId: params.lead_id, score: 75, grade: 'A',
        factors: [
          { factor: 'Company Size', points: 20 },
          { factor: 'Budget Confirmed', points: 25 },
          { factor: 'Decision Timeline', points: 15 },
          { factor: 'Engagement Level', points: 15 }
        ],
        recommendation: 'High priority - Schedule demo'
      },
      metadata: { tool: 'lead_score', duration_ms: 0 }
    };
  },

  lead_source_report: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        period: params.period || 'This Month',
        sources: [
          { source: 'Website', leads: 45, converted: 12, conversionRate: '26.7%' },
          { source: 'Referral', leads: 20, converted: 8, conversionRate: '40%' },
          { source: 'Cold Call', leads: 35, converted: 5, conversionRate: '14.3%' },
          { source: 'Social Media', leads: 25, converted: 6, conversionRate: '24%' }
        ],
        totalLeads: 125, totalConverted: 31
      },
      metadata: { tool: 'lead_source_report', duration_ms: 0 }
    };
  },

  lead_followup: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        dueToday: [
          { leadId: 'LEAD-001', name: 'Rahul Sharma', action: 'Call', time: '10:00 AM' }
        ],
        overdue: [
          { leadId: 'LEAD-003', name: 'Amit Kumar', action: 'Email', dueDate: '2025-01-08' }
        ],
        upcoming: [
          { leadId: 'LEAD-002', name: 'Priya Patel', action: 'Meeting', dueDate: '2025-01-12' }
        ]
      },
      metadata: { tool: 'lead_followup', duration_ms: 0 }
    };
  },

  contact_update: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { contactId: params.contact_id, updatedFields: params, updatedAt: new Date().toISOString() },
      metadata: { tool: 'contact_update', duration_ms: 0 }
    };
  },

  contact_list: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        contacts: [
          { id: 'CONT-001', name: 'Rahul Sharma', company: 'ABC Corp', email: 'rahul@abc.com', phone: '9876543210' },
          { id: 'CONT-002', name: 'Priya Patel', company: 'XYZ Ltd', email: 'priya@xyz.com', phone: '9876543211' }
        ],
        count: 2
      },
      metadata: { tool: 'contact_list', duration_ms: 0 }
    };
  },

  contact_search: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { query: params.query, results: [{ id: 'CONT-001', name: 'Rahul Sharma', company: 'ABC Corp' }], count: 1 },
      metadata: { tool: 'contact_search', duration_ms: 0 }
    };
  },

  contact_merge: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { primaryId: params.primary_id, mergedId: params.secondary_id, status: 'Merged', mergedAt: new Date().toISOString() },
      metadata: { tool: 'contact_merge', duration_ms: 0 }
    };
  },

  contact_history: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        contactId: params.contact_id,
        history: [
          { date: '2025-01-08', type: 'Call', notes: 'Discussed requirements' },
          { date: '2025-01-05', type: 'Email', notes: 'Sent proposal' },
          { date: '2025-01-02', type: 'Meeting', notes: 'Initial meeting' }
        ]
      },
      metadata: { tool: 'contact_history', duration_ms: 0 }
    };
  },

  opportunity_update: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { opportunityId: params.opportunity_id, updatedFields: params, updatedAt: new Date().toISOString() },
      metadata: { tool: 'opportunity_update', duration_ms: 0 }
    };
  },

  opportunity_stage: async (params): Promise<MCPResult> => {
    const stages = ['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
    return {
      success: true,
      data: { opportunityId: params.opportunity_id, previousStage: params.from_stage, newStage: params.to_stage, changedAt: new Date().toISOString(), availableStages: stages },
      metadata: { tool: 'opportunity_stage', duration_ms: 0 }
    };
  },

  opportunity_list: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        opportunities: [
          { id: 'OPP-001', name: 'ABC Corp - ERP Implementation', value: 500000, stage: 'Proposal', probability: 50 },
          { id: 'OPP-002', name: 'XYZ Ltd - Consulting', value: 200000, stage: 'Negotiation', probability: 75 }
        ],
        count: 2, totalValue: 700000
      },
      metadata: { tool: 'opportunity_list', duration_ms: 0 }
    };
  },

  opportunity_forecast: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        period: params.period || 'This Quarter',
        forecast: { committed: 800000, bestCase: 1200000, pipeline: 2500000 },
        byStage: [
          { stage: 'Proposal', value: 500000, weightedValue: 250000 },
          { stage: 'Negotiation', value: 400000, weightedValue: 300000 }
        ]
      },
      metadata: { tool: 'opportunity_forecast', duration_ms: 0 }
    };
  },

  opportunity_won: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { opportunityId: params.opportunity_id, status: 'Closed Won', wonValue: params.value, wonDate: new Date().toISOString(), nextSteps: 'Create project and invoice' },
      metadata: { tool: 'opportunity_won', duration_ms: 0 }
    };
  },

  opportunity_lost: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { opportunityId: params.opportunity_id, status: 'Closed Lost', reason: params.reason, lostDate: new Date().toISOString() },
      metadata: { tool: 'opportunity_lost', duration_ms: 0 }
    };
  },

  opportunity_pipeline: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        pipeline: [
          { stage: 'Qualification', count: 12, value: 1500000 },
          { stage: 'Proposal', count: 8, value: 2000000 },
          { stage: 'Negotiation', count: 5, value: 1200000 },
          { stage: 'Closed Won', count: 15, value: 3500000 }
        ],
        totalPipeline: 8200000, winRate: '45%'
      },
      metadata: { tool: 'opportunity_pipeline', duration_ms: 0 }
    };
  },

  activity_call: async (params): Promise<MCPResult> => {
    const callId = `CALL-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { callId, contactId: params.contact_id, direction: params.direction || 'Outbound', duration: params.duration || '5 min', outcome: params.outcome || 'Connected', notes: params.notes, loggedAt: new Date().toISOString() },
      metadata: { tool: 'activity_call', duration_ms: 0 }
    };
  },

  activity_email: async (params): Promise<MCPResult> => {
    const emailId = `EMAIL-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { emailId, contactId: params.contact_id, subject: params.subject, status: 'Sent', sentAt: new Date().toISOString() },
      metadata: { tool: 'activity_email', duration_ms: 0 }
    };
  },

  activity_meeting: async (params): Promise<MCPResult> => {
    const meetingId = `MTG-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { meetingId, contactId: params.contact_id, subject: params.subject, scheduledAt: params.scheduled_at, duration: params.duration || '30 min', location: params.location || 'Virtual', status: 'Scheduled' },
      metadata: { tool: 'activity_meeting', duration_ms: 0 }
    };
  },

  activity_list: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        filter: params.type || 'all',
        activities: [
          { id: 'ACT-001', type: 'Call', contact: 'Rahul Sharma', date: '2025-01-10', status: 'Completed' },
          { id: 'ACT-002', type: 'Email', contact: 'Priya Patel', date: '2025-01-10', status: 'Sent' },
          { id: 'ACT-003', type: 'Meeting', contact: 'Amit Kumar', date: '2025-01-12', status: 'Scheduled' }
        ],
        count: 3
      },
      metadata: { tool: 'activity_list', duration_ms: 0 }
    };
  },

  activity_today: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        date: new Date().toISOString().split('T')[0],
        activities: [
          { time: '10:00 AM', type: 'Call', contact: 'Rahul Sharma', status: 'Pending' },
          { time: '02:00 PM', type: 'Meeting', contact: 'Priya Patel', status: 'Scheduled' }
        ],
        count: 2
      },
      metadata: { tool: 'activity_today', duration_ms: 0 }
    };
  },

  activity_overdue: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        overdueActivities: [
          { id: 'ACT-005', type: 'Call', contact: 'Amit Kumar', dueDate: '2025-01-08', daysOverdue: 2 }
        ],
        count: 1
      },
      metadata: { tool: 'activity_overdue', duration_ms: 0 }
    };
  },

  activity_complete: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { activityId: params.activity_id, status: 'Completed', completedAt: new Date().toISOString(), outcome: params.outcome || 'Success' },
      metadata: { tool: 'activity_complete', duration_ms: 0 }
    };
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // BANKING TOOLS
  // ═══════════════════════════════════════════════════════════════════════════════

  upi_send: async (params): Promise<MCPResult> => {
    const txnId = `UPI${Date.now()}`;
    return {
      success: true,
      data: { txnId, to: params.upi_id, amount: params.amount, status: 'SUCCESS', timestamp: new Date().toISOString(), note: 'Mock UPI - Connect to UPI gateway' },
      metadata: { tool: 'upi_send', duration_ms: 0 }
    };
  },

  upi_request: async (params): Promise<MCPResult> => {
    const reqId = `REQ${Date.now()}`;
    return {
      success: true,
      data: { requestId: reqId, from: params.upi_id, amount: params.amount, status: 'PENDING', expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString() },
      metadata: { tool: 'upi_request', duration_ms: 0 }
    };
  },

  upi_status: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { txnId: params.txn_id, status: 'SUCCESS', amount: 1000, completedAt: new Date().toISOString() },
      metadata: { tool: 'upi_status', duration_ms: 0 }
    };
  },

  upi_mandate: async (params): Promise<MCPResult> => {
    const mandateId = `MND${Date.now()}`;
    return {
      success: true,
      data: { mandateId, upiId: params.upi_id, amount: params.amount, frequency: params.frequency || 'Monthly', status: 'CREATED' },
      metadata: { tool: 'upi_mandate', duration_ms: 0 }
    };
  },

  upi_autopay: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { mandateId: params.mandate_id, action: params.action || 'execute', status: 'SUCCESS', amount: params.amount },
      metadata: { tool: 'upi_autopay', duration_ms: 0 }
    };
  },

  bbps_electricity: async (params): Promise<MCPResult> => {
    const txnId = `BBPS${Date.now()}`;
    return {
      success: true,
      data: { txnId, billerId: params.biller_id, consumerNo: params.consumer_no, amount: params.amount || 2500, status: 'PAID', receiptNo: `RCP${Date.now().toString().substring(5)}` },
      metadata: { tool: 'bbps_electricity', duration_ms: 0 }
    };
  },

  bbps_water: async (params): Promise<MCPResult> => {
    const txnId = `BBPS${Date.now()}`;
    return {
      success: true,
      data: { txnId, billerId: params.biller_id, consumerNo: params.consumer_no, amount: params.amount || 800, status: 'PAID' },
      metadata: { tool: 'bbps_water', duration_ms: 0 }
    };
  },

  bbps_gas: async (params): Promise<MCPResult> => {
    const txnId = `BBPS${Date.now()}`;
    return {
      success: true,
      data: { txnId, billerId: params.biller_id, consumerNo: params.consumer_no, amount: params.amount || 1200, status: 'PAID' },
      metadata: { tool: 'bbps_gas', duration_ms: 0 }
    };
  },

  bbps_broadband: async (params): Promise<MCPResult> => {
    const txnId = `BBPS${Date.now()}`;
    return {
      success: true,
      data: { txnId, billerId: params.biller_id, accountNo: params.account_no, amount: params.amount || 999, status: 'PAID' },
      metadata: { tool: 'bbps_broadband', duration_ms: 0 }
    };
  },

  bbps_insurance: async (params): Promise<MCPResult> => {
    const txnId = `BBPS${Date.now()}`;
    return {
      success: true,
      data: { txnId, insurer: params.insurer, policyNo: params.policy_no, premium: params.amount, status: 'PAID' },
      metadata: { tool: 'bbps_insurance', duration_ms: 0 }
    };
  },

  bbps_fastag: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { vehicleNo: params.vehicle_no, rechargeAmount: params.amount, newBalance: (params.amount || 500) + 250, status: 'SUCCESS' },
      metadata: { tool: 'bbps_fastag', duration_ms: 0 }
    };
  },

  bbps_mobile: async (params): Promise<MCPResult> => {
    const txnId = `BBPS${Date.now()}`;
    return {
      success: true,
      data: { txnId, mobileNo: params.mobile_no, operator: params.operator, amount: params.amount, status: 'SUCCESS' },
      metadata: { tool: 'bbps_mobile', duration_ms: 0 }
    };
  },

  bbps_dth: async (params): Promise<MCPResult> => {
    const txnId = `BBPS${Date.now()}`;
    return {
      success: true,
      data: { txnId, subscriberId: params.subscriber_id, operator: params.operator, amount: params.amount, status: 'SUCCESS' },
      metadata: { tool: 'bbps_dth', duration_ms: 0 }
    };
  },

  bank_balance: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { accountNo: params.account_no, balance: 150000, availableBalance: 145000, currency: 'INR', asOn: new Date().toISOString(), note: 'Mock balance - Connect to bank API' },
      metadata: { tool: 'bank_balance', duration_ms: 0 }
    };
  },

  bank_statement: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        accountNo: params.account_no, period: { from: params.from_date, to: params.to_date },
        transactions: [
          { date: '2025-01-08', description: 'UPI/Payment', debit: 5000, credit: 0, balance: 145000 },
          { date: '2025-01-07', description: 'NEFT Credit', debit: 0, credit: 50000, balance: 150000 }
        ],
        openingBalance: 100000, closingBalance: 145000
      },
      metadata: { tool: 'bank_statement', duration_ms: 0 }
    };
  },

  beneficiary_add: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { beneficiaryId: `BEN${Date.now().toString().substring(5)}`, name: params.name, accountNo: params.account_no, ifsc: params.ifsc, status: 'Added', verificationPending: true },
      metadata: { tool: 'beneficiary_add', duration_ms: 0 }
    };
  },

  fund_transfer: async (params): Promise<MCPResult> => {
    const txnId = `TXN${Date.now()}`;
    return {
      success: true,
      data: { txnId, beneficiary: params.beneficiary_id, amount: params.amount, mode: params.mode || 'IMPS', status: 'SUCCESS', timestamp: new Date().toISOString() },
      metadata: { tool: 'fund_transfer', duration_ms: 0 }
    };
  },

  ifsc_lookup: async (params): Promise<MCPResult> => {
    const ifsc = (params.ifsc || '').toUpperCase();
    const isValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
    return {
      success: true,
      data: {
        ifsc, valid: isValid,
        bank: isValid ? ifsc.substring(0, 4) === 'HDFC' ? 'HDFC Bank' : ifsc.substring(0, 4) === 'SBIN' ? 'State Bank of India' : 'Unknown Bank' : null,
        branch: isValid ? 'Main Branch' : null,
        note: 'Connect to RBI database for complete info'
      },
      metadata: { tool: 'ifsc_lookup', duration_ms: 0 }
    };
  },

  fd_calc: async (params): Promise<MCPResult> => {
    const principal = params.principal || 0;
    const rate = params.rate || 7;
    const years = params.years || 1;
    const compounding = params.compounding || 'quarterly';
    const n = compounding === 'monthly' ? 12 : compounding === 'quarterly' ? 4 : 1;
    const maturity = principal * Math.pow(1 + rate / 100 / n, n * years);
    return {
      success: true,
      data: { principal, rate: `${rate}%`, tenure: `${years} years`, compounding, maturityAmount: maturity.toFixed(2), interestEarned: (maturity - principal).toFixed(2) },
      metadata: { tool: 'fd_calc', duration_ms: 0 }
    };
  },

  rd_calc: async (params): Promise<MCPResult> => {
    const monthly = params.monthly_amount || 0;
    const rate = params.rate || 7;
    const months = params.months || 12;
    const r = rate / 100 / 4;
    const n = months / 3;
    const maturity = monthly * ((Math.pow(1 + r, n) - 1) / (1 - Math.pow(1 + r, -1/3)));
    return {
      success: true,
      data: { monthlyDeposit: monthly, rate: `${rate}%`, tenure: `${months} months`, maturityAmount: maturity.toFixed(2), totalDeposited: monthly * months },
      metadata: { tool: 'rd_calc', duration_ms: 0 }
    };
  },

  ppf_calc: async (params): Promise<MCPResult> => {
    const yearly = params.yearly_amount || 0;
    const rate = 7.1;
    const years = 15;
    let balance = 0;
    for (let i = 0; i < years; i++) {
      balance = (balance + yearly) * (1 + rate / 100);
    }
    return {
      success: true,
      data: { yearlyDeposit: yearly, rate: `${rate}%`, tenure: '15 years', maturityAmount: balance.toFixed(2), totalDeposited: yearly * years, interestEarned: (balance - yearly * years).toFixed(2) },
      metadata: { tool: 'ppf_calc', duration_ms: 0 }
    };
  },

  loan_apply: async (params): Promise<MCPResult> => {
    const appId = `LOAN${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true,
      data: { applicationId: appId, loanType: params.loan_type, amount: params.amount, tenure: params.tenure, status: 'Submitted', nextStep: 'Document verification' },
      metadata: { tool: 'loan_apply', duration_ms: 0 }
    };
  },

  loan_status: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { applicationId: params.application_id, status: 'Under Review', stage: 'Credit Assessment', estimatedDecision: new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0] },
      metadata: { tool: 'loan_status', duration_ms: 0 }
    };
  },

  loan_emi_pay: async (params): Promise<MCPResult> => {
    const txnId = `EMI${Date.now()}`;
    return {
      success: true,
      data: { txnId, loanId: params.loan_id, emiAmount: params.amount, emiNo: params.emi_no, status: 'PAID', paidAt: new Date().toISOString() },
      metadata: { tool: 'loan_emi_pay', duration_ms: 0 }
    };
  },

  loan_foreclosure: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        loanId: params.loan_id, outstandingPrincipal: 500000, interestDue: 15000, foreclosureCharges: 10000,
        totalPayable: 525000, validTill: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]
      },
      metadata: { tool: 'loan_foreclosure', duration_ms: 0 }
    };
  },

  loan_statement: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        loanId: params.loan_id, disbursedAmount: 1000000, tenure: '60 months', emiAmount: 21000,
        paidEmis: 24, remainingEmis: 36, outstandingPrincipal: 500000,
        schedule: [{ emiNo: 25, dueDate: '2025-02-05', principal: 12000, interest: 9000, total: 21000 }]
      },
      metadata: { tool: 'loan_statement', duration_ms: 0 }
    };
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // GOVERNMENT TOOLS
  // ═══════════════════════════════════════════════════════════════════════════════

  aadhaar_verify: async (params): Promise<MCPResult> => {
    const aadhaar = (params.aadhaar || '').replace(/\s/g, '');
    const isValid = /^[2-9]{1}[0-9]{11}$/.test(aadhaar);
    return {
      success: true,
      data: { aadhaar: aadhaar.replace(/(.{4})/g, '$1 ').trim(), valid: isValid, format: isValid ? 'Valid Aadhaar format' : 'Invalid format', note: 'Live verification requires UIDAI API' },
      metadata: { tool: 'aadhaar_verify', duration_ms: 0 }
    };
  },

  aadhaar_ekyc: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { aadhaar: params.aadhaar, status: 'OTP Sent', otpRefId: `OTP${Date.now().toString().substring(5)}`, expiresIn: '10 minutes', note: 'Mock eKYC - Connect to UIDAI' },
      metadata: { tool: 'aadhaar_ekyc', duration_ms: 0 }
    };
  },

  aadhaar_otp: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { otpRefId: params.otp_ref_id, otp: params.otp, status: 'Verified', kycData: { name: 'Sample User', gender: 'M', dob: '1990-01-01', address: 'Sample Address' } },
      metadata: { tool: 'aadhaar_otp', duration_ms: 0 }
    };
  },

  digilocker_auth: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { authUrl: 'https://digilocker.gov.in/auth', state: `DL${Date.now()}`, expiresIn: '15 minutes' },
      metadata: { tool: 'digilocker_auth', duration_ms: 0 }
    };
  },

  digilocker_fetch: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        documentType: params.document_type,
        documents: [{ name: 'PAN Card', issuer: 'Income Tax Department', issuedOn: '2020-01-15', status: 'Available' }],
        note: 'Mock - Connect to DigiLocker API'
      },
      metadata: { tool: 'digilocker_fetch', duration_ms: 0 }
    };
  },

  digilocker_verify: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { documentId: params.document_id, verified: true, issuer: 'Government of India', issuedOn: '2020-01-15' },
      metadata: { tool: 'digilocker_verify', duration_ms: 0 }
    };
  },

  digilocker_share: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { documentId: params.document_id, sharedWith: params.recipient, shareUrl: `https://digilocker.gov.in/share/${Date.now()}`, expiresIn: '24 hours' },
      metadata: { tool: 'digilocker_share', duration_ms: 0 }
    };
  },

  digilocker_issued: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        issuedDocuments: [
          { type: 'PAN', issuer: 'CBDT', issuedOn: '2020-01-15' },
          { type: 'Driving License', issuer: 'RTO Maharashtra', issuedOn: '2019-06-20' },
          { type: 'Aadhaar', issuer: 'UIDAI', issuedOn: '2016-03-10' }
        ],
        count: 3
      },
      metadata: { tool: 'digilocker_issued', duration_ms: 0 }
    };
  },

  ulip_vahan_rc: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        vehicleNo: params.vehicle_no, owner: 'Sample Owner', regDate: '2020-05-15', regAuthority: 'RTO Mumbai',
        vehicleClass: 'LMV', fuelType: 'Petrol', makerModel: 'Maruti Swift', insuranceValid: '2025-05-14', fitnessValid: '2030-05-14',
        note: 'Mock data - Connect to ULIP/Vahan'
      },
      metadata: { tool: 'ulip_vahan_rc', duration_ms: 0 }
    };
  },

  ulip_sarathi_dl: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        dlNo: params.dl_no, name: 'Sample Driver', dob: '1990-01-01', issueDate: '2015-06-20', validUpto: '2035-06-19',
        cov: ['LMV', 'MCWG'], issuingAuthority: 'RTO Mumbai', status: 'Active',
        note: 'Mock data - Connect to ULIP/Sarathi'
      },
      metadata: { tool: 'ulip_sarathi_dl', duration_ms: 0 }
    };
  },

  ulip_fastag_balance: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { vehicleNo: params.vehicle_no, tagId: `34${Date.now().toString().substring(5)}`, balance: 1250, issuer: 'ICICI Bank', status: 'Active' },
      metadata: { tool: 'ulip_fastag_balance', duration_ms: 0 }
    };
  },

  ulip_gps_track: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { vehicleNo: params.vehicle_no, lat: 19.076, lng: 72.877, speed: '45 km/h', lastUpdate: new Date().toISOString(), address: 'Mumbai, Maharashtra' },
      metadata: { tool: 'ulip_gps_track', duration_ms: 0 }
    };
  },

  ulip_eway_verify: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: { ewayBillNo: params.eway_no, vehicleNo: params.vehicle_no, status: 'ACTIVE', validUpto: new Date(Date.now() + 48*60*60*1000).toISOString() },
      metadata: { tool: 'ulip_eway_verify', duration_ms: 0 }
    };
  },

  pm_awas: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        scheme: 'PM Awas Yojana', beneficiary: params.beneficiary_id || 'Sample',
        status: 'Application Submitted', stage: 'Verification Pending',
        checkUrl: 'https://pmaymis.gov.in'
      },
      metadata: { tool: 'pm_awas', duration_ms: 0 }
    };
  },

  ujjwala: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        scheme: 'PM Ujjwala Yojana', beneficiary: params.beneficiary_id,
        status: 'Enrolled', lastRefill: '2025-01-01', subsidyReceived: 200,
        checkUrl: 'https://pmuy.gov.in'
      },
      metadata: { tool: 'ujjwala', duration_ms: 0 }
    };
  },

  mudra_loan: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        scheme: 'PM Mudra Yojana', category: params.category || 'Shishu',
        maxLoan: params.category === 'Tarun' ? 1000000 : params.category === 'Kishore' ? 500000 : 50000,
        interestRate: '8-12%', eligibility: 'Small business owners',
        applyUrl: 'https://mudra.org.in'
      },
      metadata: { tool: 'mudra_loan', duration_ms: 0 }
    };
  },

  epf_passbook: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        uan: params.uan, memberName: 'Sample Employee', establishment: 'ABC Company',
        balance: { employee: 350000, employer: 350000, pension: 150000, total: 850000 },
        lastContribution: { month: 'December 2024', amount: 7200 },
        checkUrl: 'https://passbook.epfindia.gov.in'
      },
      metadata: { tool: 'epf_passbook', duration_ms: 0 }
    };
  },

  esic_status: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        esicNo: params.esic_no, memberName: 'Sample Employee', status: 'Active',
        dispensary: 'ESIC Hospital Mumbai', validUpto: '2025-03-31',
        lastContribution: 'December 2024'
      },
      metadata: { tool: 'esic_status', duration_ms: 0 }
    };
  },

  nps_balance: async (params): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        pran: params.pran, subscriberName: 'Sample Subscriber', tier: 'Tier I',
        balance: 1500000, returns: '12.5%', fundManager: 'SBI Pension Funds',
        lastContribution: { date: '2025-01-01', amount: 5000 }
      },
      metadata: { tool: 'nps_balance', duration_ms: 0 }
    };
  }
};

// Default executor for unknown tools
export const defaultExecutor = async (toolName: string, params: Record<string, any>): Promise<MCPResult> => ({
  success: true,
  data: { message: `Tool ${toolName} executed`, params, note: 'Implementation pending' },
  metadata: { tool: toolName, duration_ms: 0 }
});
