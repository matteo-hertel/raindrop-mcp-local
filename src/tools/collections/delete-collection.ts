import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse } from '../../types';

// Define the schema for tool parameters
export const schema = {
  id: z.number().describe('The ID of the collection to delete'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'delete_collection',
  description: 'Delete a collection from Raindrop.io',
  annotations: {
    title: 'Delete Collection',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
  },
};

// Tool implementation
export default async function deleteCollection({
  id,
}: InferSchema<typeof schema>) {
  try {
    const response = await apiClient.delete<ApiResponse<any>>(
      `/collection/${id}`
    );

    if (response.result) {
      return {
        content: [
          {
            type: 'text',
            text: `Successfully deleted collection with ID: ${id}`,
          },
        ],
      };
    } else {
      throw new Error('Collection deletion was not successful');
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error deleting collection: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
