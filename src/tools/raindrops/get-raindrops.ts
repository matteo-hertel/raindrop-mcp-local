import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse, Raindrop } from '../../types';

// Define the schema for tool parameters
export const schema = {
  collectionId: z
    .number()
    .optional()
    .describe(
      'Collection ID to search in (0 for all collections, -1 for unsorted)'
    ),
  search: z.string().optional().describe('Search query to filter raindrops'),
  sort: z
    .enum(['-created', '-lastUpdate', '-sort', 'title', '-title'])
    .optional()
    .describe('Sort order for results'),
  page: z
    .number()
    .min(0)
    .optional()
    .describe('Page number (0-based) for pagination'),
  perpage: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .describe('Number of items per page (1-50)'),
  important: z.boolean().optional().describe('Filter by important status'),
  broken: z.boolean().optional().describe('Filter by broken status'),
  type: z
    .enum(['link', 'article', 'image', 'video', 'document', 'audio'])
    .optional()
    .describe('Filter by raindrop type'),
  tags: z
    .array(z.string())
    .optional()
    .describe('Filter by tags (AND operation)'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'get_raindrops',
  description:
    'Search and retrieve raindrops (bookmarks) from Raindrop.io with advanced filtering and pagination',
  annotations: {
    title: 'Get Raindrops',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function getRaindrops({
  collectionId = 0,
  search,
  sort = '-created',
  page = 0,
  perpage = 25,
  important,
  broken,
  type,
  tags,
}: InferSchema<typeof schema>) {
  try {
    // Build query parameters
    const params: Record<string, any> = {
      sort,
      page,
      perpage,
    };

    // Add search query if provided
    if (search) {
      params.search = search;
    }

    // Add filters
    if (important !== undefined) {
      params.important = important;
    }
    if (broken !== undefined) {
      params.broken = broken;
    }
    if (type) {
      params.type = type;
    }
    if (tags && tags.length > 0) {
      params.tags = tags.join(',');
    }

    // Make API request
    const response = await apiClient.get<ApiResponse<Raindrop>>(
      `/raindrops/${collectionId}`,
      params
    );

    const raindrops = response.items || [];
    const count = response.count || 0;

    if (raindrops.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No raindrops found${search ? ` for search query: "${search}"` : ''}\n\nTotal count: ${count}`,
          },
        ],
      };
    }

    const formattedOutput = raindrops
      .map((raindrop) => {
        const statusFlags = [
          raindrop.important ? '⭐ Important' : '',
          raindrop.broken ? '⚠️ Broken' : '',
        ].filter(Boolean);

        return [
          `**${raindrop.title}**`,
          `URL: ${raindrop.link}`,
          `ID: ${raindrop._id}`,
          `Collection: ${raindrop.collection?.$id || 'None'}`,
          `Type: ${raindrop.type || 'link'}`,
          `Domain: ${raindrop.domain || 'Unknown'}`,
          `Created: ${raindrop.created}`,
          raindrop.excerpt ? `Excerpt: ${raindrop.excerpt}` : '',
          raindrop.note ? `Note: ${raindrop.note}` : '',
          raindrop.tags.length > 0 ? `Tags: ${raindrop.tags.join(', ')}` : '',
          statusFlags.length > 0 ? `Status: ${statusFlags.join(', ')}` : '',
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n\n---\n\n');

    const paginationInfo = [
      `Total raindrops: ${count}`,
      `Page: ${page + 1}`,
      `Per page: ${perpage}`,
      `Showing: ${raindrops.length} items`,
    ].join(' | ');

    return {
      content: [
        {
          type: 'text',
          text: `Retrieved raindrops:\n\n${paginationInfo}\n\n${formattedOutput}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error retrieving raindrops: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
