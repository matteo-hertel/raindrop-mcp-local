import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse, Collection } from '../../types';

// Define the schema for tool parameters
export const schema = {
  // No parameters needed for getting collections
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'get_collections',
  description: 'Retrieve all collections from Raindrop.io',
  annotations: {
    title: 'Get Collections',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function getCollections({}: InferSchema<typeof schema>) {
  try {
    const response =
      await apiClient.get<ApiResponse<Collection>>('/collections');

    const collections = response.items || [];

    return {
      content: [
        {
          type: 'text',
          text: `Retrieved ${collections.length} collections:\n\n${collections
            .map(
              (collection) =>
                `• ${collection.title} (ID: ${collection._id}) - ${collection.count} items\n  ${collection.description || 'No description'}`
            )
            .join('\n\n')}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error retrieving collections: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
