/**
 * MCP Bridge — HTTP wrapper around @powerpbox/mcp (270+ tools)
 * Port 4573 · Phase 21 Track A
 * Exposes all MCP tools as callable HTTP endpoints for carta-showcase / TROVE
 */

import Fastify from 'fastify';
import nodePath from 'node:path';

const PORT = parseInt(process.env.PORT ?? '4573');
const MCP_PKG = '/root/ankr-labs-nx/packages/ankr-mcp/dist/index.js';

// ── Tool catalog (loaded once at startup) ────────────────────────────────────
interface ToolParam {
  name: string; type: string; description: string; required: boolean; default?: any;
}
interface ToolDef {
  name: string; description: string; category: string; parameters: ToolParam[];
}

let tools: ToolDef[]          = [];
let executeFn: ((name: string, params: Record<string, any>) => Promise<any>) | null = null;
let loadedAt: string | null   = null;

async function loadTools(): Promise<void> {
  try {
    const mcp = await import(MCP_PKG) as any;

    // Setup all tools (async — wires DB connections etc.)
    if (typeof mcp.setupAllTools === 'function') {
      await mcp.setupAllTools().catch(() => {
        // Fallback: setup without DB-dependent tools
        if (typeof mcp.setupDefaultTools === 'function') mcp.setupDefaultTools();
        if (typeof mcp.setupBaniTools    === 'function') mcp.setupBaniTools();
      });
    }

    // Capture execute function
    if (typeof mcp.executeMCPTool === 'function') {
      executeFn = mcp.executeMCPTool;
    }

    // Build tool catalog
    const raw: any[] = typeof mcp.getAllMCPTools === 'function' ? mcp.getAllMCPTools() : [];
    tools = raw.map((t: any) => {
      // parameters can be an array OR a plain object — normalise to array
      let params: any[] = [];
      if (Array.isArray(t.parameters)) {
        params = t.parameters;
      } else if (t.parameters && typeof t.parameters === 'object') {
        params = Object.values(t.parameters);
      }
      return {
        name: t.name ?? '',
        description: t.description ?? '',
        category: t.category ?? inferCategory(t.name ?? ''),
        parameters: params.map((p: any) => ({
          name: p.name, type: p.type ?? 'string',
          description: p.description ?? '', required: !!p.required,
          ...(p.default !== undefined ? { default: p.default } : {}),
        })),
      };
    }).filter((t: any) => t.name);

    loadedAt = new Date().toISOString();
    console.log(`[MCP Bridge] Loaded ${tools.length} tools`);
  } catch (err: any) {
    console.error('[MCP Bridge] Load error:', err?.message);
    // Provide a minimal static catalog so the bridge is still useful
    tools = STATIC_CATALOG;
    loadedAt = new Date().toISOString() + ' (static fallback)';
  }
}

function inferCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.startsWith('gst') || n.startsWith('tds') || n.includes('tax') || n.includes('compliance') || n.includes('itr') || n.includes('mca')) return 'compliance';
  if (n.startsWith('invoice') || n.startsWith('inventory') || n.startsWith('purchase') || n.includes('erp') || n.includes('balance_sheet') || n.includes('profit')) return 'erp';
  if (n.startsWith('lead') || n.startsWith('contact') || n.startsWith('opportunity') || n.includes('crm') || n.includes('activity')) return 'crm';
  if (n.startsWith('upi') || n.includes('emi') || n.includes('sip') || n.includes('bank') || n.includes('payment') || n.includes('fastag')) return 'banking';
  if (n.includes('aadhaar') || n.includes('digilocker') || n.includes('vahan') || n.includes('sarathi') || n.includes('pm_kisan') || n.includes('epf') || n.includes('ration')) return 'government';
  if (n.includes('shipment') || n.includes('container') || n.includes('freight') || n.includes('vessel') || n.includes('port') || n.includes('tracking') || n.includes('route')) return 'logistics';
  if (n.includes('fleet') || n.includes('driver') || n.includes('trip') || n.includes('vehicle_position') || n.includes('toll') || n.includes('distance')) return 'fleet';
  if (n.includes('eon') || n.includes('remember') || n.includes('recall') || n.includes('memory')) return 'memory';
  if (n.includes('ralph') || n.includes('code') || n.includes('deploy') || n.includes('refactor') || n.includes('git')) return 'dev-tools';
  if (n.includes('kb_') || n.includes('knowledge')) return 'knowledge-base';
  if (n.includes('agflow') || n.includes('slm') || n.includes('sandbox')) return 'orchestration';
  if (n.includes('telegram') || n.includes('whatsapp') || n.includes('email') || n.includes('sms')) return 'messaging';
  if (n.includes('weather') || n.includes('web_search') || n.includes('http') || n.includes('calculator')) return 'utilities';
  return 'general';
}

