import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ImportFileRequest, ImportFileResponse } from '../../types';
import { API_ENDPOINTS } from '../../utils/constants';

// Define the schema for tool parameters
export const schema = {
  html: z
    .string()
    .optional()
    .describe(
      'HTML content of bookmark export file (e.g., from browser export)'
    ),
  url: z
    .string()
    .url()
    .optional()
    .describe('URL to a bookmark export file to download and parse'),
  folder: z
    .string()
    .optional()
    .describe('Default folder/collection name for imported bookmarks'),
  parseOnly: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'If true, only parse and preview import without actually creating bookmarks'
    ),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'parse_import_file',
  description:
    'Parse a bookmark import file (HTML format) and preview or import bookmarks to Raindrop.io',
  annotations: {
    title: 'Parse Import File',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

// Tool implementation
export default async function parseImportFile({
  html,
  url,
  folder,
  parseOnly,
}: InferSchema<typeof schema>) {
  try {
    if (!html && !url) {
      throw new Error('Either html content or url must be provided');
    }

    const requestData: ImportFileRequest = {
      ...(html && { html }),
      ...(url && { url }),
      ...(folder && { folder }),
      ...(parseOnly !== undefined && { parseOnly }),
    };

    const response = await apiClient.post<ImportFileResponse>(
      API_ENDPOINTS.IMPORT_FILE,
      requestData
    );

    const items = response.items || [];
    const count = response.count || items.length;

    if (parseOnly) {
      const formattedOutput = [
        `**Import File Preview**`,
        '',
        `**Total bookmarks found:** ${count}`,
        folder ? `**Default folder:** ${folder}` : '',
        '',
        '**Sample bookmarks (first 10):**',
        items
          .slice(0, 10)
          .map((item, index) => {
            return [
              `${index + 1}. **${item.title}**`,
              `   URL: ${item.link}`,
              item.folder ? `   Folder: ${item.folder}` : '',
              item.tags && item.tags.length > 0
                ? `   Tags: ${item.tags.join(', ')}`
                : '',
              item.note ? `   Note: ${item.note}` : '',
            ]
              .filter(Boolean)
              .join('\n');
          })
          .join('\n\n'),
        '',
        count > 10 ? `... and ${count - 10} more bookmarks` : '',
        '',
        '**To actually import these bookmarks, set parseOnly to false**',
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
    } else {
      // Actual import performed
      const formattedOutput = [
        `**Import Completed Successfully!**`,
        '',
        `**Total bookmarks imported:** ${count}`,
        folder ? `**Imported to folder:** ${folder}` : '',
        '',
        '**Recently imported bookmarks (first 5):**',
        items
          .slice(0, 5)
          .map((item, index) => {
            return [
              `${index + 1}. **${item.title}**`,
              `   URL: ${item.link}`,
              item.folder ? `   Folder: ${item.folder}` : '',
              item.tags && item.tags.length > 0
                ? `   Tags: ${item.tags.join(', ')}`
                : '',
            ]
              .filter(Boolean)
              .join('\n');
          })
          .join('\n\n'),
        '',
        count > 5 ? `... and ${count - 5} more bookmarks imported` : '',
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
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error parsing import file: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
