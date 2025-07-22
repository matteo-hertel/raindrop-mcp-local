import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse, Raindrop, UpdateRaindropRequest } from '../../types';

// Define the schema for tool parameters
export const schema = {
  id: z.number().describe('The ID of the raindrop to update'),
  title: z.string().optional().describe('New title for the bookmark'),
  excerpt: z
    .string()
    .optional()
    .describe('New excerpt/description for the bookmark'),
  note: z.string().optional().describe('New personal note for the bookmark'),
  tags: z
    .array(z.string())
    .optional()
    .describe('New array of tags (replaces existing tags)'),
  important: z
    .boolean()
    .optional()
    .describe('Mark the bookmark as important or not'),
  collectionId: z
    .number()
    .optional()
    .describe('ID of the collection to move the bookmark to'),
  cover: z.string().url().optional().describe('New cover image URL'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'update_raindrop',
  description: 'Update an existing raindrop (bookmark) in Raindrop.io',
  annotations: {
    title: 'Update Raindrop',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function updateRaindrop({
  id,
  title,
  excerpt,
  note,
  tags,
  important,
  collectionId,
  cover,
}: InferSchema<typeof schema>) {
  try {
    // Build update request with only provided fields
    const requestData: UpdateRaindropRequest = {};

    if (title !== undefined) requestData.title = title;
    if (excerpt !== undefined) requestData.excerpt = excerpt;
    if (note !== undefined) requestData.note = note;
    if (tags !== undefined) requestData.tags = tags;
    if (important !== undefined) requestData.important = important;
    if (collectionId !== undefined)
      requestData.collection = { $id: collectionId };
    if (cover !== undefined) requestData.cover = cover;

    // Check if there are any fields to update
    if (Object.keys(requestData).length === 0) {
      throw new Error(
        'No fields provided for update. Please specify at least one field to update.'
      );
    }

    const response = await apiClient.put<ApiResponse<Raindrop>>(
      `/raindrop/${id}`,
      requestData
    );

    const raindrop = response.item;

    if (!raindrop) {
      throw new Error(`Raindrop with ID ${id} not found or update failed`);
    }

    const formattedOutput = [
      `**${raindrop.title}**`,
      `URL: ${raindrop.link}`,
      `ID: ${raindrop._id}`,
      `Collection: ${raindrop.collection?.$id || 'Unsorted'}`,
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
          text: `Successfully updated raindrop:\n\n${formattedOutput}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error updating raindrop: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
