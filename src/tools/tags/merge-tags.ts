import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse } from '../../types';

// Define the schema for tool parameters
export const schema = {
  sourceTags: z
    .array(z.string().min(1))
    .min(1)
    .describe('Array of source tag names to merge'),
  targetTag: z
    .string()
    .min(1)
    .describe('Target tag name to merge all source tags into'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'merge_tags',
  description:
    'Merge multiple tags into a single target tag across all bookmarks',
  annotations: {
    title: 'Merge Tags',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
  },
};

// Tool implementation
export default async function mergeTags({
  sourceTags,
  targetTag,
}: InferSchema<typeof schema>) {
  try {
    // Validate input
    if (sourceTags.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: No source tags provided for merging.',
          },
        ],
      };
    }

    // Check if target tag is in source tags
    if (sourceTags.includes(targetTag)) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Target tag "${targetTag}" cannot be one of the source tags.`,
          },
        ],
      };
    }

    // Remove duplicates from source tags
    const uniqueSourceTags = [...new Set(sourceTags)];

    // Make API request to merge tags
    const response = await apiClient.put<ApiResponse<any>>('/tags/merge', {
      tags: uniqueSourceTags,
      tag: targetTag,
    });

    if (!response.result) {
      throw new Error('Tag merge operation failed');
    }

    const sourceTagsList = uniqueSourceTags.map((tag) => `"${tag}"`).join(', ');

    return {
      content: [
        {
          type: 'text',
          text: `Successfully merged tags ${sourceTagsList} into "${targetTag}" across all bookmarks.\n\nThe source tags have been replaced with "${targetTag}" on all affected bookmarks.`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error merging tags: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
