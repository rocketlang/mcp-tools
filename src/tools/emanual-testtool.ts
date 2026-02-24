/**
 * E-Manual & Test-Tool MCP Tools
 * Integration for Swayam AI assistant
 *
 * 🙏 Jai Guru Ji | ANKR Labs | Jan 2026
 */

import type { MCPResult } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// E-MANUAL TOOLS - Contextual Help & Documentation
// ═══════════════════════════════════════════════════════════════════════════════

export const EMANUAL_TOOLS = {
  'emanual.getHelp': {
    name: 'emanual.getHelp',
    category: 'help',
    description: 'Get help documentation for a specific topic or feature',
    descriptionHi: 'किसी विषय या फ़ीचर के लिए मदद डॉक्यूमेंटेशन प्राप्त करें',
    parameters: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic to get help for (e.g., "orders", "invoices", "fleet")' },
        language: { type: 'string', enum: ['en', 'hi'], default: 'en' }
      },
      required: ['topic']
    },
    voiceTriggers: ['help with', 'how to', 'मदद करो', 'कैसे करें', 'explain', 'show me']
  },

  'emanual.searchDocs': {
    name: 'emanual.searchDocs',
    category: 'help',
    description: 'Search E-Manual documentation across all modules',
    descriptionHi: 'सभी मॉड्यूल में E-Manual डॉक्यूमेंटेशन खोजें',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        module: { type: 'string', description: 'Optional: filter by module' }
      },
      required: ['query']
    },
    voiceTriggers: ['search docs', 'find help', 'खोजो', 'docs में ढूंढो']
  },

  'emanual.getShortcuts': {
    name: 'emanual.getShortcuts',
    category: 'help',
    description: 'Get keyboard shortcuts for the current page or module',
    descriptionHi: 'वर्तमान पेज या मॉड्यूल के लिए कीबोर्ड शॉर्टकट प्राप्त करें',
    parameters: {
      type: 'object',
      properties: {
        page: { type: 'string', description: 'Page or module name (e.g., "orders", "trips")' }
      }
    },
    voiceTriggers: ['shortcuts', 'keyboard', 'शॉर्टकट', 'quick keys']
  },

  'emanual.getTutorial': {
    name: 'emanual.getTutorial',
    category: 'help',
    description: 'Get step-by-step tutorial for a workflow',
    descriptionHi: 'किसी वर्कफ़्लो के लिए step-by-step tutorial प्राप्त करें',
    parameters: {
      type: 'object',
      properties: {
        workflow: { type: 'string', description: 'Workflow name (e.g., "create-order", "assign-driver")' },
        format: { type: 'string', enum: ['text', 'steps', 'video'], default: 'steps' }
      },
      required: ['workflow']
    },
    voiceTriggers: ['tutorial', 'walkthrough', 'ट्यूटोरियल', 'सिखाओ', 'show me how']
  },

  'emanual.contextualHelp': {
    name: 'emanual.contextualHelp',
    category: 'help',
    description: 'Get context-aware help based on current page/action',
    descriptionHi: 'वर्तमान पेज/एक्शन के आधार पर context-aware मदद प्राप्त करें',
    parameters: {
      type: 'object',
      properties: {
        currentPage: { type: 'string', description: 'Current page URL or name' },
        currentAction: { type: 'string', description: 'What user is trying to do' }
      },
      required: ['currentPage']
    },
    voiceTriggers: ['what is this', 'help here', 'यहाँ मदद', 'इसमें क्या है']
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEST-TOOL MCP INTEGRATION - Code Quality Scanner
// ═══════════════════════════════════════════════════════════════════════════════

export const TESTTOOL_TOOLS = {
  'testtool.scan': {
    name: 'testtool.scan',
    category: 'development',
    description: 'Scan codebase for common issues (button-onclick, graphql-id, async-error)',
    descriptionHi: 'कोडबेस को सामान्य समस्याओं के लिए स्कैन करें',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to scan (default: src)' },
        rules: {
          type: 'array',
          items: { type: 'string' },
          description: 'Rules to check: button-onclick, graphql-id-field, async-error-handling'
        },
        fix: { type: 'boolean', description: 'Auto-fix issues if possible', default: false }
      }
    },
    voiceTriggers: ['scan code', 'check code', 'कोड चेक करो', 'find issues']
  },

  'testtool.analyze': {
    name: 'testtool.analyze',
    category: 'development',
    description: 'Analyze a specific file for code quality issues',
    descriptionHi: 'कोड गुणवत्ता समस्याओं के लिए एक विशिष्ट फ़ाइल का विश्लेषण करें',
    parameters: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'File path to analyze' },
        ai: { type: 'boolean', description: 'Use AI for deeper analysis', default: true }
      },
      required: ['file']
    },
    voiceTriggers: ['analyze file', 'review code', 'फ़ाइल चेक करो']
  },

  'testtool.fix': {
    name: 'testtool.fix',
    category: 'development',
    description: 'Fix detected issues in a file using AI',
    descriptionHi: 'AI का उपयोग करके फ़ाइल में पाई गई समस्याओं को ठीक करें',
    parameters: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'File path to fix' },
        issues: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific issues to fix'
        },
        confirm: { type: 'boolean', description: 'Require confirmation before applying', default: true }
      },
      required: ['file']
    },
    voiceTriggers: ['fix code', 'repair', 'ठीक करो', 'fix issues']
  },

  'testtool.report': {
    name: 'testtool.report',
    category: 'development',
    description: 'Generate quality report for the project',
    descriptionHi: 'प्रोजेक्ट के लिए गुणवत्ता रिपोर्ट जेनरेट करें',
    parameters: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['console', 'json', 'html', 'markdown'], default: 'console' },
        output: { type: 'string', description: 'Output file path' }
      }
    },
    voiceTriggers: ['generate report', 'quality report', 'रिपोर्ट बनाओ']
  },

  'testtool.watch': {
    name: 'testtool.watch',
    category: 'development',
    description: 'Start watching mode for automatic scanning',
    descriptionHi: 'ऑटोमैटिक स्कैनिंग के लिए वॉच मोड शुरू करें',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to watch', default: 'src' },
        debounce: { type: 'number', description: 'Debounce time in ms', default: 300 }
      }
    },
    voiceTriggers: ['watch code', 'start watching', 'वॉच करो']
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL EXECUTORS
// ═══════════════════════════════════════════════════════════════════════════════

