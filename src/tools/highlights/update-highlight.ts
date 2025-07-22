import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type {
  ApiResponse,
  Highlight,
  UpdateHighlightRequest,
} from '../../types';

// Define the schema for tool parameters
export const schema = {
  highlightId: z.string().describe('The ID of the highlight to update'),
  text: z
    .string()
    .min(1)
    .optional()
    .describe('New text content for the highlight'),
  note: z
    .string()
    .optional()
    .describe(
      'New note or comment for the highlight (pass empty string to remove note)'
    ),
  color: z
    .enum(['yellow', 'blue', 'red', 'green'])
    .optional()
    .describe('New color for the highlight'),
  tags: z
    .array(z.string())
    .optional()
    .describe('New tags to associate with the highlight'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'update_highlight',
  description:
    "Update an existing highlight's text, color, note, or tags in Raindrop.io",
  annotations: {
    title: 'Update Highlight',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function updateHighlight({
  highlightId,
  text,
  note,
  color,
  tags,
}: InferSchema<typeof schema>) {
  try {
    // Check if at least one field is provided for update
    if (!text && note === undefined && !color && !tags) {
      throw new Error(
        'At least one field (text, note, color, or tags) must be provided for update'
      );
    }

    const requestData: UpdateHighlightRequest = {};

    if (text) requestData.text = text;
    if (note !== undefined) requestData.note = note;
    if (color) requestData.color = color;
    if (tags) requestData.tags = tags;

    const response = await apiClient.put<ApiResponse<Highlight>>(
      `/highlight/${highlightId}`,
      requestData
    );

    const highlight = response.item;

    if (!highlight) {
      throw new Error('Highlight was not updated successfully');
    }

    const formattedOutput = [
      `**Highlight Updated**`,
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
          text: `Successfully updated highlight:\n\n${formattedOutput}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error updating highlight: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
