import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse } from '../../types';

// Define the schema for tool parameters
export const schema = {
  id: z.number().describe('The ID of the raindrop to delete'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'delete_raindrop',
  description: 'Delete a raindrop (bookmark) from Raindrop.io',
  annotations: {
    title: 'Delete Raindrop',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function deleteRaindrop({
  id,
}: InferSchema<typeof schema>) {
  try {
    const response = await apiClient.delete<ApiResponse<any>>(
      `/raindrop/${id}`
    );

    if (!response.result) {
      throw new Error(`Failed to delete raindrop with ID ${id}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Successfully deleted raindrop with ID: ${id}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error deleting raindrop: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
