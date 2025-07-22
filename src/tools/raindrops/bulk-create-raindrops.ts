import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse, Raindrop, CreateRaindropRequest } from '../../types';

// Define the schema for a single raindrop creation
const raindropInputSchema = z.object({
  link: z.string().url().describe('URL of the bookmark'),
  title: z.string().optional().describe('Custom title for the bookmark'),
  excerpt: z.string().optional().describe('Custom excerpt/description'),
  note: z.string().optional().describe('Personal note for the bookmark'),
  tags: z
    .array(z.string())
    .optional()
    .describe('Tags to assign to the bookmark'),
  important: z.boolean().optional().describe('Mark as important'),
  collectionId: z
    .number()
    .optional()
    .describe('Collection ID to add the bookmark to'),
  type: z
    .enum(['link', 'article', 'image', 'video', 'document', 'audio'])
    .optional()
    .describe('Type of content'),
  cover: z.string().url().optional().describe('Cover image URL'),
  pleaseParse: z
    .object({
      link: z.boolean().optional().describe('Parse metadata from link'),
      title: z.boolean().optional().describe('Parse title from link'),
      excerpt: z.boolean().optional().describe('Parse excerpt from link'),
    })
    .optional()
    .describe('Auto-parsing options'),
});

// Define the schema for tool parameters
export const schema = {
  raindrops: z
    .array(raindropInputSchema)
    .min(1)
    .max(10)
    .describe('Array of raindrops to create (max 10)'),
  defaultCollectionId: z
    .number()
    .optional()
    .describe(
      'Default collection ID for raindrops without explicit collection'
    ),
  stopOnError: z
    .boolean()
    .optional()
    .default(false)
    .describe('Stop processing if any raindrop creation fails'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'bulk_create_raindrops',
  description:
    'Create multiple raindrops (bookmarks) in a single operation. Maximum 10 raindrops per request.',
  annotations: {
    title: 'Bulk Create Raindrops',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

// Tool implementation
export default async function bulkCreateRaindrops({
  raindrops,
  defaultCollectionId,
  stopOnError = false,
}: InferSchema<typeof schema>) {
  const results: Array<{
    index: number;
    success: boolean;
    raindrop?: Raindrop;
    error?: string;
    input: any;
  }> = [];

  let successCount = 0;
  let errorCount = 0;

  try {
    for (let i = 0; i < raindrops.length; i++) {
      const raindropInput = raindrops[i];

      try {
        // Prepare the request data
        const requestData: CreateRaindropRequest = {
          link: raindropInput.link,
        };

        // Add optional fields
        if (raindropInput.title) requestData.title = raindropInput.title;
        if (raindropInput.excerpt) requestData.excerpt = raindropInput.excerpt;
        if (raindropInput.note) requestData.note = raindropInput.note;
        if (raindropInput.tags) requestData.tags = raindropInput.tags;
        if (raindropInput.important !== undefined)
          requestData.important = raindropInput.important;
        if (raindropInput.type) requestData.type = raindropInput.type;
        if (raindropInput.cover) requestData.cover = raindropInput.cover;
        if (raindropInput.pleaseParse)
          requestData.pleaseParse = raindropInput.pleaseParse;

        // Set collection
        const collectionId = raindropInput.collectionId ?? defaultCollectionId;
        if (collectionId !== undefined) {
          requestData.collection = { $id: collectionId };
        }

        // Make API request
        const response = await apiClient.post<ApiResponse<Raindrop>>(
          '/raindrop',
          requestData
        );

        if (!response.item) {
          throw new Error('No raindrop returned from API');
        }

        results.push({
          index: i,
          success: true,
          raindrop: response.item,
          input: raindropInput,
        });
        successCount++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        results.push({
          index: i,
          success: false,
          error: errorMessage,
          input: raindropInput,
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

    let output = `Bulk creation completed:\n✅ ${successCount} successful\n❌ ${errorCount} failed\n\n`;

    if (successResults.length > 0) {
      output += '**Successfully Created:**\n';
      successResults.forEach((result) => {
        const raindrop = result.raindrop!;
        output += `${result.index + 1}. **${raindrop.title}**\n`;
        output += `   URL: ${raindrop.link}\n`;
        output += `   ID: ${raindrop._id}\n`;
        output += `   Collection: ${raindrop.collection?.$id || 'None'}\n`;
        if (raindrop.tags.length > 0) {
          output += `   Tags: ${raindrop.tags.join(', ')}\n`;
        }
        output += '\n';
      });
    }

    if (errorResults.length > 0) {
      output += '\n**Failed to Create:**\n';
      errorResults.forEach((result) => {
        output += `${result.index + 1}. ${result.input.link}\n`;
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
          text: `Error during bulk creation: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