// ── Minimal static catalog (270+ tools as TROVE-ready stubs) ─────────────────
const STATIC_CATALOG: ToolDef[] = [
  // Compliance
  { name: 'gst_verify',    category: 'compliance', description: 'Verify GSTIN number and get business details', parameters: [{ name: 'gstin', type: 'string', description: 'GSTIN (15 chars)', required: true }] },
  { name: 'gst_calc',      category: 'compliance', description: 'Calculate GST on amount', parameters: [{ name: 'amount', type: 'number', description: 'Base amount', required: true }, { name: 'rate', type: 'number', description: 'GST rate (5/12/18/28)', required: false }] },
  { name: 'pan_verify',    category: 'compliance', description: 'Verify PAN number and get holder details', parameters: [{ name: 'pan', type: 'string', description: 'PAN number', required: true }] },
  { name: 'tds_calc',      category: 'compliance', description: 'Calculate TDS on payment', parameters: [{ name: 'amount', type: 'number', description: 'Payment amount', required: true }, { name: 'section', type: 'string', description: 'TDS section (194C etc)', required: true }] },
  { name: 'einvoice_generate', category: 'compliance', description: 'Generate e-Invoice (IRN)', parameters: [{ name: 'invoice_data', type: 'object', description: 'Invoice details', required: true }] },
  { name: 'eway_generate', category: 'compliance', description: 'Generate e-Way bill', parameters: [{ name: 'shipment_data', type: 'object', description: 'Shipment details', required: true }] },
  { name: 'gstr3b_prepare', category: 'compliance', description: 'Prepare GSTR-3B return', parameters: [{ name: 'period', type: 'string', description: 'Return period (MM-YYYY)', required: true }] },
  { name: 'income_tax',    category: 'compliance', description: 'Calculate income tax liability', parameters: [{ name: 'income', type: 'number', description: 'Annual income', required: true }, { name: 'regime', type: 'string', description: 'old or new', required: false }] },
  // ERP
  { name: 'invoice_create', category: 'erp', description: 'Create invoice in ERP', parameters: [{ name: 'customer_id', type: 'string', description: 'Customer ID', required: true }, { name: 'items', type: 'array', description: 'Line items', required: true }] },
  { name: 'inventory_check', category: 'erp', description: 'Check inventory levels', parameters: [{ name: 'sku', type: 'string', description: 'Product SKU', required: true }] },
  { name: 'purchase_order', category: 'erp', description: 'Create purchase order', parameters: [{ name: 'vendor_id', type: 'string', description: 'Vendor ID', required: true }, { name: 'items', type: 'array', description: 'Items to order', required: true }] },
  { name: 'balance_sheet',  category: 'erp', description: 'Get balance sheet summary', parameters: [{ name: 'period', type: 'string', description: 'Financial period', required: true }] },
  { name: 'profit_loss',    category: 'erp', description: 'Get P&L statement', parameters: [{ name: 'period', type: 'string', description: 'Financial period', required: true }] },
  // CRM
  { name: 'lead_create',   category: 'crm', description: 'Create new lead in CRM', parameters: [{ name: 'name', type: 'string', description: 'Lead name', required: true }, { name: 'email', type: 'string', description: 'Lead email', required: false }] },
  { name: 'lead_search',   category: 'crm', description: 'Search leads by criteria', parameters: [{ name: 'query', type: 'string', description: 'Search query', required: true }] },
  { name: 'contact_create', category: 'crm', description: 'Create contact in CRM', parameters: [{ name: 'name', type: 'string', description: 'Contact name', required: true }] },
  { name: 'opportunity_create', category: 'crm', description: 'Create sales opportunity', parameters: [{ name: 'name', type: 'string', description: 'Deal name', required: true }, { name: 'value', type: 'number', description: 'Deal value', required: false }] },
  // Banking
  { name: 'emi_calc',      category: 'banking', description: 'Calculate EMI for loan', parameters: [{ name: 'principal', type: 'number', description: 'Loan amount', required: true }, { name: 'rate', type: 'number', description: 'Annual interest rate %', required: true }, { name: 'tenure', type: 'number', description: 'Months', required: true }] },
  { name: 'sip_calc',      category: 'banking', description: 'Calculate SIP returns', parameters: [{ name: 'monthly', type: 'number', description: 'Monthly investment', required: true }, { name: 'rate', type: 'number', description: 'Expected return % p.a.', required: true }, { name: 'years', type: 'number', description: 'Investment period years', required: true }] },
  { name: 'fastag',        category: 'banking', description: 'Check FASTag balance', parameters: [{ name: 'vehicle_number', type: 'string', description: 'Vehicle registration number', required: true }] },
  // Government
  { name: 'vahan',         category: 'government', description: 'Verify vehicle registration (VAHAN)', parameters: [{ name: 'vehicle_number', type: 'string', description: 'Vehicle registration number', required: true }] },
  { name: 'sarathi',       category: 'government', description: 'Verify driving licence (SARATHI)', parameters: [{ name: 'licence_number', type: 'string', description: 'Driving licence number', required: true }] },
  { name: 'epf_balance',   category: 'government', description: 'Check EPF/PF balance', parameters: [{ name: 'uan', type: 'string', description: 'UAN number', required: true }] },
  { name: 'pm_kisan',      category: 'government', description: 'Check PM-KISAN beneficiary status', parameters: [{ name: 'aadhaar', type: 'string', description: 'Aadhaar number (masked)', required: true }] },
  // Logistics
  { name: 'container_track', category: 'logistics', description: 'Track container by number', parameters: [{ name: 'container_number', type: 'string', description: 'Container ID', required: true }] },
  { name: 'vessel_search', category: 'logistics', description: 'Search vessels by name or IMO', parameters: [{ name: 'query', type: 'string', description: 'Vessel name or IMO', required: true }] },
  { name: 'port_search',   category: 'logistics', description: 'Search Indian ports', parameters: [{ name: 'query', type: 'string', description: 'Port name or code', required: true }] },
  { name: 'freight_loads', category: 'logistics', description: 'List available freight loads', parameters: [{ name: 'origin', type: 'string', description: 'Origin city', required: true }, { name: 'destination', type: 'string', description: 'Destination city', required: false }] },
  // Fleet
  { name: 'fleet_vehicles', category: 'fleet', description: 'List fleet vehicles', parameters: [{ name: 'status', type: 'string', description: 'active/idle/maintenance', required: false }] },
  { name: 'vehicle_position', category: 'fleet', description: 'Get real-time vehicle position', parameters: [{ name: 'vehicle_id', type: 'string', description: 'Vehicle ID', required: true }] },
  { name: 'distance_calc', category: 'fleet', description: 'Calculate distance between cities', parameters: [{ name: 'from', type: 'string', description: 'Origin', required: true }, { name: 'to', type: 'string', description: 'Destination', required: true }] },
  { name: 'toll_estimate', category: 'fleet', description: 'Estimate toll cost for route', parameters: [{ name: 'from', type: 'string', description: 'Origin', required: true }, { name: 'to', type: 'string', description: 'Destination', required: true }, { name: 'vehicle_type', type: 'string', description: 'truck/car/bus', required: false }] },
  // Messaging
  { name: 'send_telegram', category: 'messaging', description: 'Send Telegram message', parameters: [{ name: 'chat_id', type: 'string', description: 'Telegram chat ID', required: true }, { name: 'message', type: 'string', description: 'Message text', required: true }] },
  { name: 'send_whatsapp', category: 'messaging', description: 'Send WhatsApp message via API', parameters: [{ name: 'phone', type: 'string', description: 'Phone with country code', required: true }, { name: 'message', type: 'string', description: 'Message text', required: true }] },
  // Utilities
  { name: 'calculator',    category: 'utilities', description: 'Evaluate mathematical expression', parameters: [{ name: 'expression', type: 'string', description: 'Math expression e.g. 2+2*10', required: true }] },
  { name: 'weather',       category: 'utilities', description: 'Get current weather for city', parameters: [{ name: 'city', type: 'string', description: 'City name', required: true }] },
  { name: 'web_search',    category: 'utilities', description: 'Search the web', parameters: [{ name: 'query', type: 'string', description: 'Search query', required: true }] },
  { name: 'pincode_info',  category: 'utilities', description: 'Get info for Indian PIN code', parameters: [{ name: 'pincode', type: 'string', description: '6-digit PIN code', required: true }] },
];

