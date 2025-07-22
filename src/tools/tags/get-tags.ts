import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse, Tag } from '../../types';
import { DEFAULT_COLLECTION_ID } from '../../utils/constants';

// Define the schema for tool parameters
export const schema = {
  collectionId: z
    .number()
    .optional()
    .describe(
      'Collection ID to get tags from (0 for unsorted collection, omit for all tags)'
    ),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'get_tags',
  description:
    'Retrieve tags with their usage counts from a specific collection or all collections',
  annotations: {
    title: 'Get Tags',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function getTags({
  collectionId = DEFAULT_COLLECTION_ID,
}: InferSchema<typeof schema>) {
  try {
    const response = await apiClient.get<ApiResponse<Tag>>(
      `/tags/${collectionId}`
    );

    const tags = response.items || [];

    if (tags.length === 0) {
      const collectionText =
        collectionId === DEFAULT_COLLECTION_ID
          ? 'unsorted collection'
          : `collection ${collectionId}`;

      return {
        content: [
          {
            type: 'text',
            text: `No tags found in ${collectionText}.`,
          },
        ],
      };
    }

    // Sort tags by count (descending) and then alphabetically
    const sortedTags = tags.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a._id.localeCompare(b._id);
    });

    const totalTags = sortedTags.length;
    const totalUsages = sortedTags.reduce((sum, tag) => sum + tag.count, 0);

    const tagsList = sortedTags
      .map(
        (tag) =>
          `• ${tag._id} (${tag.count} bookmark${tag.count !== 1 ? 's' : ''})`
      )
      .join('\n');

    const collectionText =
      collectionId === DEFAULT_COLLECTION_ID
        ? 'unsorted collection'
        : `collection ${collectionId}`;

    return {
      content: [
        {
          type: 'text',
          text: `Retrieved ${totalTags} tags from ${collectionText} (${totalUsages} total usages):\n\n${tagsList}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error retrieving tags: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
