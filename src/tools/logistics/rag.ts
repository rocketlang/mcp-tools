/**
 * LogisticsRAG MCP Tools
 *
 * AI-powered logistics knowledge base with hybrid search
 * Connects to @ankr/eon LogisticsRAG for intelligent document retrieval
 *
 * @package @powerpbox/mcp
 * @version 1.3.0
 */

import type { MCPTool, MCPResult } from '../../types';

// ============================================================================
// Configuration
// ============================================================================

const LOGISTICS_RAG_URL = process.env.LOGISTICS_RAG_URL || 'http://localhost:4005';

// ============================================================================
// Tool Definitions
// ============================================================================

/**
 * Search logistics documentation
 */
export function createLogisticsSearchTool(): MCPTool {
  return {
    name: 'logistics_search',
    description: `Search logistics documentation using AI-powered hybrid search (vector + full-text).

Find information about:
- SOPs (Standard Operating Procedures)
- Compliance documents (HOS, FMCSA, DOT, Hazmat)
- Carrier contracts and rate confirmations
- Route guides and lane information
- Claims procedures
- Training materials

Supports filtering by document type, carrier, region, equipment, and more.`,
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Natural language search query (e.g., "temperature requirements for reefer shipments")',
        required: true,
      },
      {
        name: 'docTypes',
        type: 'array',
        description: 'Filter by document types: bol, pod, rate_confirmation, carrier_contract, sop, compliance, route_guide, claims, safety, training',
        required: false,
      },
      {
        name: 'carrierId',
        type: 'string',
        description: 'Filter by carrier ID',
        required: false,
      },
      {
        name: 'regions',
        type: 'array',
        description: 'Filter by regions (e.g., ["west", "midwest"])',
        required: false,
      },
      {
        name: 'equipmentTypes',
        type: 'array',
        description: 'Filter by equipment (e.g., ["dry_van", "reefer", "flatbed"])',
        required: false,
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Maximum results to return (default: 5)',
        required: false,
        default: 5,
      },
    ],
    execute: async (params): Promise<MCPResult> => {
      const startTime = Date.now();

      try {
        const response = await fetch(`${LOGISTICS_RAG_URL}/api/logistics/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: params.query,
            docTypes: params.docTypes,
            carrierId: params.carrierId,
            regions: params.regions,
            equipmentTypes: params.equipmentTypes,
            limit: params.limit || 5,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        return {
          success: true,
          data,
          metadata: {
            tool: 'logistics_search',
            duration_ms: Date.now() - startTime,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          metadata: {
            tool: 'logistics_search',
            duration_ms: Date.now() - startTime,
          },
        };
      }
    },
  };
}

/**
 * Retrieve formatted context for LLM prompts
 */
export function createLogisticsRetrieveTool(): MCPTool {
  return {
    name: 'logistics_retrieve',
    description: `Retrieve logistics documentation formatted as LLM-ready context.

Use this when you need to:
- Answer questions about logistics procedures
- Provide compliance guidance (HOS, hazmat, etc.)
- Look up carrier contract terms
- Find route-specific information

Returns pre-formatted context with source attribution, ready to include in your response.`,
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Natural language query',
        required: true,
      },
      {
        name: 'docTypes',
        type: 'array',
        description: 'Filter by document types',
        required: false,
      },
      {
        name: 'carrierId',
        type: 'string',
        description: 'Filter by carrier ID',
        required: false,
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Maximum documents to include (default: 3)',
        required: false,
        default: 3,
      },
    ],
    execute: async (params): Promise<MCPResult> => {
      const startTime = Date.now();

      try {
        const response = await fetch(`${LOGISTICS_RAG_URL}/api/logistics/retrieve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: params.query,
            docTypes: params.docTypes,
            carrierId: params.carrierId,
            limit: params.limit || 3,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json() as { context: string; totalResults: number; sources: string[] };

        return {
          success: true,
          data: {
            query: params.query,
            context: data.context,
            totalResults: data.totalResults,
            sources: data.sources,
          },
          metadata: {
            tool: 'logistics_retrieve',
            duration_ms: Date.now() - startTime,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          metadata: {
            tool: 'logistics_retrieve',
            duration_ms: Date.now() - startTime,
          },
        };
      }
    },
  };
}

/**
 * Ingest new logistics document
 */
