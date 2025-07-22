import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse } from '../../types';

// Define the schema for tool parameters
export const schema = {
  oldTag: z.string().min(1).describe('Current name of the tag to rename'),
  newTag: z.string().min(1).describe('New name for the tag'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'rename_tag',
  description: 'Rename an existing tag across all bookmarks',
  annotations: {
    title: 'Rename Tag',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function renameTag({
  oldTag,
  newTag,
}: InferSchema<typeof schema>) {
  try {
    // Validate input
    if (oldTag.trim() === newTag.trim()) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Old tag name and new tag name are the same. No changes needed.',
          },
        ],
      };
    }

    // Make API request to rename tag
    const response = await apiClient.put<ApiResponse<any>>('/tags', {
      rename: {
        [oldTag]: newTag,
      },
    });

    if (!response.result) {
      throw new Error('Tag rename operation failed');
    }

    return {
      content: [
        {
          type: 'text',
          text: `Successfully renamed tag "${oldTag}" to "${newTag}" across all bookmarks.`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error renaming tag: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
