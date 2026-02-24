/**
 * BANKING & GOVERNMENT MCP TOOLS - 50 Tools
 */

import type { MCPParameter } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// BANKING TOOLS (28 tools)
// ═══════════════════════════════════════════════════════════════════════════════

export const BANKING_TOOLS: Record<string, { name: string; description: string; descriptionHi: string; category: string; parameters: MCPParameter[]; voiceTriggers: string[] }> = {
  // UPI (5)
  upi_send: { name: 'upi_send', description: 'Send money via UPI', descriptionHi: 'UPI से पैसे भेजें', category: 'banking', parameters: [{ name: 'upi_id', type: 'string', description: 'UPI ID', required: true }, { name: 'amount', type: 'number', description: 'Amount', required: true }], voiceTriggers: ['upi send', 'पैसे भेजो'] },
  upi_request: { name: 'upi_request', description: 'Request money via UPI', descriptionHi: 'UPI से पैसे मांगें', category: 'banking', parameters: [{ name: 'upi_id', type: 'string', description: 'UPI ID', required: true }, { name: 'amount', type: 'number', description: 'Amount', required: true }], voiceTriggers: ['upi request'] },
  upi_status: { name: 'upi_status', description: 'Check UPI transaction status', descriptionHi: 'UPI status check करें', category: 'banking', parameters: [{ name: 'txn_id', type: 'string', description: 'Transaction ID', required: true }], voiceTriggers: ['upi status'] },
  upi_mandate: { name: 'upi_mandate', description: 'Create UPI mandate', descriptionHi: 'UPI mandate बनाएं', category: 'banking', parameters: [{ name: 'upi_id', type: 'string', description: 'UPI ID', required: true }, { name: 'amount', type: 'number', description: 'Amount', required: true }], voiceTriggers: ['upi mandate'] },
  upi_autopay: { name: 'upi_autopay', description: 'Setup UPI autopay', descriptionHi: 'Autopay setup करें', category: 'banking', parameters: [{ name: 'biller', type: 'string', description: 'Biller', required: true }], voiceTriggers: ['upi autopay'] },

  // BBPS (8)
  bbps_electricity: { name: 'bbps_electricity', description: 'Pay electricity bill', descriptionHi: 'बिजली बिल भरें', category: 'banking', parameters: [{ name: 'consumer_no', type: 'string', description: 'Consumer number', required: true }, { name: 'operator', type: 'string', description: 'Operator', required: true }], voiceTriggers: ['electricity bill', 'बिजली बिल'] },
  bbps_water: { name: 'bbps_water', description: 'Pay water bill', descriptionHi: 'पानी बिल भरें', category: 'banking', parameters: [{ name: 'consumer_no', type: 'string', description: 'Consumer number', required: true }], voiceTriggers: ['water bill', 'पानी बिल'] },
  bbps_gas: { name: 'bbps_gas', description: 'Pay gas bill', descriptionHi: 'गैस बिल भरें', category: 'banking', parameters: [{ name: 'consumer_no', type: 'string', description: 'Consumer number', required: true }], voiceTriggers: ['gas bill', 'गैस बिल'] },
  bbps_broadband: { name: 'bbps_broadband', description: 'Pay broadband bill', descriptionHi: 'Broadband bill भरें', category: 'banking', parameters: [{ name: 'account_no', type: 'string', description: 'Account number', required: true }], voiceTriggers: ['broadband bill'] },
  bbps_insurance: { name: 'bbps_insurance', description: 'Pay insurance premium', descriptionHi: 'Insurance premium भरें', category: 'banking', parameters: [{ name: 'policy_no', type: 'string', description: 'Policy number', required: true }], voiceTriggers: ['insurance premium'] },
  bbps_fastag: { name: 'bbps_fastag', description: 'Recharge FASTag', descriptionHi: 'FASTag recharge करें', category: 'banking', parameters: [{ name: 'vehicle_no', type: 'string', description: 'Vehicle number', required: true }, { name: 'amount', type: 'number', description: 'Amount', required: true }], voiceTriggers: ['fastag recharge'] },
  bbps_mobile: { name: 'bbps_mobile', description: 'Mobile recharge', descriptionHi: 'Mobile recharge करें', category: 'banking', parameters: [{ name: 'mobile', type: 'string', description: 'Mobile number', required: true }, { name: 'amount', type: 'number', description: 'Amount', required: true }], voiceTriggers: ['mobile recharge'] },
  bbps_dth: { name: 'bbps_dth', description: 'DTH recharge', descriptionHi: 'DTH recharge करें', category: 'banking', parameters: [{ name: 'subscriber_id', type: 'string', description: 'Subscriber ID', required: true }, { name: 'amount', type: 'number', description: 'Amount', required: true }], voiceTriggers: ['dth recharge'] },

  // Account (5)
  bank_balance: { name: 'bank_balance', description: 'Check bank balance', descriptionHi: 'Bank balance check करें', category: 'banking', parameters: [{ name: 'account', type: 'string', description: 'Account', required: false }], voiceTriggers: ['bank balance', 'बैंक बैलेंस'] },
  bank_statement: { name: 'bank_statement', description: 'Get bank statement', descriptionHi: 'Bank statement लाएं', category: 'banking', parameters: [{ name: 'from_date', type: 'string', description: 'From date', required: true }, { name: 'to_date', type: 'string', description: 'To date', required: true }], voiceTriggers: ['bank statement'] },
  beneficiary_add: { name: 'beneficiary_add', description: 'Add beneficiary', descriptionHi: 'Beneficiary add करें', category: 'banking', parameters: [{ name: 'name', type: 'string', description: 'Name', required: true }, { name: 'account_no', type: 'string', description: 'Account', required: true }, { name: 'ifsc', type: 'string', description: 'IFSC', required: true }], voiceTriggers: ['add beneficiary'] },
  fund_transfer: { name: 'fund_transfer', description: 'Transfer funds', descriptionHi: 'Fund transfer करें', category: 'banking', parameters: [{ name: 'beneficiary', type: 'string', description: 'Beneficiary', required: true }, { name: 'amount', type: 'number', description: 'Amount', required: true }], voiceTriggers: ['fund transfer'] },
  ifsc_lookup: { name: 'ifsc_lookup', description: 'Lookup IFSC code', descriptionHi: 'IFSC lookup करें', category: 'banking', parameters: [{ name: 'ifsc', type: 'string', description: 'IFSC code', required: true }], voiceTriggers: ['ifsc lookup'] },

  // Calculators (5)
  emi_calc: { name: 'emi_calc', description: 'Calculate EMI', descriptionHi: 'EMI calculate करें', category: 'banking', parameters: [{ name: 'principal', type: 'number', description: 'Principal', required: true }, { name: 'rate', type: 'number', description: 'Interest rate', required: true }, { name: 'tenure', type: 'number', description: 'Tenure months', required: true }], voiceTriggers: ['emi calculate', 'ईएमआई'] },
  sip_calc: { name: 'sip_calc', description: 'Calculate SIP returns', descriptionHi: 'SIP returns calculate करें', category: 'banking', parameters: [{ name: 'monthly', type: 'number', description: 'Monthly amount', required: true }, { name: 'years', type: 'number', description: 'Years', required: true }, { name: 'rate', type: 'number', description: 'Expected return', required: true }], voiceTriggers: ['sip calculate', 'एसआईपी'] },
  fd_calc: { name: 'fd_calc', description: 'Calculate FD maturity', descriptionHi: 'FD maturity calculate करें', category: 'banking', parameters: [{ name: 'principal', type: 'number', description: 'Principal', required: true }, { name: 'rate', type: 'number', description: 'Interest rate', required: true }, { name: 'tenure', type: 'number', description: 'Tenure months', required: true }], voiceTriggers: ['fd calculate', 'एफडी'] },
  rd_calc: { name: 'rd_calc', description: 'Calculate RD maturity', descriptionHi: 'RD maturity calculate करें', category: 'banking', parameters: [{ name: 'monthly', type: 'number', description: 'Monthly deposit', required: true }, { name: 'rate', type: 'number', description: 'Interest rate', required: true }, { name: 'tenure', type: 'number', description: 'Tenure months', required: true }], voiceTriggers: ['rd calculate', 'आरडी'] },
  ppf_calc: { name: 'ppf_calc', description: 'Calculate PPF maturity', descriptionHi: 'PPF maturity calculate करें', category: 'banking', parameters: [{ name: 'yearly', type: 'number', description: 'Yearly deposit', required: true }, { name: 'years', type: 'number', description: 'Years', required: false }], voiceTriggers: ['ppf calculate', 'पीपीएफ'] },

  // Loans (5)
  loan_apply: { name: 'loan_apply', description: 'Apply for loan', descriptionHi: 'Loan apply करें', category: 'banking', parameters: [{ name: 'type', type: 'string', description: 'Loan type', required: true }, { name: 'amount', type: 'number', description: 'Amount', required: true }], voiceTriggers: ['loan apply'] },
  loan_status: { name: 'loan_status', description: 'Check loan status', descriptionHi: 'Loan status check करें', category: 'banking', parameters: [{ name: 'application_id', type: 'string', description: 'Application ID', required: true }], voiceTriggers: ['loan status'] },
  loan_emi_pay: { name: 'loan_emi_pay', description: 'Pay loan EMI', descriptionHi: 'Loan EMI भरें', category: 'banking', parameters: [{ name: 'loan_id', type: 'string', description: 'Loan ID', required: true }], voiceTriggers: ['pay emi'] },
  loan_foreclosure: { name: 'loan_foreclosure', description: 'Get foreclosure amount', descriptionHi: 'Foreclosure amount देखें', category: 'banking', parameters: [{ name: 'loan_id', type: 'string', description: 'Loan ID', required: true }], voiceTriggers: ['foreclosure amount'] },
  loan_statement: { name: 'loan_statement', description: 'Get loan statement', descriptionHi: 'Loan statement लाएं', category: 'banking', parameters: [{ name: 'loan_id', type: 'string', description: 'Loan ID', required: true }], voiceTriggers: ['loan statement'] }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GOVERNMENT TOOLS (22 tools)
// ═══════════════════════════════════════════════════════════════════════════════

export const GOVERNMENT_TOOLS: Record<string, { name: string; description: string; descriptionHi: string; category: string; parameters: MCPParameter[]; voiceTriggers: string[] }> = {
  // Aadhaar (3)
  aadhaar_verify: { name: 'aadhaar_verify', description: 'Verify Aadhaar number', descriptionHi: 'Aadhaar verify करें', category: 'government', parameters: [{ name: 'aadhaar', type: 'string', description: 'Aadhaar number', required: true }], voiceTriggers: ['aadhaar verify', 'आधार वेरीफाई'] },
  aadhaar_ekyc: { name: 'aadhaar_ekyc', description: 'Aadhaar eKYC', descriptionHi: 'Aadhaar eKYC करें', category: 'government', parameters: [{ name: 'aadhaar', type: 'string', description: 'Aadhaar number', required: true }], voiceTriggers: ['aadhaar ekyc'] },
  aadhaar_otp: { name: 'aadhaar_otp', description: 'Request Aadhaar OTP', descriptionHi: 'Aadhaar OTP मांगें', category: 'government', parameters: [{ name: 'aadhaar', type: 'string', description: 'Aadhaar number', required: true }], voiceTriggers: ['aadhaar otp'] },

  // DigiLocker (5)
  digilocker_auth: { name: 'digilocker_auth', description: 'DigiLocker authentication', descriptionHi: 'DigiLocker login करें', category: 'government', parameters: [], voiceTriggers: ['digilocker login'] },
  digilocker_fetch: { name: 'digilocker_fetch', description: 'Fetch document from DigiLocker', descriptionHi: 'Document fetch करें', category: 'government', parameters: [{ name: 'doc_type', type: 'string', description: 'Document type', required: true }], voiceTriggers: ['digilocker fetch'] },
  digilocker_verify: { name: 'digilocker_verify', description: 'Verify DigiLocker document', descriptionHi: 'Document verify करें', category: 'government', parameters: [{ name: 'uri', type: 'string', description: 'Document URI', required: true }], voiceTriggers: ['digilocker verify'] },
  digilocker_share: { name: 'digilocker_share', description: 'Share DigiLocker document', descriptionHi: 'Document share करें', category: 'government', parameters: [{ name: 'doc_id', type: 'string', description: 'Document ID', required: true }], voiceTriggers: ['digilocker share'] },
  digilocker_issued: { name: 'digilocker_issued', description: 'List issued documents', descriptionHi: 'Issued documents देखें', category: 'government', parameters: [], voiceTriggers: ['issued documents'] },

  // ULIP (5)
  ulip_vahan_rc: { name: 'ulip_vahan_rc', description: 'Get vehicle RC via ULIP', descriptionHi: 'RC details via ULIP', category: 'government', parameters: [{ name: 'vehicle_no', type: 'string', description: 'Vehicle number', required: true }], voiceTriggers: ['vahan rc', 'गाड़ी rc'] },
  ulip_sarathi_dl: { name: 'ulip_sarathi_dl', description: 'Get DL details via ULIP', descriptionHi: 'DL details via ULIP', category: 'government', parameters: [{ name: 'dl_no', type: 'string', description: 'DL number', required: true }], voiceTriggers: ['sarathi dl', 'लाइसेंस'] },
  ulip_fastag_balance: { name: 'ulip_fastag_balance', description: 'FASTag balance via ULIP', descriptionHi: 'FASTag balance', category: 'government', parameters: [{ name: 'vehicle_no', type: 'string', description: 'Vehicle number', required: true }], voiceTriggers: ['fastag balance', 'फास्टैग बैलेंस'] },
  ulip_gps_track: { name: 'ulip_gps_track', description: 'GPS tracking via ULIP', descriptionHi: 'GPS track करें', category: 'government', parameters: [{ name: 'vehicle_no', type: 'string', description: 'Vehicle number', required: true }], voiceTriggers: ['gps track'] },
  ulip_eway_verify: { name: 'ulip_eway_verify', description: 'Verify E-Way via ULIP', descriptionHi: 'E-Way verify करें', category: 'government', parameters: [{ name: 'eway_no', type: 'string', description: 'E-Way number', required: true }], voiceTriggers: ['eway verify ulip'] },

  // Schemes (5)
  pm_kisan: { name: 'pm_kisan', description: 'Check PM-KISAN status', descriptionHi: 'PM-KISAN status check करें', category: 'government', parameters: [{ name: 'aadhaar', type: 'string', description: 'Aadhaar', required: false }], voiceTriggers: ['pm kisan', 'पीएम किसान'] },
  pm_awas: { name: 'pm_awas', description: 'Check PM Awas status', descriptionHi: 'PM Awas status check करें', category: 'government', parameters: [], voiceTriggers: ['pm awas'] },
  ujjwala: { name: 'ujjwala', description: 'Check Ujjwala status', descriptionHi: 'Ujjwala status check करें', category: 'government', parameters: [], voiceTriggers: ['ujjwala'] },
  mudra_loan: { name: 'mudra_loan', description: 'Check Mudra loan status', descriptionHi: 'Mudra loan status check करें', category: 'government', parameters: [], voiceTriggers: ['mudra loan'] },
  ration_card: { name: 'ration_card', description: 'Check ration card status', descriptionHi: 'Ration card status check करें', category: 'government', parameters: [{ name: 'card_no', type: 'string', description: 'Card number', required: false }], voiceTriggers: ['ration card', 'राशन कार्ड'] },

  // Employment (4)
  epf_balance: { name: 'epf_balance', description: 'Check EPF balance', descriptionHi: 'EPF balance check करें', category: 'government', parameters: [{ name: 'uan', type: 'string', description: 'UAN', required: false }], voiceTriggers: ['epf balance', 'पीएफ बैलेंस'] },
  epf_passbook: { name: 'epf_passbook', description: 'Get EPF passbook', descriptionHi: 'EPF passbook देखें', category: 'government', parameters: [{ name: 'uan', type: 'string', description: 'UAN', required: true }], voiceTriggers: ['epf passbook'] },
  esic_status: { name: 'esic_status', description: 'Check ESIC status', descriptionHi: 'ESIC status check करें', category: 'government', parameters: [{ name: 'ip_no', type: 'string', description: 'IP number', required: true }], voiceTriggers: ['esic status'] },
  nps_balance: { name: 'nps_balance', description: 'Check NPS balance', descriptionHi: 'NPS balance check करें', category: 'government', parameters: [{ name: 'pran', type: 'string', description: 'PRAN', required: true }], voiceTriggers: ['nps balance'] }
};

export const BANKING_TOOL_COUNT = Object.keys(BANKING_TOOLS).length;
export const GOVERNMENT_TOOL_COUNT = Object.keys(GOVERNMENT_TOOLS).length;

console.log(`Banking tools: ${BANKING_TOOL_COUNT}, Government tools: ${GOVERNMENT_TOOL_COUNT}`);
