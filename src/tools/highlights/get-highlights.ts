import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse, Highlight } from '../../types';

// Define the schema for tool parameters
export const schema = {
  raindropId: z
    .number()
    .describe('The ID of the raindrop to get highlights from'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'get_highlights',
  description:
    'Retrieve all highlights from a specific raindrop (bookmark) in Raindrop.io',
  annotations: {
    title: 'Get Highlights',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function getHighlights({
  raindropId,
}: InferSchema<typeof schema>) {
  try {
    const response = await apiClient.get<ApiResponse<Highlight>>(
      `/highlights/${raindropId}`
    );

    const highlights = response.items || [];

    if (highlights.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No highlights found for raindrop ID ${raindropId}`,
          },
        ],
      };
    }

    const formattedOutput = highlights
      .map((highlight, index) => {
        const parts = [
          `**Highlight ${index + 1}** (ID: ${highlight._id})`,
          `Text: "${highlight.text}"`,
          `Color: ${highlight.color}`,
          `Created: ${highlight.created}`,
          highlight.note ? `Note: ${highlight.note}` : '',
          highlight.tags && highlight.tags.length > 0
            ? `Tags: ${highlight.tags.join(', ')}`
            : '',
          `Link: ${highlight.link}`,
          `Title: ${highlight.title}`,
        ].filter(Boolean);

        return parts.join('\n');
      })
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${highlights.length} highlight${highlights.length === 1 ? '' : 's'} for raindrop ID ${raindropId}:\n\n${formattedOutput}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error retrieving highlights: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
