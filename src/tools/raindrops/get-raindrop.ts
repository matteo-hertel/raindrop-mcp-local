import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse, Raindrop } from '../../types';

// Define the schema for tool parameters
export const schema = {
  id: z.number().describe('The ID of the raindrop to retrieve'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'get_raindrop',
  description: 'Retrieve a single raindrop (bookmark) by ID from Raindrop.io',
  annotations: {
    title: 'Get Raindrop',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function getRaindrop({ id }: InferSchema<typeof schema>) {
  try {
    const response = await apiClient.get<ApiResponse<Raindrop>>(
      `/raindrop/${id}`
    );

    const raindrop = response.item;

    if (!raindrop) {
      throw new Error(`Raindrop with ID ${id} not found`);
    }

    const formattedOutput = [
      `**${raindrop.title}**`,
      `URL: ${raindrop.link}`,
      `ID: ${raindrop._id}`,
      `Collection: ${raindrop.collection?.$id || 'None'}`,
      `Type: ${raindrop.type || 'link'}`,
      `Domain: ${raindrop.domain || 'Unknown'}`,
      `Created: ${raindrop.created}`,
      `Last Updated: ${raindrop.lastUpdate}`,
      raindrop.excerpt ? `Excerpt: ${raindrop.excerpt}` : '',
      raindrop.note ? `Note: ${raindrop.note}` : '',
      raindrop.tags.length > 0
        ? `Tags: ${raindrop.tags.join(', ')}`
        : 'No tags',
      raindrop.important ? 'Status: Important ⭐' : '',
      raindrop.broken ? 'Status: Broken ⚠️' : '',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Retrieved raindrop:\n\n${formattedOutput}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error retrieving raindrop: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
