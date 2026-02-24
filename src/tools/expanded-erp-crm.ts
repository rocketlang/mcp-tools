/**
 * ERP & CRM MCP TOOLS - 74 Tools
 */

import type { MCPParameter } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// ERP TOOLS (44 tools)
// ═══════════════════════════════════════════════════════════════════════════════

export const ERP_TOOLS: Record<string, { name: string; description: string; descriptionHi: string; category: string; parameters: MCPParameter[]; voiceTriggers: string[] }> = {
  // Accounting (10)
  journal_entry: { name: 'journal_entry', description: 'Create journal entry', descriptionHi: 'Journal entry बनाएं', category: 'erp', parameters: [{ name: 'debit_account', type: 'string', description: 'Debit account', required: true }, { name: 'credit_account', type: 'string', description: 'Credit account', required: true }, { name: 'amount', type: 'number', description: 'Amount', required: true }], voiceTriggers: ['journal entry', 'जर्नल एंट्री'] },
  ledger_balance: { name: 'ledger_balance', description: 'Get ledger balance', descriptionHi: 'Ledger balance देखें', category: 'erp', parameters: [{ name: 'account', type: 'string', description: 'Account name', required: true }], voiceTriggers: ['ledger balance'] },
  trial_balance: { name: 'trial_balance', description: 'Generate trial balance', descriptionHi: 'Trial balance बनाएं', category: 'erp', parameters: [{ name: 'as_of_date', type: 'string', description: 'As of date', required: false }], voiceTriggers: ['trial balance'] },
  balance_sheet: { name: 'balance_sheet', description: 'Generate balance sheet', descriptionHi: 'Balance sheet बनाएं', category: 'erp', parameters: [{ name: 'as_of_date', type: 'string', description: 'As of date', required: false }], voiceTriggers: ['balance sheet'] },
  profit_loss: { name: 'profit_loss', description: 'Generate P&L statement', descriptionHi: 'P&L statement बनाएं', category: 'erp', parameters: [{ name: 'from_date', type: 'string', description: 'From date', required: true }, { name: 'to_date', type: 'string', description: 'To date', required: true }], voiceTriggers: ['profit loss', 'pnl'] },
  cash_flow: { name: 'cash_flow', description: 'Generate cash flow statement', descriptionHi: 'Cash flow statement बनाएं', category: 'erp', parameters: [{ name: 'period', type: 'string', description: 'Period', required: true }], voiceTriggers: ['cash flow'] },
  bank_reconcile: { name: 'bank_reconcile', description: 'Bank reconciliation', descriptionHi: 'Bank reconciliation करें', category: 'erp', parameters: [{ name: 'bank_account', type: 'string', description: 'Bank account', required: true }], voiceTriggers: ['bank reconcile'] },
  coa_list: { name: 'coa_list', description: 'List chart of accounts', descriptionHi: 'Chart of accounts देखें', category: 'erp', parameters: [], voiceTriggers: ['chart of accounts'] },
  voucher_create: { name: 'voucher_create', description: 'Create voucher', descriptionHi: 'Voucher बनाएं', category: 'erp', parameters: [{ name: 'type', type: 'string', description: 'Voucher type', required: true }, { name: 'amount', type: 'number', description: 'Amount', required: true }], voiceTriggers: ['create voucher'] },
  voucher_search: { name: 'voucher_search', description: 'Search vouchers', descriptionHi: 'Voucher खोजें', category: 'erp', parameters: [{ name: 'query', type: 'string', description: 'Search query', required: true }], voiceTriggers: ['search voucher'] },

  // Invoice (8)
  invoice_create: { name: 'invoice_create', description: 'Create invoice', descriptionHi: 'Invoice बनाएं', category: 'erp', parameters: [{ name: 'customer', type: 'string', description: 'Customer name', required: true }, { name: 'items', type: 'array', description: 'Line items', required: true }], voiceTriggers: ['create invoice', 'इनवॉइस बनाओ'] },
  invoice_get: { name: 'invoice_get', description: 'Get invoice details', descriptionHi: 'Invoice details देखें', category: 'erp', parameters: [{ name: 'invoice_no', type: 'string', description: 'Invoice number', required: true }], voiceTriggers: ['get invoice'] },
  invoice_list: { name: 'invoice_list', description: 'List invoices', descriptionHi: 'Invoices की list', category: 'erp', parameters: [{ name: 'status', type: 'string', description: 'Status filter', required: false }], voiceTriggers: ['list invoices'] },
  invoice_void: { name: 'invoice_void', description: 'Void invoice', descriptionHi: 'Invoice void करें', category: 'erp', parameters: [{ name: 'invoice_no', type: 'string', description: 'Invoice number', required: true }], voiceTriggers: ['void invoice'] },
  invoice_send: { name: 'invoice_send', description: 'Send invoice to customer', descriptionHi: 'Invoice भेजें', category: 'erp', parameters: [{ name: 'invoice_no', type: 'string', description: 'Invoice number', required: true }], voiceTriggers: ['send invoice'] },
  invoice_payment: { name: 'invoice_payment', description: 'Record invoice payment', descriptionHi: 'Payment record करें', category: 'erp', parameters: [{ name: 'invoice_no', type: 'string', description: 'Invoice number', required: true }, { name: 'amount', type: 'number', description: 'Payment amount', required: true }], voiceTriggers: ['record payment'] },
  invoice_aging: { name: 'invoice_aging', description: 'Get invoice aging report', descriptionHi: 'Aging report देखें', category: 'erp', parameters: [], voiceTriggers: ['aging report'] },
  invoice_outstanding: { name: 'invoice_outstanding', description: 'Get outstanding invoices', descriptionHi: 'Outstanding invoices देखें', category: 'erp', parameters: [{ name: 'customer', type: 'string', description: 'Customer name', required: false }], voiceTriggers: ['outstanding invoices'] },

  // Inventory (10)
  stock_check: { name: 'stock_check', description: 'Check stock level', descriptionHi: 'Stock check करें', category: 'erp', parameters: [{ name: 'item', type: 'string', description: 'Item name/SKU', required: true }], voiceTriggers: ['stock check', 'स्टॉक कितना'] },
  product_add: { name: 'product_add', description: 'Add new product', descriptionHi: 'Product add करें', category: 'erp', parameters: [{ name: 'name', type: 'string', description: 'Product name', required: true }, { name: 'sku', type: 'string', description: 'SKU', required: true }], voiceTriggers: ['add product'] },
  stock_adjust: { name: 'stock_adjust', description: 'Adjust stock quantity', descriptionHi: 'Stock adjust करें', category: 'erp', parameters: [{ name: 'item', type: 'string', description: 'Item', required: true }, { name: 'qty', type: 'number', description: 'Quantity', required: true }], voiceTriggers: ['adjust stock'] },
  stock_transfer: { name: 'stock_transfer', description: 'Transfer stock between locations', descriptionHi: 'Stock transfer करें', category: 'erp', parameters: [{ name: 'item', type: 'string', description: 'Item', required: true }, { name: 'from', type: 'string', description: 'From location', required: true }, { name: 'to', type: 'string', description: 'To location', required: true }], voiceTriggers: ['transfer stock'] },
  stock_valuation: { name: 'stock_valuation', description: 'Get stock valuation', descriptionHi: 'Stock valuation देखें', category: 'erp', parameters: [], voiceTriggers: ['stock valuation'] },
  reorder_check: { name: 'reorder_check', description: 'Check reorder levels', descriptionHi: 'Reorder check करें', category: 'erp', parameters: [], voiceTriggers: ['reorder check'] },
  stock_movement: { name: 'stock_movement', description: 'Stock movement report', descriptionHi: 'Stock movement report', category: 'erp', parameters: [{ name: 'item', type: 'string', description: 'Item', required: true }], voiceTriggers: ['stock movement'] },
  batch_track: { name: 'batch_track', description: 'Track batch', descriptionHi: 'Batch track करें', category: 'erp', parameters: [{ name: 'batch_no', type: 'string', description: 'Batch number', required: true }], voiceTriggers: ['track batch'] },
  serial_track: { name: 'serial_track', description: 'Track serial number', descriptionHi: 'Serial track करें', category: 'erp', parameters: [{ name: 'serial_no', type: 'string', description: 'Serial number', required: true }], voiceTriggers: ['track serial'] },
  abc_analysis: { name: 'abc_analysis', description: 'ABC analysis report', descriptionHi: 'ABC analysis देखें', category: 'erp', parameters: [], voiceTriggers: ['abc analysis'] },

  // Purchase (8)
  pr_create: { name: 'pr_create', description: 'Create purchase requisition', descriptionHi: 'PR बनाएं', category: 'erp', parameters: [{ name: 'items', type: 'array', description: 'Items', required: true }], voiceTriggers: ['create pr'] },
  po_create: { name: 'po_create', description: 'Create purchase order', descriptionHi: 'PO बनाएं', category: 'erp', parameters: [{ name: 'vendor', type: 'string', description: 'Vendor', required: true }, { name: 'items', type: 'array', description: 'Items', required: true }], voiceTriggers: ['create po', 'पीओ बनाओ'] },
  po_approve: { name: 'po_approve', description: 'Approve purchase order', descriptionHi: 'PO approve करें', category: 'erp', parameters: [{ name: 'po_no', type: 'string', description: 'PO number', required: true }], voiceTriggers: ['approve po'] },
  grn_create: { name: 'grn_create', description: 'Create goods receipt note', descriptionHi: 'GRN बनाएं', category: 'erp', parameters: [{ name: 'po_no', type: 'string', description: 'PO number', required: true }], voiceTriggers: ['create grn'] },
  purchase_invoice: { name: 'purchase_invoice', description: 'Create purchase invoice', descriptionHi: 'Purchase invoice बनाएं', category: 'erp', parameters: [{ name: 'grn_no', type: 'string', description: 'GRN number', required: true }], voiceTriggers: ['purchase invoice'] },
  vendor_payment: { name: 'vendor_payment', description: 'Create vendor payment', descriptionHi: 'Vendor payment करें', category: 'erp', parameters: [{ name: 'vendor', type: 'string', description: 'Vendor', required: true }, { name: 'amount', type: 'number', description: 'Amount', required: true }], voiceTriggers: ['vendor payment'] },
  vendor_list: { name: 'vendor_list', description: 'List vendors', descriptionHi: 'Vendors की list', category: 'erp', parameters: [], voiceTriggers: ['list vendors'] },
  po_pending: { name: 'po_pending', description: 'List pending POs', descriptionHi: 'Pending POs देखें', category: 'erp', parameters: [], voiceTriggers: ['pending po'] },

  // Sales (8)
  quotation_create: { name: 'quotation_create', description: 'Create sales quotation', descriptionHi: 'Quotation बनाएं', category: 'erp', parameters: [{ name: 'customer', type: 'string', description: 'Customer', required: true }, { name: 'items', type: 'array', description: 'Items', required: true }], voiceTriggers: ['create quotation'] },
  so_create: { name: 'so_create', description: 'Create sales order', descriptionHi: 'SO बनाएं', category: 'erp', parameters: [{ name: 'customer', type: 'string', description: 'Customer', required: true }, { name: 'items', type: 'array', description: 'Items', required: true }], voiceTriggers: ['create so'] },
  delivery_create: { name: 'delivery_create', description: 'Create delivery note', descriptionHi: 'Delivery note बनाएं', category: 'erp', parameters: [{ name: 'so_no', type: 'string', description: 'SO number', required: true }], voiceTriggers: ['create delivery'] },
  sales_invoice: { name: 'sales_invoice', description: 'Create sales invoice', descriptionHi: 'Sales invoice बनाएं', category: 'erp', parameters: [{ name: 'delivery_no', type: 'string', description: 'Delivery number', required: true }], voiceTriggers: ['sales invoice'] },
  sales_return: { name: 'sales_return', description: 'Create sales return', descriptionHi: 'Sales return बनाएं', category: 'erp', parameters: [{ name: 'invoice_no', type: 'string', description: 'Invoice number', required: true }], voiceTriggers: ['sales return'] },
  customer_list: { name: 'customer_list', description: 'List customers', descriptionHi: 'Customers की list', category: 'erp', parameters: [], voiceTriggers: ['list customers'] },
  so_pending: { name: 'so_pending', description: 'List pending SOs', descriptionHi: 'Pending SOs देखें', category: 'erp', parameters: [], voiceTriggers: ['pending so'] },
  sales_pipeline: { name: 'sales_pipeline', description: 'Sales pipeline report', descriptionHi: 'Sales pipeline देखें', category: 'erp', parameters: [], voiceTriggers: ['sales pipeline'] }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CRM TOOLS (30 tools)
// ═══════════════════════════════════════════════════════════════════════════════

export const CRM_TOOLS: Record<string, { name: string; description: string; descriptionHi: string; category: string; parameters: MCPParameter[]; voiceTriggers: string[] }> = {
  // Lead (8)
  lead_create: { name: 'lead_create', description: 'Create new lead', descriptionHi: 'Lead बनाएं', category: 'crm', parameters: [{ name: 'name', type: 'string', description: 'Lead name', required: true }, { name: 'phone', type: 'string', description: 'Phone', required: true }], voiceTriggers: ['create lead', 'लीड बनाओ'] },
  lead_update: { name: 'lead_update', description: 'Update lead', descriptionHi: 'Lead update करें', category: 'crm', parameters: [{ name: 'lead_id', type: 'string', description: 'Lead ID', required: true }], voiceTriggers: ['update lead'] },
  lead_convert: { name: 'lead_convert', description: 'Convert lead to customer', descriptionHi: 'Lead convert करें', category: 'crm', parameters: [{ name: 'lead_id', type: 'string', description: 'Lead ID', required: true }], voiceTriggers: ['convert lead'] },
  lead_list: { name: 'lead_list', description: 'List leads', descriptionHi: 'Leads की list', category: 'crm', parameters: [{ name: 'status', type: 'string', description: 'Status', required: false }], voiceTriggers: ['list leads'] },
  lead_assign: { name: 'lead_assign', description: 'Assign lead to user', descriptionHi: 'Lead assign करें', category: 'crm', parameters: [{ name: 'lead_id', type: 'string', description: 'Lead ID', required: true }, { name: 'user', type: 'string', description: 'User', required: true }], voiceTriggers: ['assign lead'] },
  lead_score: { name: 'lead_score', description: 'Get lead score', descriptionHi: 'Lead score देखें', category: 'crm', parameters: [{ name: 'lead_id', type: 'string', description: 'Lead ID', required: true }], voiceTriggers: ['lead score'] },
  lead_source_report: { name: 'lead_source_report', description: 'Lead source report', descriptionHi: 'Lead source report', category: 'crm', parameters: [], voiceTriggers: ['lead source'] },
  lead_followup: { name: 'lead_followup', description: 'Get leads due for follow-up', descriptionHi: 'Follow-up due leads', category: 'crm', parameters: [], voiceTriggers: ['followup due'] },

  // Contact (6)
  contact_create: { name: 'contact_create', description: 'Create contact', descriptionHi: 'Contact बनाएं', category: 'crm', parameters: [{ name: 'name', type: 'string', description: 'Name', required: true }, { name: 'email', type: 'string', description: 'Email', required: false }], voiceTriggers: ['create contact'] },
  contact_update: { name: 'contact_update', description: 'Update contact', descriptionHi: 'Contact update करें', category: 'crm', parameters: [{ name: 'contact_id', type: 'string', description: 'Contact ID', required: true }], voiceTriggers: ['update contact'] },
  contact_list: { name: 'contact_list', description: 'List contacts', descriptionHi: 'Contacts की list', category: 'crm', parameters: [], voiceTriggers: ['list contacts'] },
  contact_search: { name: 'contact_search', description: 'Search contacts', descriptionHi: 'Contact खोजें', category: 'crm', parameters: [{ name: 'query', type: 'string', description: 'Search query', required: true }], voiceTriggers: ['search contact'] },
  contact_merge: { name: 'contact_merge', description: 'Merge duplicate contacts', descriptionHi: 'Contacts merge करें', category: 'crm', parameters: [{ name: 'primary_id', type: 'string', description: 'Primary contact', required: true }, { name: 'duplicate_id', type: 'string', description: 'Duplicate contact', required: true }], voiceTriggers: ['merge contacts'] },
  contact_history: { name: 'contact_history', description: 'Get contact history', descriptionHi: 'Contact history देखें', category: 'crm', parameters: [{ name: 'contact_id', type: 'string', description: 'Contact ID', required: true }], voiceTriggers: ['contact history'] },

  // Opportunity (8)
  opportunity_create: { name: 'opportunity_create', description: 'Create opportunity', descriptionHi: 'Opportunity बनाएं', category: 'crm', parameters: [{ name: 'name', type: 'string', description: 'Name', required: true }, { name: 'value', type: 'number', description: 'Value', required: true }], voiceTriggers: ['create opportunity'] },
  opportunity_update: { name: 'opportunity_update', description: 'Update opportunity', descriptionHi: 'Opportunity update करें', category: 'crm', parameters: [{ name: 'opp_id', type: 'string', description: 'Opportunity ID', required: true }], voiceTriggers: ['update opportunity'] },
  opportunity_stage: { name: 'opportunity_stage', description: 'Change opportunity stage', descriptionHi: 'Stage change करें', category: 'crm', parameters: [{ name: 'opp_id', type: 'string', description: 'Opportunity ID', required: true }, { name: 'stage', type: 'string', description: 'New stage', required: true }], voiceTriggers: ['change stage'] },
  opportunity_list: { name: 'opportunity_list', description: 'List opportunities', descriptionHi: 'Opportunities की list', category: 'crm', parameters: [{ name: 'stage', type: 'string', description: 'Stage filter', required: false }], voiceTriggers: ['list opportunities'] },
  opportunity_forecast: { name: 'opportunity_forecast', description: 'Sales forecast', descriptionHi: 'Sales forecast देखें', category: 'crm', parameters: [], voiceTriggers: ['sales forecast'] },
  opportunity_won: { name: 'opportunity_won', description: 'Mark opportunity won', descriptionHi: 'Won mark करें', category: 'crm', parameters: [{ name: 'opp_id', type: 'string', description: 'Opportunity ID', required: true }], voiceTriggers: ['won deal'] },
  opportunity_lost: { name: 'opportunity_lost', description: 'Mark opportunity lost', descriptionHi: 'Lost mark करें', category: 'crm', parameters: [{ name: 'opp_id', type: 'string', description: 'Opportunity ID', required: true }, { name: 'reason', type: 'string', description: 'Reason', required: true }], voiceTriggers: ['lost deal'] },
  opportunity_pipeline: { name: 'opportunity_pipeline', description: 'View pipeline', descriptionHi: 'Pipeline देखें', category: 'crm', parameters: [], voiceTriggers: ['view pipeline'] },

  // Activity (8)
  activity_call: { name: 'activity_call', description: 'Log a call', descriptionHi: 'Call log करें', category: 'crm', parameters: [{ name: 'contact_id', type: 'string', description: 'Contact', required: true }, { name: 'notes', type: 'string', description: 'Notes', required: false }], voiceTriggers: ['log call'] },
  activity_email: { name: 'activity_email', description: 'Log an email', descriptionHi: 'Email log करें', category: 'crm', parameters: [{ name: 'contact_id', type: 'string', description: 'Contact', required: true }, { name: 'subject', type: 'string', description: 'Subject', required: true }], voiceTriggers: ['log email'] },
  activity_meeting: { name: 'activity_meeting', description: 'Log a meeting', descriptionHi: 'Meeting log करें', category: 'crm', parameters: [{ name: 'contact_id', type: 'string', description: 'Contact', required: true }, { name: 'notes', type: 'string', description: 'Notes', required: false }], voiceTriggers: ['log meeting'] },
  activity_task: { name: 'activity_task', description: 'Create a task', descriptionHi: 'Task बनाएं', category: 'crm', parameters: [{ name: 'title', type: 'string', description: 'Title', required: true }, { name: 'due_date', type: 'string', description: 'Due date', required: true }], voiceTriggers: ['create task'] },
  activity_list: { name: 'activity_list', description: 'List activities', descriptionHi: 'Activities की list', category: 'crm', parameters: [{ name: 'contact_id', type: 'string', description: 'Contact', required: false }], voiceTriggers: ['list activities'] },
  activity_today: { name: 'activity_today', description: 'Today activities', descriptionHi: 'आज की activities', category: 'crm', parameters: [], voiceTriggers: ['today activities'] },
  activity_overdue: { name: 'activity_overdue', description: 'Overdue activities', descriptionHi: 'Overdue activities', category: 'crm', parameters: [], voiceTriggers: ['overdue activities'] },
  activity_complete: { name: 'activity_complete', description: 'Mark activity complete', descriptionHi: 'Activity complete करें', category: 'crm', parameters: [{ name: 'activity_id', type: 'string', description: 'Activity ID', required: true }], voiceTriggers: ['complete activity'] }
};

export const ERP_TOOL_COUNT = Object.keys(ERP_TOOLS).length;
export const CRM_TOOL_COUNT = Object.keys(CRM_TOOLS).length;

console.log(`ERP tools: ${ERP_TOOL_COUNT}, CRM tools: ${CRM_TOOL_COUNT}`);
