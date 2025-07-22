import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type {
  ApiResponse,
  Highlight,
  CreateHighlightRequest,
} from '../../types';

// Define the schema for tool parameters
export const schema = {
  raindropId: z
    .number()
    .describe('The ID of the raindrop to add a highlight to'),
  text: z.string().min(1).describe('The text content to highlight'),
  note: z
    .string()
    .optional()
    .describe('Optional note or comment for the highlight'),
  color: z
    .enum(['yellow', 'blue', 'red', 'green'])
    .default('yellow')
    .describe('Color of the highlight'),
  tags: z
    .array(z.string())
    .optional()
    .describe('Optional tags to associate with the highlight'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'create_highlight',
  description:
    'Create a new text highlight in a specific raindrop (bookmark) in Raindrop.io',
  annotations: {
    title: 'Create Highlight',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

// Tool implementation
export default async function createHighlight({
  raindropId,
  text,
  note,
  color,
  tags,
}: InferSchema<typeof schema>) {
  try {
    const requestData: CreateHighlightRequest = {
      text,
      color,
      ...(note && { note }),
      ...(tags && { tags }),
    };

    const response = await apiClient.post<ApiResponse<Highlight>>(
      `/highlights/${raindropId}`,
      requestData
    );

    const highlight = response.item;

    if (!highlight) {
      throw new Error('Highlight was not created successfully');
    }

    const formattedOutput = [
      `**New Highlight Created**`,
      `ID: ${highlight._id}`,
      `Text: "${highlight.text}"`,
      `Color: ${highlight.color}`,
      `Created: ${highlight.created}`,
      highlight.note ? `Note: ${highlight.note}` : '',
      highlight.tags && highlight.tags.length > 0
        ? `Tags: ${highlight.tags.join(', ')}`
        : '',
      `Raindrop: ${highlight.title}`,
      `Link: ${highlight.link}`,
    ]
      .filter(Boolean)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Successfully created highlight:\n\n${formattedOutput}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error creating highlight: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
