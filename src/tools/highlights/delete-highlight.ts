import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse } from '../../types';

// Define the schema for tool parameters
export const schema = {
  highlightId: z.string().describe('The ID of the highlight to delete'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'delete_highlight',
  description: 'Delete a specific highlight from Raindrop.io',
  annotations: {
    title: 'Delete Highlight',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function deleteHighlight({
  highlightId,
}: InferSchema<typeof schema>) {
  try {
    const response = await apiClient.delete<ApiResponse<any>>(
      `/highlight/${highlightId}`
    );

    if (!response.result) {
      throw new Error('Failed to delete highlight');
    }

    return {
      content: [
        {
          type: 'text',
          text: `Successfully deleted highlight with ID: ${highlightId}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error deleting highlight: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
