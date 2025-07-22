import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse } from '../../types';

// Define the schema for tool parameters
export const schema = {
  ids: z
    .array(z.number())
    .min(1)
    .max(10)
    .describe('Array of raindrop IDs to delete (max 10)'),
  stopOnError: z
    .boolean()
    .optional()
    .default(false)
    .describe('Stop processing if any deletion fails'),
  confirmDeletion: z
    .boolean()
    .default(false)
    .describe('Confirmation flag - must be true to proceed with deletion'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'bulk_delete_raindrops',
  description:
    'Delete multiple raindrops (bookmarks) in a single operation. Maximum 10 deletions per request. Requires confirmation.',
  annotations: {
    title: 'Bulk Delete Raindrops',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
  },
};

// Tool implementation
export default async function bulkDeleteRaindrops({
  ids,
  stopOnError = false,
  confirmDeletion = false,
}: InferSchema<typeof schema>) {
  // Safety check - require explicit confirmation
  if (!confirmDeletion) {
    return {
      content: [
        {
          type: 'text',
          text: `⚠️ **Deletion Confirmation Required**\n\nYou are about to delete ${ids.length} raindrop(s) with IDs: ${ids.join(', ')}\n\n**This action cannot be undone!**\n\nTo proceed, call this tool again with \`confirmDeletion: true\``,
        },
      ],
    };
  }

  const results: Array<{
    index: number;
    id: number;
    success: boolean;
    error?: string;
  }> = [];

  let successCount = 0;
  let errorCount = 0;

  try {
    for (let i = 0; i < ids.length; i++) {
      const raindropId = ids[i];

      try {
        // Make API request to delete the raindrop
        await apiClient.delete<ApiResponse<any>>(`/raindrop/${raindropId}`);

        results.push({
          index: i,
          id: raindropId,
          success: true,
        });
        successCount++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        results.push({
          index: i,
          id: raindropId,
          success: false,
          error: errorMessage,
        });
        errorCount++;

        // Stop processing if stopOnError is true
        if (stopOnError) {
          break;
        }
      }
    }

    // Format output
    const successResults = results.filter((r) => r.success);
    const errorResults = results.filter((r) => !r.success);

    let output = `Bulk deletion completed:\n✅ ${successCount} successful\n❌ ${errorCount} failed\n\n`;

    if (successResults.length > 0) {
      output += '**Successfully Deleted:**\n';
      successResults.forEach((result) => {
        output += `${result.index + 1}. Raindrop ID: ${result.id}\n`;
      });
      output += '\n';
    }

    if (errorResults.length > 0) {
      output += '**Failed to Delete:**\n';
      errorResults.forEach((result) => {
        output += `${result.index + 1}. Raindrop ID: ${result.id}\n`;
        output += `   Error: ${result.error}\n\n`;
      });
    }

    // Add warning about irreversibility
    output += '\n⚠️ **Note:** Deleted raindrops cannot be recovered.';

    return {
      content: [
        {
          type: 'text',
          text: output.trim(),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error during bulk deletion: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