// E-Manual topic database (simplified)
const EMANUAL_TOPICS: Record<string, { title: string; titleHi: string; content: string; contentHi: string; tips: string[] }> = {
  'orders': {
    title: 'Orders & Bookings',
    titleHi: 'ऑर्डर और बुकिंग',
    content: 'Create and manage transport orders. Use the Orders page to view all orders, filter by status, and create new bookings.',
    contentHi: 'ट्रांसपोर्ट ऑर्डर बनाएं और प्रबंधित करें। सभी ऑर्डर देखने, स्थिति के अनुसार फ़िल्टर करने और नई बुकिंग बनाने के लिए ऑर्डर पेज का उपयोग करें।',
    tips: ['Use Ctrl+N for new order', 'Filter by date range for reports', 'Click on order ID for details']
  },
  'trips': {
    title: 'Trips & Dispatch',
    titleHi: 'ट्रिप और डिस्पैच',
    content: 'Manage active trips, track vehicles, and handle dispatch operations. Monitor driver status and ETA in real-time.',
    contentHi: 'सक्रिय ट्रिप प्रबंधित करें, वाहनों को ट्रैक करें, और डिस्पैच ऑपरेशन संभालें। रियल-टाइम में ड्राइवर स्थिति और ETA मॉनिटर करें।',
    tips: ['GPS tracking updates every 30 seconds', 'Click on map marker for vehicle details', 'Use bulk dispatch for multiple orders']
  },
  'fleet': {
    title: 'Fleet Management',
    titleHi: 'फ्लीट प्रबंधन',
    content: 'Manage your fleet of vehicles. Track maintenance, documents, and performance metrics.',
    contentHi: 'अपने वाहनों की फ्लीट प्रबंधित करें। रखरखाव, दस्तावेज़ और प्रदर्शन मेट्रिक्स ट्रैक करें।',
    tips: ['Set up maintenance reminders', 'Upload RC, Insurance documents', 'Monitor fuel efficiency']
  },
  'invoices': {
    title: 'Invoices & Billing',
    titleHi: 'इनवॉइस और बिलिंग',
    content: 'Generate invoices, track payments, and manage billing operations. GST-compliant invoicing with e-invoice support.',
    contentHi: 'इनवॉइस जेनरेट करें, भुगतान ट्रैक करें, और बिलिंग ऑपरेशन प्रबंधित करें। ई-इनवॉइस सपोर्ट के साथ GST-compliant इनवॉइसिंग।',
    tips: ['Bulk generate invoices', 'Download as PDF', 'Auto-calculate GST']
  },
  'drivers': {
    title: 'Drivers & Staff',
    titleHi: 'ड्राइवर और स्टाफ',
    content: 'Manage driver profiles, assignments, and performance. Track licenses, health status, and payments.',
    contentHi: 'ड्राइवर प्रोफाइल, असाइनमेंट और प्रदर्शन प्रबंधित करें। लाइसेंस, स्वास्थ्य स्थिति और भुगतान ट्रैक करें।',
    tips: ['Set license expiry alerts', 'Track driver rest hours', 'Monitor Saathi health metrics']
  }
};

