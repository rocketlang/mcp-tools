/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BANI-MCP BRIDGE v1.0
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Connects BANI's 40+ working tools to MCP protocol
 * This makes all Swayam tools available via MCP standard interface
 *
 * 🙏 Jai Guru Ji | ANKR Labs | PowerBox IT Solutions Pvt Ltd
 */

import type { MCPTool, MCPParameter, MCPResult } from '../types';
import { TOOL_EXECUTORS, defaultExecutor } from './bani-executor';

// Tool definitions matching BANI's unified router
export const BANI_TOOLS: Record<string, {
  name: string;
  description: string;
  descriptionHi: string;
  category: string;
  parameters: MCPParameter[];
  voiceTriggers: string[];
}> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // 📋 COMPLIANCE TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  gst_verify: {
    name: 'gst_verify',
    description: 'Verify GSTIN number and get business details',
    descriptionHi: 'GSTIN नंबर verify करें और business details पाएं',
    category: 'compliance',
    parameters: [
      { name: 'gstin', type: 'string', description: 'GSTIN number (15 chars)', required: true }
    ],
    voiceTriggers: ['verify gstin', 'gstin check', 'जीएसटी वेरीफाई', 'gstin verify करो']
  },
  gst_calc: {
    name: 'gst_calc',
    description: 'Calculate GST on amount',
    descriptionHi: 'Amount पर GST calculate करें',
    category: 'compliance',
    parameters: [
      { name: 'amount', type: 'number', description: 'Base amount', required: true },
      { name: 'rate', type: 'number', description: 'GST rate (5, 12, 18, 28)', required: false }
    ],
    voiceTriggers: ['gst calculate', 'gst kitna', 'जीएसटी कैलकुलेट', 'टैक्स कितना']
  },
  hsn_lookup: {
    name: 'hsn_lookup',
    description: 'Lookup HSN/SAC code for product/service',
    descriptionHi: 'Product/service का HSN/SAC code खोजें',
    category: 'compliance',
    parameters: [
      { name: 'query', type: 'string', description: 'Product or service name', required: true }
    ],
    voiceTriggers: ['hsn code', 'sac code', 'एचएसएन कोड']
  },
  pan_verify: {
    name: 'pan_verify',
    description: 'Verify PAN card number',
    descriptionHi: 'PAN card number verify करें',
    category: 'compliance',
    parameters: [
      { name: 'pan', type: 'string', description: 'PAN number (10 chars)', required: true }
    ],
    voiceTriggers: ['pan verify', 'pan check', 'पैन वेरीफाई']
  },
  vehicle_verify: {
    name: 'vehicle_verify',
    description: 'Verify vehicle RC details via Vahan',
    descriptionHi: 'Vehicle RC details verify करें',
    category: 'compliance',
    parameters: [
      { name: 'vehicle_number', type: 'string', description: 'Vehicle registration number', required: true }
    ],
    voiceTriggers: ['vehicle verify', 'rc check', 'गाड़ी वेरीफाई', 'वाहन चेक']
  },
  income_tax: {
    name: 'income_tax',
    description: 'Calculate income tax',
    descriptionHi: 'Income tax calculate करें',
    category: 'compliance',
    parameters: [
      { name: 'income', type: 'number', description: 'Annual income', required: true },
      { name: 'regime', type: 'string', description: 'old or new regime', required: false }
    ],
    voiceTriggers: ['income tax', 'tax calculate', 'आयकर', 'इनकम टैक्स']
  },
  tds_calc: {
    name: 'tds_calc',
    description: 'Calculate TDS on payment',
    descriptionHi: 'Payment पर TDS calculate करें',
    category: 'compliance',
    parameters: [
      { name: 'amount', type: 'number', description: 'Payment amount', required: true },
      { name: 'section', type: 'string', description: 'TDS section (194J, 194C, etc)', required: false }
    ],
    voiceTriggers: ['tds calculate', 'टीडीएस कितना', 'tds kitna']
  },

  // GST Return Filing Tools
  gstr1_prepare: {
    name: 'gstr1_prepare',
    description: 'Prepare GSTR-1 outward supplies return',
    descriptionHi: 'GSTR-1 return तैयार करें',
    category: 'compliance',
    parameters: [
      { name: 'gstin', type: 'string', description: 'GSTIN number', required: true },
      { name: 'period', type: 'string', description: 'Return period (e.g., 012024 for Jan 2024)', required: true }
    ],
    voiceTriggers: ['gstr1 prepare', 'gstr1 तैयार', 'prepare gstr1']
  },
  gstr1_file: {
    name: 'gstr1_file',
    description: 'File GSTR-1 return',
    descriptionHi: 'GSTR-1 file करें',
    category: 'compliance',
    parameters: [
      { name: 'gstin', type: 'string', description: 'GSTIN number', required: true },
      { name: 'period', type: 'string', description: 'Return period', required: true },
      { name: 'otp', type: 'string', description: 'EVC OTP for filing', required: false }
    ],
    voiceTriggers: ['gstr1 file', 'gstr1 जमा', 'file gstr1']
  },
  gstr2a_fetch: {
    name: 'gstr2a_fetch',
    description: 'Fetch GSTR-2A auto-drafted inward supplies',
    descriptionHi: 'GSTR-2A data लाएं',
    category: 'compliance',
    parameters: [
      { name: 'gstin', type: 'string', description: 'GSTIN number', required: true },
      { name: 'period', type: 'string', description: 'Return period', required: true }
    ],
    voiceTriggers: ['gstr2a fetch', 'gstr2a data', '2a लाओ']
  },
  gstr2b_fetch: {
    name: 'gstr2b_fetch',
    description: 'Fetch GSTR-2B ITC statement',
    descriptionHi: 'GSTR-2B ITC statement लाएं',
    category: 'compliance',
    parameters: [
      { name: 'gstin', type: 'string', description: 'GSTIN number', required: true },
      { name: 'period', type: 'string', description: 'Return period', required: true }
    ],
    voiceTriggers: ['gstr2b fetch', 'gstr2b itc', '2b लाओ']
  },
  gstr3b_prepare: {
    name: 'gstr3b_prepare',
    description: 'Prepare GSTR-3B summary return',
    descriptionHi: 'GSTR-3B तैयार करें',
    category: 'compliance',
    parameters: [
      { name: 'gstin', type: 'string', description: 'GSTIN number', required: true },
      { name: 'period', type: 'string', description: 'Return period', required: true }
    ],
    voiceTriggers: ['gstr3b prepare', 'gstr3b तैयार', '3b prepare']
  },
  gstr3b_file: {
    name: 'gstr3b_file',
    description: 'File GSTR-3B return with payment',
    descriptionHi: 'GSTR-3B file करें',
    category: 'compliance',
    parameters: [
      { name: 'gstin', type: 'string', description: 'GSTIN number', required: true },
      { name: 'period', type: 'string', description: 'Return period', required: true },
      { name: 'payment_mode', type: 'string', description: 'Payment mode (cash/itc)', required: false }
    ],
    voiceTriggers: ['gstr3b file', 'gstr3b जमा', '3b file']
  },
  itc_check: {
    name: 'itc_check',
    description: 'Check ITC eligibility and reconciliation',
    descriptionHi: 'ITC eligibility check करें',
    category: 'compliance',
    parameters: [
      { name: 'gstin', type: 'string', description: 'GSTIN number', required: true },
      { name: 'period', type: 'string', description: 'Return period', required: true }
    ],
    voiceTriggers: ['itc check', 'itc eligible', 'आईटीसी चेक']
  },
  eway_generate: {
    name: 'eway_generate',
    description: 'Generate E-Way Bill for goods movement',
    descriptionHi: 'E-Way Bill बनाएं',
    category: 'compliance',
    parameters: [
      { name: 'from_gstin', type: 'string', description: 'Consignor GSTIN', required: true },
      { name: 'to_gstin', type: 'string', description: 'Consignee GSTIN', required: true },
      { name: 'invoice_no', type: 'string', description: 'Invoice number', required: true },
      { name: 'invoice_value', type: 'number', description: 'Invoice value', required: true },
      { name: 'vehicle_no', type: 'string', description: 'Vehicle number', required: false }
    ],
    voiceTriggers: ['eway bill', 'e-way generate', 'ई-वे बनाओ']
  },
  einvoice_generate: {
    name: 'einvoice_generate',
    description: 'Generate E-Invoice with IRN',
    descriptionHi: 'E-Invoice बनाएं',
    category: 'compliance',
    parameters: [
      { name: 'gstin', type: 'string', description: 'Supplier GSTIN', required: true },
      { name: 'invoice_no', type: 'string', description: 'Invoice number', required: true },
      { name: 'invoice_data', type: 'object', description: 'Invoice line items', required: true }
    ],
    voiceTriggers: ['einvoice', 'e-invoice', 'ई-इनवॉइस']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏛️ GOVERNMENT TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  pm_kisan: {
    name: 'pm_kisan',
    description: 'Check PM-KISAN beneficiary status',
    descriptionHi: 'PM-KISAN का status check करें',
    category: 'government',
    parameters: [
      { name: 'aadhaar', type: 'string', description: 'Aadhaar number', required: false }
    ],
    voiceTriggers: ['pm kisan', 'kisan status', 'पीएम किसान', 'किसान स्टेटस']
  },
  mandi_price: {
    name: 'mandi_price',
    description: 'Get mandi prices for crops',
    descriptionHi: 'फसलों की मंडी भाव पाएं',
    category: 'government',
    parameters: [
      { name: 'crop', type: 'string', description: 'Crop name', required: true },
      { name: 'state', type: 'string', description: 'State name', required: false }
    ],
    voiceTriggers: ['mandi bhav', 'crop price', 'मंडी भाव', 'फसल रेट']
  },
  ration_card: {
    name: 'ration_card',
    description: 'Check ration card status',
    descriptionHi: 'Ration card status check करें',
    category: 'government',
    parameters: [
      { name: 'card_number', type: 'string', description: 'Ration card number', required: false }
    ],
    voiceTriggers: ['ration card', 'राशन कार्ड']
  },
  epf_balance: {
    name: 'epf_balance',
    description: 'Check EPF/PF balance',
    descriptionHi: 'EPF/PF balance check करें',
    category: 'government',
    parameters: [
      { name: 'uan', type: 'string', description: 'UAN number', required: false }
    ],
    voiceTriggers: ['pf balance', 'epf check', 'पीएफ बैलेंस']
  },
  electricity_bill: {
    name: 'electricity_bill',
    description: 'Check electricity bill',
    descriptionHi: 'बिजली बिल check करें',
    category: 'government',
    parameters: [
      { name: 'consumer_number', type: 'string', description: 'Consumer number', required: false }
    ],
    voiceTriggers: ['bijli bill', 'electricity bill', 'बिजली बिल']
  },
  fastag: {
    name: 'fastag',
    description: 'Check FASTag balance',
    descriptionHi: 'FASTag balance check करें',
    category: 'government',
    parameters: [
      { name: 'vehicle_number', type: 'string', description: 'Vehicle number', required: false }
    ],
    voiceTriggers: ['fastag balance', 'toll balance', 'फास्टैग बैलेंस']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 💰 FINANCE TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  emi_calc: {
    name: 'emi_calc',
    description: 'Calculate loan EMI',
    descriptionHi: 'Loan EMI calculate करें',
    category: 'finance',
    parameters: [
      { name: 'principal', type: 'number', description: 'Loan amount', required: true },
      { name: 'rate', type: 'number', description: 'Interest rate %', required: false },
      { name: 'tenure', type: 'number', description: 'Tenure in months', required: false }
    ],
    voiceTriggers: ['emi calculate', 'loan emi', 'ईएमआई कैलकुलेट']
  },
  sip_calc: {
    name: 'sip_calc',
    description: 'Calculate SIP returns',
    descriptionHi: 'SIP returns calculate करें',
    category: 'finance',
    parameters: [
      { name: 'monthly_amount', type: 'number', description: 'Monthly SIP amount', required: true },
      { name: 'years', type: 'number', description: 'Investment period in years', required: false },
      { name: 'rate', type: 'number', description: 'Expected return %', required: false }
    ],
    voiceTriggers: ['sip calculate', 'sip return', 'एसआईपी कैलकुलेट']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚛 FREIGHT TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  freight_loads: {
    name: 'freight_loads',
    description: 'Get active freight loads',
    descriptionHi: 'Active loads दिखाएं',
    category: 'freight',
    parameters: [
      { name: 'from', type: 'string', description: 'Origin city', required: false },
      { name: 'to', type: 'string', description: 'Destination city', required: false }
    ],
    voiceTriggers: ['active loads', 'show loads', 'लोड दिखाओ']
  },
  freight_trucks: {
    name: 'freight_trucks',
    description: 'Get available trucks',
    descriptionHi: 'खाली trucks दिखाएं',
    category: 'freight',
    parameters: [
      { name: 'location', type: 'string', description: 'Location', required: false },
      { name: 'type', type: 'string', description: 'Truck type', required: false }
    ],
    voiceTriggers: ['available trucks', 'khali truck', 'खाली ट्रक']
  },
  freight_stats: {
    name: 'freight_stats',
    description: 'Get freight statistics',
    descriptionHi: 'Freight statistics दिखाएं',
    category: 'freight',
    parameters: [],
    voiceTriggers: ['freight stats', 'market stats', 'फ्रेट स्टैट्स']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🛣️ SAATHI TOOLS (Fleet Management)
  // ═══════════════════════════════════════════════════════════════════════════
  fleet_vehicles: {
    name: 'fleet_vehicles',
    description: 'Get fleet vehicle list',
    descriptionHi: 'Fleet vehicles की list दिखाएं',
    category: 'saathi',
    parameters: [
      { name: 'status', type: 'string', description: 'Filter by status', required: false }
    ],
    voiceTriggers: ['fleet vehicles', 'my trucks', 'मेरी गाड़ियां']
  },
  vehicle_position: {
    name: 'vehicle_position',
    description: 'Get vehicle current position',
    descriptionHi: 'Vehicle की current position दिखाएं',
    category: 'saathi',
    parameters: [
      { name: 'vehicle_number', type: 'string', description: 'Vehicle number', required: true }
    ],
    voiceTriggers: ['vehicle position', 'truck kahan hai', 'गाड़ी कहां है']
  },
  live_positions: {
    name: 'live_positions',
    description: 'Get all vehicles live positions',
    descriptionHi: 'सभी vehicles की live position',
    category: 'saathi',
    parameters: [],
    voiceTriggers: ['live positions', 'all vehicles', 'सभी गाड़ियां']
  },
  drivers: {
    name: 'drivers',
    description: 'Get driver list',
    descriptionHi: 'Drivers की list दिखाएं',
    category: 'saathi',
    parameters: [
      { name: 'status', type: 'string', description: 'Filter by status', required: false }
    ],
    voiceTriggers: ['driver list', 'show drivers', 'ड्राइवर दिखाओ']
  },
  trips: {
    name: 'trips',
    description: 'Get trip list',
    descriptionHi: 'Trips की list दिखाएं',
    category: 'saathi',
    parameters: [
      { name: 'status', type: 'string', description: 'Filter by status', required: false }
    ],
    voiceTriggers: ['trip list', 'show trips', 'ट्रिप दिखाओ']
  },
  pincode_info: {
    name: 'pincode_info',
    description: 'Get pincode details',
    descriptionHi: 'Pincode की details दिखाएं',
    category: 'saathi',
    parameters: [
      { name: 'pincode', type: 'string', description: '6-digit pincode', required: true }
    ],
    voiceTriggers: ['pincode info', 'पिनकोड']
  },
  distance_calc: {
    name: 'distance_calc',
    description: 'Calculate distance between two points',
    descriptionHi: 'दो जगहों के बीच distance',
    category: 'saathi',
    parameters: [
      { name: 'from', type: 'string', description: 'Origin pincode/city', required: true },
      { name: 'to', type: 'string', description: 'Destination pincode/city', required: true }
    ],
    voiceTriggers: ['distance', 'kitni door', 'कितनी दूर']
  },
  toll_estimate: {
    name: 'toll_estimate',
    description: 'Estimate toll charges',
    descriptionHi: 'Toll charges estimate करें',
    category: 'saathi',
    parameters: [
      { name: 'from', type: 'string', description: 'Origin', required: true },
      { name: 'to', type: 'string', description: 'Destination', required: true },
      { name: 'vehicle_type', type: 'string', description: 'Vehicle type', required: false }
    ],
    voiceTriggers: ['toll estimate', 'toll kitna', 'टोल कितना']
  },
  orders: {
    name: 'orders',
    description: 'Get orders list',
    descriptionHi: 'Orders की list दिखाएं',
    category: 'saathi',
    parameters: [
      { name: 'status', type: 'string', description: 'Filter by status', required: false }
    ],
    voiceTriggers: ['orders', 'ऑर्डर दिखाओ']
  },
  invoices: {
    name: 'invoices',
    description: 'Get invoices list',
    descriptionHi: 'Invoices की list दिखाएं',
    category: 'saathi',
    parameters: [
      { name: 'status', type: 'string', description: 'Filter by status', required: false }
    ],
    voiceTriggers: ['invoices', 'इनवॉइस दिखाओ']
  },
  alerts: {
    name: 'alerts',
    description: 'Get fleet alerts',
    descriptionHi: 'Fleet alerts दिखाएं',
    category: 'saathi',
    parameters: [],
    voiceTriggers: ['alerts', 'अलर्ट']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚢 FREIGHTBOX TOOLS (Shipping)
  // ═══════════════════════════════════════════════════════════════════════════
  shipments: {
    name: 'shipments',
    description: 'Get shipments list',
    descriptionHi: 'Shipments की list दिखाएं',
    category: 'freightbox',
    parameters: [
      { name: 'status', type: 'string', description: 'Filter by status', required: false }
    ],
    voiceTriggers: ['shipments', 'शिपमेंट']
  },
  container_track: {
    name: 'container_track',
    description: 'Track container by number',
    descriptionHi: 'Container track करें',
    category: 'freightbox',
    parameters: [
      { name: 'container_number', type: 'string', description: 'Container number (ABCD1234567)', required: true }
    ],
    voiceTriggers: ['container track', 'कंटेनर ट्रैक']
  },
  container_validate: {
    name: 'container_validate',
    description: 'Validate container number',
    descriptionHi: 'Container number validate करें',
    category: 'freightbox',
    parameters: [
      { name: 'container_number', type: 'string', description: 'Container number', required: true }
    ],
    voiceTriggers: ['container validate', 'कंटेनर वैलिड']
  },
  bookings: {
    name: 'bookings',
    description: 'Get shipping bookings',
    descriptionHi: 'Shipping bookings दिखाएं',
    category: 'freightbox',
    parameters: [
      { name: 'status', type: 'string', description: 'Filter by status', required: false }
    ],
    voiceTriggers: ['bookings', 'बुकिंग']
  },
  port_search: {
    name: 'port_search',
    description: 'Search ports',
    descriptionHi: 'Ports खोजें',
    category: 'freightbox',
    parameters: [
      { name: 'query', type: 'string', description: 'Port name or country', required: true }
    ],
    voiceTriggers: ['port search', 'पोर्ट खोजो']
  },
  indian_ports: {
    name: 'indian_ports',
    description: 'List Indian ports',
    descriptionHi: 'भारत के ports की list',
    category: 'freightbox',
    parameters: [],
    voiceTriggers: ['indian ports', 'भारत पोर्ट']
  },
  carriers: {
    name: 'carriers',
    description: 'Get shipping carriers',
    descriptionHi: 'Shipping lines दिखाएं',
    category: 'freightbox',
    parameters: [],
    voiceTriggers: ['carriers', 'shipping lines']
  },
  vessel_search: {
    name: 'vessel_search',
    description: 'Search vessels',
    descriptionHi: 'Ships खोजें',
    category: 'freightbox',
    parameters: [
      { name: 'query', type: 'string', description: 'Vessel name or IMO', required: true }
    ],
    voiceTriggers: ['vessel search', 'ship search', 'जहाज खोजो']
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔧 UTILITY TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  calculator: {
    name: 'calculator',
    description: 'Calculate math expression',
    descriptionHi: 'Math calculate करें',
    category: 'utility',
    parameters: [
      { name: 'expression', type: 'string', description: 'Math expression', required: true }
    ],
    voiceTriggers: ['calculate', 'kitna hota hai', 'कितना होता है']
  },
  weather: {
    name: 'weather',
    description: 'Get weather information',
    descriptionHi: 'मौसम की जानकारी',
    category: 'utility',
    parameters: [
      { name: 'city', type: 'string', description: 'City name', required: true }
    ],
    voiceTriggers: ['weather', 'mausam', 'मौसम']
  },
  web_search: {
    name: 'web_search',
    description: 'Search the web',
    descriptionHi: 'Web पर खोजें',
    category: 'utility',
    parameters: [
      { name: 'query', type: 'string', description: 'Search query', required: true }
    ],
    voiceTriggers: ['search', 'khojo', 'खोजो']
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRM TOOLS
  // ═══════════════════════════════════════════════════════════════════════════════
  lead_create: {
    name: 'lead_create',
    description: 'Create new lead in CRM',
    descriptionHi: 'CRM में नया Lead बनाएं',
    category: 'crm',
    parameters: [
      { name: 'name', type: 'string', description: 'Lead name', required: true },
      { name: 'phone', type: 'string', description: 'Phone number', required: false },
      { name: 'email', type: 'string', description: 'Email address', required: false },
      { name: 'source', type: 'string', description: 'Lead source', required: false },
      { name: 'notes', type: 'string', description: 'Additional notes', required: false }
    ],
    voiceTriggers: ['create lead', 'new lead', 'lead banao', 'लीड बनाओ', 'नया लीड']
  },
  lead_update: {
    name: 'lead_update',
    description: 'Update existing lead',
    descriptionHi: 'Lead अपडेट करें',
    category: 'crm',
    parameters: [
      { name: 'lead_id', type: 'string', description: 'Lead ID', required: true },
      { name: 'status', type: 'string', description: 'New status', required: false },
      { name: 'notes', type: 'string', description: 'Notes to add', required: false }
    ],
    voiceTriggers: ['update lead', 'lead update', 'लीड अपडेट']
  },
  lead_assign: {
    name: 'lead_assign',
    description: 'Assign lead to sales rep',
    descriptionHi: 'Lead को sales rep को assign करें',
    category: 'crm',
    parameters: [
      { name: 'lead_id', type: 'string', description: 'Lead ID', required: true },
      { name: 'user_id', type: 'string', description: 'User ID to assign to', required: true }
    ],
    voiceTriggers: ['assign lead', 'lead assign', 'लीड असाइन']
  },
  lead_search: {
    name: 'lead_search',
    description: 'Search leads',
    descriptionHi: 'Lead खोजें',
    category: 'crm',
    parameters: [
      { name: 'query', type: 'string', description: 'Search query', required: true },
      { name: 'status', type: 'string', description: 'Filter by status', required: false }
    ],
    voiceTriggers: ['search lead', 'find lead', 'lead khojo', 'लीड खोजो']
  },
  contact_create: {
    name: 'contact_create',
    description: 'Create new contact',
    descriptionHi: 'नया Contact बनाएं',
    category: 'crm',
    parameters: [
      { name: 'name', type: 'string', description: 'Contact name', required: true },
      { name: 'phone', type: 'string', description: 'Phone number', required: false },
      { name: 'email', type: 'string', description: 'Email address', required: false },
      { name: 'company', type: 'string', description: 'Company name', required: false }
    ],
    voiceTriggers: ['create contact', 'new contact', 'contact banao', 'कॉन्टैक्ट बनाओ']
  },
  opportunity_create: {
    name: 'opportunity_create',
    description: 'Create sales opportunity',
    descriptionHi: 'Sales opportunity बनाएं',
    category: 'crm',
    parameters: [
      { name: 'name', type: 'string', description: 'Opportunity name', required: true },
      { name: 'amount', type: 'number', description: 'Expected value', required: false },
      { name: 'stage', type: 'string', description: 'Sales stage', required: false },
      { name: 'lead_id', type: 'string', description: 'Associated lead', required: false }
    ],
    voiceTriggers: ['create opportunity', 'new opportunity', 'deal banao']
  },
  activity_log: {
    name: 'activity_log',
    description: 'Log activity/interaction',
    descriptionHi: 'Activity लॉग करें',
    category: 'crm',
    parameters: [
      { name: 'lead_id', type: 'string', description: 'Lead/Contact ID', required: true },
      { name: 'type', type: 'string', description: 'Activity type (call/email/meeting)', required: true },
      { name: 'notes', type: 'string', description: 'Activity notes', required: false }
    ],
    voiceTriggers: ['log activity', 'log call', 'activity log', 'कॉल लॉग']
  },
  activity_task: {
    name: 'activity_task',
    description: 'Schedule follow-up task/reminder',
    descriptionHi: 'Follow-up task शेड्यूल करें',
    category: 'crm',
    parameters: [
      { name: 'lead_id', type: 'string', description: 'Lead/Contact ID', required: true },
      { name: 'task_type', type: 'string', description: 'Task type (call/email/meeting/followup)', required: true },
      { name: 'due_date', type: 'string', description: 'Due date for the task', required: false },
      { name: 'description', type: 'string', description: 'Task description', required: false },
      { name: 'priority', type: 'string', description: 'Priority (low/medium/high)', required: false }
    ],
    voiceTriggers: ['schedule followup', 'set reminder', 'follow up', 'फॉलो अप']
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ERP TOOLS
  // ═══════════════════════════════════════════════════════════════════════════════
  balance_sheet: {
    name: 'balance_sheet',
    description: 'Generate balance sheet report',
    descriptionHi: 'Balance sheet रिपोर्ट बनाएं',
    category: 'erp',
    parameters: [
      { name: 'from_date', type: 'string', description: 'Start date', required: false },
      { name: 'to_date', type: 'string', description: 'End date', required: false }
    ],
    voiceTriggers: ['balance sheet', 'बैलेंस शीट']
  },
  profit_loss: {
    name: 'profit_loss',
    description: 'Generate profit & loss statement',
    descriptionHi: 'P&L statement बनाएं',
    category: 'erp',
    parameters: [
      { name: 'from_date', type: 'string', description: 'Start date', required: false },
      { name: 'to_date', type: 'string', description: 'End date', required: false }
    ],
    voiceTriggers: ['profit loss', 'p&l', 'पीएनएल']
  },
  invoice_create: {
    name: 'invoice_create',
    description: 'Create sales invoice',
    descriptionHi: 'Invoice बनाएं',
    category: 'erp',
    parameters: [
      { name: 'customer', type: 'string', description: 'Customer name/ID', required: true },
      { name: 'items', type: 'string', description: 'Invoice items (JSON)', required: true },
      { name: 'gstin', type: 'string', description: 'Customer GSTIN', required: false }
    ],
    voiceTriggers: ['create invoice', 'new invoice', 'invoice banao', 'बिल बनाओ']
  },
  inventory_check: {
    name: 'inventory_check',
    description: 'Check inventory/stock levels',
    descriptionHi: 'Stock check करें',
    category: 'erp',
    parameters: [
      { name: 'item', type: 'string', description: 'Item name/SKU', required: true },
      { name: 'warehouse', type: 'string', description: 'Warehouse location', required: false }
    ],
    voiceTriggers: ['check stock', 'inventory check', 'स्टॉक चेक']
  },
  purchase_order: {
    name: 'purchase_order',
    description: 'Create purchase order',
    descriptionHi: 'Purchase order बनाएं',
    category: 'erp',
    parameters: [
      { name: 'supplier', type: 'string', description: 'Supplier name/ID', required: true },
      { name: 'items', type: 'string', description: 'Order items (JSON)', required: true }
    ],
    voiceTriggers: ['create po', 'purchase order', 'पीओ बनाओ']
  }
};

/**
 * Get all BANI tools as MCP tool array
 */
export function getBaniTools(): MCPTool[] {
  return Object.values(BANI_TOOLS).map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    execute: async (params: Record<string, any>): Promise<MCPResult> => {
      const startTime = Date.now();

      // Use real executor if available, otherwise default
      const executor = TOOL_EXECUTORS[tool.name] || defaultExecutor.bind(null, tool.name);

      try {
        const result = await executor(params);
        result.metadata = {
          tool: tool.name,
          duration_ms: Date.now() - startTime,
          cost: result.metadata?.cost
        };
        return result;
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          data: { params },
          metadata: { tool: tool.name, duration_ms: Date.now() - startTime }
        };
      }
    }
  }));
}

/**
 * Get tool count by category
 */
export function getToolCountByCategory(): Record<string, number> {
  const counts: Record<string, number> = {};
  Object.values(BANI_TOOLS).forEach(tool => {
    counts[tool.category] = (counts[tool.category] || 0) + 1;
  });
  return counts;
}

/**
 * Get total tool count
 */
export function getTotalToolCount(): number {
  return Object.keys(BANI_TOOLS).length;
}

/**
 * Find tool by voice trigger
 */
export function findToolByVoiceTrigger(input: string): string | null {
  const lower = input.toLowerCase();
  for (const [name, tool] of Object.entries(BANI_TOOLS)) {
    if (tool.voiceTriggers.some(trigger => lower.includes(trigger.toLowerCase()))) {
      return name;
    }
  }
  return null;
}

export default BANI_TOOLS;
