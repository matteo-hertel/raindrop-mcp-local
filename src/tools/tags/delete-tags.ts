import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse } from '../../types';

// Define the schema for tool parameters
export const schema = {
  tags: z
    .array(z.string().min(1))
    .min(1)
    .describe('Array of tag names to delete from all bookmarks'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'delete_tags',
  description:
    'Delete specified tags from all bookmarks across all collections',
  annotations: {
    title: 'Delete Tags',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
  },
};

// Tool implementation
export default async function deleteTags({ tags }: InferSchema<typeof schema>) {
  try {
    // Validate input
    if (tags.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: No tags provided for deletion.',
          },
        ],
      };
    }

    // Remove duplicates from tags
    const uniqueTags = [...new Set(tags)];

    // Make API request to delete tags
    const response = await apiClient.delete<ApiResponse<any>>(
      `/tags?tags=${uniqueTags.join(',')}`
    );

    if (!response.result) {
      throw new Error('Tag deletion operation failed');
    }

    const tagCount = uniqueTags.length;
    const tagsList = uniqueTags.map((tag) => `"${tag}"`).join(', ');

    return {
      content: [
        {
          type: 'text',
          text: `Successfully deleted ${tagCount} tag${tagCount !== 1 ? 's' : ''}: ${tagsList}\n\nThese tags have been removed from all bookmarks across all collections.`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error deleting tags: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
