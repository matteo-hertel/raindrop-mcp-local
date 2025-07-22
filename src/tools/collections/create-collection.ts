import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type {
  ApiResponse,
  Collection,
  CreateCollectionRequest,
} from '../../types';

// Define the schema for tool parameters
export const schema = {
  title: z.string().describe('The name of the collection'),
  description: z.string().optional().describe('Description for the collection'),
  public: z
    .boolean()
    .optional()
    .describe('Whether the collection should be public'),
  view: z
    .enum(['list', 'simple', 'grid', 'masonry'])
    .optional()
    .describe('View type for the collection'),
  color: z.string().optional().describe('Color for the collection'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'create_collection',
  description: 'Create a new collection in Raindrop.io',
  annotations: {
    title: 'Create Collection',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

// Tool implementation
export default async function createCollection({
  title,
  description,
  public: isPublic,
  view,
  color,
}: InferSchema<typeof schema>) {
  try {
    const requestData: CreateCollectionRequest = {
      title,
      ...(description && { description }),
      ...(isPublic !== undefined && { public: isPublic }),
      ...(view && { view }),
      ...(color && { color }),
    };

    const response = await apiClient.post<ApiResponse<Collection>>(
      '/collection',
      requestData
    );

    const collection = response.item;

    if (!collection) {
      throw new Error('Collection was not created successfully');
    }

    return {
      content: [
        {
          type: 'text',
          text: `Successfully created collection:\n\n• ${collection.title} (ID: ${collection._id})\n  Description: ${collection.description || 'No description'}\n  Public: ${collection.public}\n  View: ${collection.view}\n  Created: ${collection.created}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error creating collection: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
