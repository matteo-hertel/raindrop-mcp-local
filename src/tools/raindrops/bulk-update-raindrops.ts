import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse, Raindrop, UpdateRaindropRequest } from '../../types';

// Define the schema for a single raindrop update
const raindropUpdateSchema = z.object({
  id: z.number().describe('ID of the raindrop to update'),
  title: z.string().optional().describe('New title for the bookmark'),
  excerpt: z.string().optional().describe('New excerpt/description'),
  note: z.string().optional().describe('New personal note'),
  tags: z
    .array(z.string())
    .optional()
    .describe('New tags (will replace existing tags)'),
  important: z.boolean().optional().describe('Update important status'),
  collectionId: z.number().optional().describe('Move to different collection'),
  cover: z.string().url().optional().describe('New cover image URL'),
});

// Define the schema for tool parameters
export const schema = {
  updates: z
    .array(raindropUpdateSchema)
    .min(1)
    .max(10)
    .describe('Array of raindrop updates to apply (max 10)'),
  stopOnError: z
    .boolean()
    .optional()
    .default(false)
    .describe('Stop processing if any update fails'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'bulk_update_raindrops',
  description:
    'Update multiple raindrops (bookmarks) in a single operation. Maximum 10 updates per request.',
  annotations: {
    title: 'Bulk Update Raindrops',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

// Tool implementation
export default async function bulkUpdateRaindrops({
  updates,
  stopOnError = false,
}: InferSchema<typeof schema>) {
  const results: Array<{
    index: number;
    id: number;
    success: boolean;
    raindrop?: Raindrop;
    error?: string;
    input: any;
  }> = [];

  let successCount = 0;
  let errorCount = 0;

  try {
    for (let i = 0; i < updates.length; i++) {
      const updateData = updates[i];

      try {
        // Prepare the request data
        const requestData: UpdateRaindropRequest = {};

        // Add fields that should be updated
        if (updateData.title !== undefined)
          requestData.title = updateData.title;
        if (updateData.excerpt !== undefined)
          requestData.excerpt = updateData.excerpt;
        if (updateData.note !== undefined) requestData.note = updateData.note;
        if (updateData.tags !== undefined) requestData.tags = updateData.tags;
        if (updateData.important !== undefined)
          requestData.important = updateData.important;
        if (updateData.cover !== undefined)
          requestData.cover = updateData.cover;

        // Set collection if specified
        if (updateData.collectionId !== undefined) {
          requestData.collection = { $id: updateData.collectionId };
        }

        // Check if there are any updates to apply
        if (Object.keys(requestData).length === 0) {
          throw new Error('No updates specified');
        }

        // Make API request
        const response = await apiClient.put<ApiResponse<Raindrop>>(
          `/raindrop/${updateData.id}`,
          requestData
        );

        if (!response.item) {
          throw new Error('No updated raindrop returned from API');
        }

        results.push({
          index: i,
          id: updateData.id,
          success: true,
          raindrop: response.item,
          input: updateData,
        });
        successCount++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        results.push({
          index: i,
          id: updateData.id,
          success: false,
          error: errorMessage,
          input: updateData,
        });
        errorCount++;

        // Stop processing if stopOnError is true
        if (stopOnError) {
          break;
        }
      }
    }

    // Format output
    const successResults = results.filter((r) => r.success);
    const errorResults = results.filter((r) => !r.success);

    let output = `Bulk update completed:\n✅ ${successCount} successful\n❌ ${errorCount} failed\n\n`;

    if (successResults.length > 0) {
      output += '**Successfully Updated:**\n';
      successResults.forEach((result) => {
        const raindrop = result.raindrop!;
        const updates = result.input;

        output += `${result.index + 1}. **${raindrop.title}** (ID: ${raindrop._id})\n`;
        output += `   URL: ${raindrop.link}\n`;

        // Show what was updated
        const updatedFields: string[] = [];
        if (updates.title !== undefined) updatedFields.push('title');
        if (updates.excerpt !== undefined) updatedFields.push('excerpt');
        if (updates.note !== undefined) updatedFields.push('note');
        if (updates.tags !== undefined) updatedFields.push('tags');
        if (updates.important !== undefined) updatedFields.push('important');
        if (updates.collectionId !== undefined)
          updatedFields.push('collection');
        if (updates.cover !== undefined) updatedFields.push('cover');

        if (updatedFields.length > 0) {
          output += `   Updated: ${updatedFields.join(', ')}\n`;
        }

        output += `   Collection: ${raindrop.collection?.$id || 'None'}\n`;
        if (raindrop.tags.length > 0) {
          output += `   Tags: ${raindrop.tags.join(', ')}\n`;
        }
        if (raindrop.important) {
          output += `   Status: Important ⭐\n`;
        }
        output += '\n';
      });
    }

    if (errorResults.length > 0) {
      output += '\n**Failed to Update:**\n';
      errorResults.forEach((result) => {
        output += `${result.index + 1}. Raindrop ID: ${result.id}\n`;
        output += `   Error: ${result.error}\n\n`;
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: output.trim(),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error during bulk update: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