const KEYBOARD_SHORTCUTS: Record<string, { action: string; shortcut: string }[]> = {
  global: [
    { action: 'Open E-Manual', shortcut: 'Ctrl + /' },
    { action: 'Quick Search', shortcut: 'Ctrl + K' },
    { action: 'New Order', shortcut: 'Ctrl + N' },
    { action: 'Go to Dashboard', shortcut: 'Ctrl + D' },
    { action: 'Toggle Sidebar', shortcut: 'Ctrl + B' }
  ],
  orders: [
    { action: 'New Order', shortcut: 'Ctrl + N' },
    { action: 'Filter Orders', shortcut: 'Ctrl + F' },
    { action: 'Export Data', shortcut: 'Ctrl + E' }
  ],
  trips: [
    { action: 'Start Trip', shortcut: 'Ctrl + S' },
    { action: 'Complete Trip', shortcut: 'Ctrl + Enter' },
    { action: 'View Map', shortcut: 'M' }
  ]
};

export const EMANUAL_TOOL_EXECUTORS: Record<string, (params: any) => Promise<MCPResult>> = {
  'emanual.getHelp': async (params: { topic: string; language?: string }) => {
    const topic = EMANUAL_TOPICS[params.topic.toLowerCase()];
    if (!topic) {
      return {
        success: false,
        error: `Topic "${params.topic}" not found`,
        data: { availableTopics: Object.keys(EMANUAL_TOPICS) }
      };
    }
    const lang = params.language || 'en';
    return {
      success: true,
      data: {
        title: lang === 'hi' ? topic.titleHi : topic.title,
        content: lang === 'hi' ? topic.contentHi : topic.content,
        tips: topic.tips
      }
    };
  },

  'emanual.searchDocs': async (params: { query: string; module?: string }) => {
    const query = params.query.toLowerCase();
    const results = Object.entries(EMANUAL_TOPICS)
      .filter(([key, val]) =>
        key.includes(query) ||
        val.title.toLowerCase().includes(query) ||
        val.content.toLowerCase().includes(query)
      )
      .map(([key, val]) => ({ topic: key, title: val.title, snippet: val.content.substring(0, 100) + '...' }));

    return {
      success: true,
      data: { query: params.query, results, count: results.length }
    };
  },

  'emanual.getShortcuts': async (params: { page?: string }) => {
    const page = params.page?.toLowerCase() || 'global';
    const shortcuts = KEYBOARD_SHORTCUTS[page] || KEYBOARD_SHORTCUTS.global;
    return {
      success: true,
      data: { page, shortcuts, globalShortcuts: KEYBOARD_SHORTCUTS.global }
    };
  },

  'emanual.getTutorial': async (params: { workflow: string }) => {
    // Simplified tutorial responses
    const tutorials: Record<string, { title: string; steps: string[] }> = {
      'create-order': {
        title: 'How to Create an Order',
        steps: [
          '1. Click on Orders in the sidebar',
          '2. Click the "New Order" button (or press Ctrl+N)',
          '3. Select customer from dropdown',
          '4. Enter pickup and delivery locations',
          '5. Choose vehicle type and goods',
          '6. Set pickup date and rate',
          '7. Click "Create Order" to save'
        ]
      },
      'assign-driver': {
        title: 'How to Assign a Driver',
        steps: [
          '1. Go to Trips page',
          '2. Find the unassigned trip',
          '3. Click "Assign Driver" button',
          '4. Search for available driver',
          '5. Select driver and confirm',
          '6. Driver will receive notification'
        ]
      }
    };

    const tutorial = tutorials[params.workflow];
    if (!tutorial) {
      return {
        success: false,
        error: `Tutorial for "${params.workflow}" not found`,
        data: { availableTutorials: Object.keys(tutorials) }
      };
    }
    return { success: true, data: tutorial };
  },

  'emanual.contextualHelp': async (params: { currentPage: string }) => {
    // Map page to topic
    const pageToTopic: Record<string, string> = {
      '/orders': 'orders',
      '/trips': 'trips',
      '/fleet': 'fleet',
      '/invoices': 'invoices',
      '/drivers': 'drivers'
    };

    const topic = pageToTopic[params.currentPage] || 'orders';
    return EMANUAL_TOOL_EXECUTORS['emanual.getHelp']({ topic });
  }
};