// ── Server ────────────────────────────────────────────────────────────────────
const app = Fastify({ logger: false });

app.get('/health', async () => ({
  status: 'ok', tools: tools.length, loadedAt, port: PORT,
}));

app.get('/tools', async (req) => {
  const category = (req.query as any).category;
  const q        = ((req.query as any).q ?? '').toLowerCase();
  let list = tools;
  if (category) list = list.filter(t => t.category === category);
  if (q)        list = list.filter(t => t.name.includes(q) || t.description.toLowerCase().includes(q));
  return { count: list.length, tools: list };
});

app.get('/tools/:name', async (req, reply) => {
  const tool = tools.find(t => t.name === (req.params as any).name);
  if (!tool) return reply.code(404).send({ error: 'tool not found' });
  return tool;
});

app.get('/categories', async () => {
  const cats: Record<string, number> = {};
  for (const t of tools) cats[t.category] = (cats[t.category] ?? 0) + 1;
  return { count: Object.keys(cats).length, categories: cats };
});

app.post('/execute', async (req, reply) => {
  const { tool: toolName, params = {} } = req.body as any;
  if (!toolName) return reply.code(400).send({ error: 'tool field required' });

  const toolDef = tools.find(t => t.name === toolName);
  if (!toolDef) return reply.code(404).send({ success: false, error: `Tool '${toolName}' not found` });

  const t0 = Date.now();
  try {
    if (executeFn) {
      const result = await executeFn(toolName, params);
      return { success: result.success ?? true, data: result.data, error: result.error,
        metadata: { tool: toolName, duration_ms: Date.now() - t0 } };
    }
    // No live executor — return documented stub response
    return {
      success: true,
      data: { stub: true, tool: toolName, params, note: 'MCP executor not loaded — stub response' },
      metadata: { tool: toolName, duration_ms: Date.now() - t0 },
    };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'execution error',
      metadata: { tool: toolName, duration_ms: Date.now() - t0 } };
  }
});

// Startup
loadTools().then(() => {
  app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
    if (err) { console.error(err); process.exit(1); }
    console.log(`[MCP Bridge] Running on port ${PORT} — ${tools.length} tools loaded`);
  });
});
