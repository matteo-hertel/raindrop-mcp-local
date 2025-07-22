import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type {
  ApiResponse,
  Collection,
  UpdateCollectionRequest,
} from '../../types';

// Define the schema for tool parameters
export const schema = {
  id: z.number().describe('The ID of the collection to update'),
  title: z.string().optional().describe('New title for the collection'),
  description: z
    .string()
    .optional()
    .describe('New description for the collection'),
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
  name: 'update_collection',
  description: 'Update an existing collection in Raindrop.io',
  annotations: {
    title: 'Update Collection',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function updateCollection({
  id,
  title,
  description,
  public: isPublic,
  view,
  color,
}: InferSchema<typeof schema>) {
  try {
    const requestData: UpdateCollectionRequest = {};

    if (title !== undefined) requestData.title = title;
    if (description !== undefined) requestData.description = description;
    if (isPublic !== undefined) requestData.public = isPublic;
    if (view !== undefined) requestData.view = view;
    if (color !== undefined) requestData.color = color;

    // Check if we have at least one field to update
    if (Object.keys(requestData).length === 0) {
      throw new Error('At least one field must be provided to update');
    }

    const response = await apiClient.put<ApiResponse<Collection>>(
      `/collection/${id}`,
      requestData
    );

    const collection = response.item;

    if (!collection) {
      throw new Error('Collection was not updated successfully');
    }

    return {
      content: [
        {
          type: 'text',
          text: `Successfully updated collection:\n\n• ${collection.title} (ID: ${collection._id})\n  Description: ${collection.description || 'No description'}\n  Public: ${collection.public}\n  View: ${collection.view}\n  Last Update: ${collection.lastUpdate}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error updating collection: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