export const TESTTOOL_TOOL_EXECUTORS: Record<string, (params: any) => Promise<MCPResult>> = {
  'testtool.scan': async (params: { path?: string; rules?: string[]; fix?: boolean }) => {
    // This would call the actual test-tool CLI
    return {
      success: true,
      data: {
        path: params.path || 'src',
        rules: params.rules || ['button-onclick', 'graphql-id-field', 'async-error-handling'],
        status: 'scanning',
        message: 'Use `test-tool scan -p ${path}` for full scan',
        cliCommand: `test-tool scan -p ${params.path || 'src'} ${params.fix ? '--fix' : ''}`
      }
    };
  },

  'testtool.analyze': async (params: { file: string; ai?: boolean }) => {
    return {
      success: true,
      data: {
        file: params.file,
        aiEnabled: params.ai !== false,
        cliCommand: `test-tool analyze ${params.file} ${params.ai ? '--ai' : ''}`
      }
    };
  },

  'testtool.fix': async (params: { file: string; issues?: string[] }) => {
    return {
      success: true,
      data: {
        file: params.file,
        issues: params.issues || ['all'],
        cliCommand: `test-tool fix ${params.file}`
      }
    };
  },

  'testtool.report': async (params: { format?: string; output?: string }) => {
    return {
      success: true,
      data: {
        format: params.format || 'console',
        output: params.output,
        cliCommand: `test-tool report -f ${params.format || 'console'} ${params.output ? '-o ' + params.output : ''}`
      }
    };
  },

  'testtool.watch': async (params: { path?: string }) => {
    return {
      success: true,
      data: {
        path: params.path || 'src',
        status: 'watching',
        cliCommand: `test-tool watch -p ${params.path || 'src'}`
      }
    };
  }
};

// Combine all tools
export const EMANUAL_TESTTOOL_TOOLS = {
  ...EMANUAL_TOOLS,
  ...TESTTOOL_TOOLS
};

export const EMANUAL_TESTTOOL_EXECUTORS = {
  ...EMANUAL_TOOL_EXECUTORS,
  ...TESTTOOL_TOOL_EXECUTORS
};

console.log(`📚 E-Manual & Test-Tool: ${Object.keys(EMANUAL_TESTTOOL_TOOLS).length} tools loaded`);