export function createLogisticsIngestTool(): MCPTool {
  return {
    name: 'logistics_ingest',
    description: `Ingest a new logistics document into the knowledge base.

Document types:
- bol: Bill of Lading
- pod: Proof of Delivery
- rate_confirmation: Rate confirmation/load tender
- carrier_contract: Carrier agreement
- sop: Standard Operating Procedure
- compliance: Regulatory documents (DOT, FMCSA, HOS)
- route_guide: Route and lane information
- claims: Claims procedures
- safety: Safety protocols
- training: Training materials

The document will be automatically chunked, embedded, and indexed for search.`,
    parameters: [
      {
        name: 'title',
        type: 'string',
        description: 'Document title',
        required: true,
      },
      {
        name: 'content',
        type: 'string',
        description: 'Document content (markdown supported)',
        required: true,
      },
      {
        name: 'docType',
        type: 'string',
        description: 'Document type (bol, pod, sop, compliance, etc.)',
        required: true,
      },
      {
        name: 'carrierId',
        type: 'string',
        description: 'Associated carrier ID',
        required: false,
      },
      {
        name: 'regions',
        type: 'array',
        description: 'Applicable regions',
        required: false,
      },
      {
        name: 'equipmentTypes',
        type: 'array',
        description: 'Applicable equipment types',
        required: false,
      },
      {
        name: 'tags',
        type: 'array',
        description: 'Additional tags for filtering',
        required: false,
      },
    ],
    execute: async (params): Promise<MCPResult> => {
      const startTime = Date.now();

      try {
        const response = await fetch(`${LOGISTICS_RAG_URL}/api/logistics/ingest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: params.title,
            content: params.content,
            docType: params.docType,
            carrierId: params.carrierId,
            regions: params.regions,
            equipmentTypes: params.equipmentTypes,
            tags: params.tags,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json() as { documentId: string; chunksCreated: number };

        return {
          success: true,
          data: {
            documentId: data.documentId,
            chunksCreated: data.chunksCreated,
            message: `Document "${params.title}" ingested successfully`,
          },
          metadata: {
            tool: 'logistics_ingest',
            duration_ms: Date.now() - startTime,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          metadata: {
            tool: 'logistics_ingest',
            duration_ms: Date.now() - startTime,
          },
        };
      }
    },
  };
}

/**
 * Get logistics knowledge base statistics
 */
export function createLogisticsStatsTool(): MCPTool {
  return {
    name: 'logistics_stats',
    description: `Get statistics about the logistics knowledge base.

Returns:
- Total document and chunk counts
- Breakdown by document type
- Breakdown by region

Use this to understand what information is available before searching.`,
    parameters: [],
    execute: async (): Promise<MCPResult> => {
      const startTime = Date.now();

      try {
        const response = await fetch(`${LOGISTICS_RAG_URL}/api/logistics/stats`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        return {
          success: true,
          data,
          metadata: {
            tool: 'logistics_stats',
            duration_ms: Date.now() - startTime,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          metadata: {
            tool: 'logistics_stats',
            duration_ms: Date.now() - startTime,
          },
        };
      }
    },
  };
}

/**
 * Search compliance information
 */
export function createLogisticsComplianceTool(): MCPTool {
  return {
    name: 'logistics_compliance',
    description: `Search specifically for compliance and regulatory information.

Topics:
- hos: Hours of Service rules
- hazmat: Hazardous materials regulations
- safety: Safety protocols
- dot: DOT requirements
- fmcsa: FMCSA regulations
- eld: Electronic Logging Device rules

Returns formatted compliance guidance with source attribution.`,
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Compliance question (e.g., "HOS rules for team drivers")',
        required: true,
      },
      {
        name: 'topic',
        type: 'string',
        description: 'Compliance topic: hos, hazmat, safety, dot, fmcsa, eld, general',
        required: false,
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Maximum results (default: 3)',
        required: false,
        default: 3,
      },
    ],
    execute: async (params): Promise<MCPResult> => {
      const startTime = Date.now();

      try {
        // Map topic to document types and tags
        const topicConfig: Record<string, { docTypes: string[]; tags: string[] }> = {
          hos: { docTypes: ['compliance', 'sop'], tags: ['hos', 'hours-of-service', 'driving-time'] },
          hazmat: { docTypes: ['compliance', 'safety'], tags: ['hazmat', 'hazardous', 'placards'] },
          safety: { docTypes: ['safety', 'sop'], tags: ['safety', 'accident', 'inspection'] },
          dot: { docTypes: ['compliance'], tags: ['dot', 'department-of-transportation'] },
          fmcsa: { docTypes: ['compliance'], tags: ['fmcsa', 'federal', 'regulations'] },
          eld: { docTypes: ['compliance', 'sop'], tags: ['eld', 'electronic-logging'] },
          general: { docTypes: ['compliance', 'sop', 'safety'], tags: [] },
        };

        const config = topicConfig[params.topic as string] || topicConfig.general;

        const response = await fetch(`${LOGISTICS_RAG_URL}/api/logistics/retrieve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: params.query,
            docTypes: config.docTypes,
            tags: config.tags.length > 0 ? config.tags : undefined,
            limit: params.limit || 3,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json() as { context: string; totalResults: number; sources: string[] };

        return {
          success: true,
          data: {
            query: params.query,
            topic: params.topic || 'general',
            context: data.context,
            totalResults: data.totalResults,
            sources: data.sources,
          },
          metadata: {
            tool: 'logistics_compliance',
            duration_ms: Date.now() - startTime,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          metadata: {
            tool: 'logistics_compliance',
            duration_ms: Date.now() - startTime,
          },
        };
      }
    },
  };
}

/**
 * Search route and lane information
 */
export function createLogisticsRouteTool(): MCPTool {
  return {
    name: 'logistics_route',
    description: `Search for route and lane-specific information.

Find:
- Truck stops and fuel stations
- Lane-specific procedures
- Regional requirements
- Delivery instructions

Provide origin-destination or lane code (e.g., "LA-CHI").`,
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Route query (e.g., "truck stops from LA to Chicago")',
        required: true,
      },
      {
        name: 'lane',
        type: 'string',
        description: 'Lane code (e.g., "LA-CHI", "DAL-ATL")',
        required: false,
      },
      {
        name: 'origin',
        type: 'string',
        description: 'Origin city/region',
        required: false,
      },
      {
        name: 'destination',
        type: 'string',
        description: 'Destination city/region',
        required: false,
      },
    ],
    execute: async (params): Promise<MCPResult> => {
      const startTime = Date.now();

      try {
        const lanes: string[] = [];
        if (params.lane) lanes.push(params.lane as string);
        if (params.origin && params.destination) {
          lanes.push(`${params.origin}-${params.destination}`.toUpperCase());
        }

        const response = await fetch(`${LOGISTICS_RAG_URL}/api/logistics/retrieve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: params.query,
            docTypes: ['route_guide', 'lane_info', 'sop'],
            lanes: lanes.length > 0 ? lanes : undefined,
            limit: 5,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json() as { context: string; totalResults: number };

        return {
          success: true,
          data: {
            query: params.query,
            lane: params.lane || (params.origin && params.destination ? `${params.origin}-${params.destination}` : null),
            context: data.context,
            totalResults: data.totalResults,
          },
          metadata: {
            tool: 'logistics_route',
            duration_ms: Date.now() - startTime,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          metadata: {
            tool: 'logistics_route',
            duration_ms: Date.now() - startTime,
          },
        };
      }
    },
  };
}

/**
 * Delete a logistics document
 */
export function createLogisticsDeleteTool(): MCPTool {
  return {
    name: 'logistics_delete',
    description: `Delete a logistics document and all its chunks from the knowledge base.

Use with caution - this permanently removes the document.`,
    parameters: [
      {
        name: 'documentId',
        type: 'string',
        description: 'The document ID to delete',
        required: true,
      },
    ],
    execute: async (params): Promise<MCPResult> => {
      const startTime = Date.now();

      try {
        const response = await fetch(`${LOGISTICS_RAG_URL}/api/logistics/document/${params.documentId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json() as { chunksDeleted: number; message: string };

        return {
          success: true,
          data: {
            documentId: params.documentId,
            chunksDeleted: data.chunksDeleted,
            message: data.message,
          },
          metadata: {
            tool: 'logistics_delete',
            duration_ms: Date.now() - startTime,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          metadata: {
            tool: 'logistics_delete',
            duration_ms: Date.now() - startTime,
          },
        };
      }
    },
  };
}

// ============================================================================
// Export all RAG tools
// ============================================================================

export const LOGISTICS_RAG_TOOLS = {
  search: createLogisticsSearchTool,
  retrieve: createLogisticsRetrieveTool,
  ingest: createLogisticsIngestTool,
  stats: createLogisticsStatsTool,
  compliance: createLogisticsComplianceTool,
  route: createLogisticsRouteTool,
  delete: createLogisticsDeleteTool,
};

export function getAllLogisticsRAGTools(): MCPTool[] {
  return Object.values(LOGISTICS_RAG_TOOLS).map(fn => fn());
}

export function getLogisticsRAGToolCount(): number {
  return Object.keys(LOGISTICS_RAG_TOOLS).length;
}
