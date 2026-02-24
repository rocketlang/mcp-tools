/**
 * DigiLocker Tool - Government Document Access via API Setu
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Access verified Indian government documents:
 * - Driving License (DL)
 * - Vehicle Registration Certificate (RC)
 * - Aadhaar (with user consent)
 * - PAN Card
 * - Education certificates
 * - Insurance documents
 *
 * Integration Methods:
 * 1. API Setu (Official): https://apisetu.gov.in/digilocker
 * 2. Setu (Third-party): https://docs.setu.co/data/digilocker
 *
 * Status: 🟢 READY (needs credentials)
 *
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */

import type { MCPTool, MCPParameter, MCPResult } from '../../types';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface DigiLockerConfig {
  // API Setu credentials (official govt API)
  apiSetuClientId?: string;
  apiSetuClientSecret?: string;
  apiSetuBaseUrl?: string;

  // Setu credentials (third-party provider - easier integration)
  setuClientId?: string;
  setuClientSecret?: string;
  setuProductInstanceId?: string;
  setuBaseUrl?: string;

  // Webhook URL for async document fetch
  webhookUrl?: string;
}

export interface DigiLockerRequest {
  id: string;
  status: 'pending' | 'consent_required' | 'processing' | 'completed' | 'failed';
  consentUrl?: string;
  documents?: DigiLockerDocument[];
  createdAt: Date;
}

export interface DigiLockerDocument {
  type: string;
  name: string;
  issuer: string;
  issuedAt?: string;
  validUntil?: string;
  fileUrl?: string;
  data?: Record<string, any>;
}

