import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ParsedUrl } from '../../types';
import { API_ENDPOINTS } from '../../utils/constants';

// Define the schema for tool parameters
export const schema = {
  url: z.string().url().describe('URL to parse and extract metadata from'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'parse_url',
  description:
    'Parse a URL and extract metadata (title, description, type, etc.) without creating a bookmark',
  annotations: {
    title: 'Parse URL Metadata',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function parseUrl({ url }: InferSchema<typeof schema>) {
  try {
    // Use the import/url endpoint with parseOnly to just get metadata
    const response = await apiClient.post<ParsedUrl>(API_ENDPOINTS.IMPORT_URL, {
      link: url,
      parseOnly: true,
    });

    const formattedOutput = [
      `**URL Metadata for:** ${url}`,
      '',
      `**Title:** ${response.title || 'Not available'}`,
      `**Type:** ${response.type || 'link'}`,
      `**Domain:** ${response.domain || 'Unknown'}`,
      response.description ? `**Description:** ${response.description}` : '',
      response.cover ? `**Cover Image:** ${response.cover}` : '',
      '',
      '**Additional Information:**',
      response.meta
        ? [
            response.meta.charset
              ? `• Character set: ${response.meta.charset}`
              : '',
            response.meta.language
              ? `• Language: ${response.meta.language}`
              : '',
            response.meta.keywords && response.meta.keywords.length > 0
              ? `• Keywords: ${response.meta.keywords.join(', ')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n')
        : 'No additional metadata available',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: formattedOutput,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error parsing URL: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