// Available document types from DigiLocker
export const DIGILOCKER_DOC_TYPES = {
  // Transport
  DRVLC: { name: 'Driving License', issuer: 'Transport Dept' },
  VEHRC: { name: 'Vehicle Registration Certificate', issuer: 'Transport Dept' },
  VEHINS: { name: 'Vehicle Insurance', issuer: 'Insurance Company' },

  // Identity
  AADHAAR: { name: 'Aadhaar Card', issuer: 'UIDAI' },
  PAN: { name: 'PAN Card', issuer: 'Income Tax Dept' },
  VOTERCARD: { name: 'Voter ID', issuer: 'Election Commission' },
  PASSPORT: { name: 'Passport', issuer: 'MEA' },

  // Education
  CBSE10: { name: 'CBSE Class 10 Marksheet', issuer: 'CBSE' },
  CBSE12: { name: 'CBSE Class 12 Marksheet', issuer: 'CBSE' },
  DEGREE: { name: 'Degree Certificate', issuer: 'University' },

  // Business
  GSTCERT: { name: 'GST Certificate', issuer: 'GST Dept' },
  EPFO: { name: 'EPFO Statement', issuer: 'EPFO' },

  // Health
  COWINVC: { name: 'COVID-19 Vaccination Certificate', issuer: 'CoWIN' },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// DIGILOCKER SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class DigiLockerService {
  private config: DigiLockerConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: DigiLockerConfig) {
    this.config = {
      apiSetuBaseUrl: 'https://digilocker.meity.gov.in/public/oauth2/1',
      setuBaseUrl: 'https://dg-sandbox.setu.co/api',
      ...config,
    };
  }

  /**
   * Create a DigiLocker request (starts consent flow)
   */
  async createRequest(
    documentTypes: (keyof typeof DIGILOCKER_DOC_TYPES)[],
    redirectUrl: string
  ): Promise<DigiLockerRequest> {
    // Use Setu API if credentials available (easier integration)
    if (this.config.setuClientId && this.config.setuProductInstanceId) {
      return this.createSetuRequest(documentTypes, redirectUrl);
    }

    // Use API Setu (official govt API)
    if (this.config.apiSetuClientId) {
      return this.createApiSetuRequest(documentTypes, redirectUrl);
    }

    throw new Error('No DigiLocker API credentials configured');
  }

  /**
   * Get request status
   */
  async getRequestStatus(requestId: string): Promise<DigiLockerRequest> {
    if (this.config.setuClientId) {
      return this.getSetuRequestStatus(requestId);
    }
    throw new Error('API not configured');
  }

  /**
   * Fetch document after consent
   */
  async fetchDocument(
    requestId: string,
    documentType: keyof typeof DIGILOCKER_DOC_TYPES,
    identifiers: Record<string, string>
  ): Promise<DigiLockerDocument> {
    if (this.config.setuClientId) {
      return this.fetchSetuDocument(requestId, documentType, identifiers);
    }
    throw new Error('API not configured');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SETU API INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════

  private async createSetuRequest(
    documentTypes: (keyof typeof DIGILOCKER_DOC_TYPES)[],
    redirectUrl: string
  ): Promise<DigiLockerRequest> {
    const response = await fetch(`${this.config.setuBaseUrl}/digilocker`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': this.config.setuClientId!,
        'x-client-secret': this.config.setuClientSecret!,
        'x-product-instance-id': this.config.setuProductInstanceId!,
      },
      body: JSON.stringify({
        redirectUrl,
        documentTypes,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Setu API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      status: 'consent_required',
      consentUrl: data.url,
      createdAt: new Date(),
    };
  }

  private async getSetuRequestStatus(requestId: string): Promise<DigiLockerRequest> {
    const response = await fetch(`${this.config.setuBaseUrl}/digilocker/${requestId}`, {
      method: 'GET',
      headers: {
        'x-client-id': this.config.setuClientId!,
        'x-client-secret': this.config.setuClientSecret!,
        'x-product-instance-id': this.config.setuProductInstanceId!,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: requestId,
      status: data.status,
      consentUrl: data.url,
      documents: data.documents,
      createdAt: new Date(data.createdAt),
    };
  }

  private async fetchSetuDocument(
    requestId: string,
    documentType: keyof typeof DIGILOCKER_DOC_TYPES,
    identifiers: Record<string, string>
  ): Promise<DigiLockerDocument> {
    const endpoint = documentType === 'AADHAAR'
      ? `${this.config.setuBaseUrl}/digilocker/${requestId}/aadhaar`
      : `${this.config.setuBaseUrl}/digilocker/${requestId}/document`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': this.config.setuClientId!,
        'x-client-secret': this.config.setuClientSecret!,
        'x-product-instance-id': this.config.setuProductInstanceId!,
      },
      body: JSON.stringify({
        documentType,
        ...identifiers,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.status}`);
    }

    const data = await response.json();
    const docInfo = DIGILOCKER_DOC_TYPES[documentType];

    return {
      type: documentType,
      name: docInfo.name,
      issuer: docInfo.issuer,
      fileUrl: data.fileUrl,
      data: data.data,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // API SETU INTEGRATION (Official Govt API)
  // ═══════════════════════════════════════════════════════════════════════════

  private async createApiSetuRequest(
    documentTypes: (keyof typeof DIGILOCKER_DOC_TYPES)[],
    redirectUrl: string
  ): Promise<DigiLockerRequest> {
    // API Setu uses OAuth2 flow
    const authUrl = new URL(`${this.config.apiSetuBaseUrl}/authorize`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', this.config.apiSetuClientId!);
    authUrl.searchParams.set('redirect_uri', redirectUrl);
    authUrl.searchParams.set('state', crypto.randomUUID());
    authUrl.searchParams.set('scope', documentTypes.join(' '));

    return {
      id: authUrl.searchParams.get('state')!,
      status: 'consent_required',
      consentUrl: authUrl.toString(),
      createdAt: new Date(),
    };
  }

  /**
   * Exchange auth code for access token (API Setu OAuth2 callback)
   */
  async handleCallback(code: string, state: string): Promise<string> {
    const response = await fetch(`${this.config.apiSetuBaseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.config.apiSetuClientId!,
        client_secret: this.config.apiSetuClientSecret!,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);

    return data.access_token;
  }

  /**
   * List available documents for the authenticated user
   */
  async listDocuments(): Promise<DigiLockerDocument[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Call handleCallback first.');
    }

    const response = await fetch(`${this.config.apiSetuBaseUrl}/files/issued`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to list documents');
    }

    const data = await response.json();
    return data.items || [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MCP TOOL
// ═══════════════════════════════════════════════════════════════════════════════

export class DigiLockerTool implements MCPTool {
  name = 'digilocker';
  description = 'Access verified government documents from DigiLocker (DL, RC, Aadhaar, PAN)';

  parameters: MCPParameter[] = [
    {
      name: 'action',
      type: 'string',
      description: 'create_request, get_status, fetch_document, list_doc_types',
      required: true
    },
    {
      name: 'document_types',
      type: 'array',
      description: 'Document types to request (DRVLC, VEHRC, AADHAAR, PAN, etc.)',
      required: false
    },
    {
      name: 'request_id',
      type: 'string',
      description: 'Request ID from create_request',
      required: false
    },
    {
      name: 'redirect_url',
      type: 'string',
      description: 'URL to redirect after consent',
      required: false
    },
    {
      name: 'identifiers',
      type: 'object',
      description: 'Document identifiers (e.g., {dlNumber: "...", state: "..."})',
      required: false
    },
  ];

  private service: DigiLockerService | null = null;

  constructor(config?: DigiLockerConfig) {
    if (config) {
      this.service = new DigiLockerService(config);
    }
  }

  async execute(params: Record<string, any>): Promise<MCPResult> {
    const startTime = Date.now();
    const { action } = params;

    try {
      switch (action) {
        case 'list_doc_types':
          return {
            success: true,
            data: {
              documentTypes: Object.entries(DIGILOCKER_DOC_TYPES).map(([code, info]) => ({
                code,
                ...info,
              })),
            },
            metadata: { tool: 'digilocker', duration_ms: Date.now() - startTime },
          };

        case 'create_request':
          if (!this.service) {
            return this.noConfigError(startTime);
          }
          const request = await this.service.createRequest(
            params.document_types || ['DRVLC'],
            params.redirect_url || 'https://ankr.in/digilocker/callback'
          );
          return {
            success: true,
            data: request,
            metadata: { tool: 'digilocker', duration_ms: Date.now() - startTime },
          };

        case 'get_status':
          if (!this.service) {
            return this.noConfigError(startTime);
          }
          const status = await this.service.getRequestStatus(params.request_id);
          return {
            success: true,
            data: status,
            metadata: { tool: 'digilocker', duration_ms: Date.now() - startTime },
          };

        case 'fetch_document':
          if (!this.service) {
            return this.noConfigError(startTime);
          }
          const doc = await this.service.fetchDocument(
            params.request_id,
            params.document_types?.[0] || 'DRVLC',
            params.identifiers || {}
          );
          return {
            success: true,
            data: doc,
            metadata: { tool: 'digilocker', duration_ms: Date.now() - startTime },
          };

        default:
          return {
            success: false,
            error: `Unknown action: ${action}. Use: list_doc_types, create_request, get_status, fetch_document`,
            metadata: { tool: 'digilocker', duration_ms: Date.now() - startTime },
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: { tool: 'digilocker', duration_ms: Date.now() - startTime },
      };
    }
  }

  private noConfigError(startTime: number): MCPResult {
    return {
      success: false,
      error: 'DigiLocker not configured. Set credentials:\n' +
             '  - Setu: SETU_CLIENT_ID, SETU_CLIENT_SECRET, SETU_PRODUCT_INSTANCE_ID\n' +
             '  - API Setu: APISETU_CLIENT_ID, APISETU_CLIENT_SECRET\n\n' +
             'Register at:\n' +
             '  - Setu (Easy): https://docs.setu.co/data/digilocker\n' +
             '  - API Setu (Official): https://partners.apisetu.gov.in/',
      metadata: { tool: 'digilocker', duration_ms: Date.now() - startTime },
    };
  }
}

export function createDigiLockerTool(config?: DigiLockerConfig): DigiLockerTool {
  return new DigiLockerTool(config);
}

export default DigiLockerService;
