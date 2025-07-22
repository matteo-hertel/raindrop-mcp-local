import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { FilterResponse } from '../../types';
import { API_ENDPOINTS } from '../../utils/constants';

// Define the schema for tool parameters
export const schema = {
  collectionId: z
    .number()
    .optional()
    .default(0)
    .describe(
      'Collection ID to get filters for (0 = All, -1 = Unsorted, -99 = Trash)'
    ),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'get_filters',
  description:
    'Retrieve filter statistics (tags, types, status counts) for a collection in Raindrop.io',
  annotations: {
    title: 'Get Filters Statistics',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function getFilters({
  collectionId,
}: InferSchema<typeof schema>) {
  try {
    const response = await apiClient.get<FilterResponse>(
      API_ENDPOINTS.FILTERS(collectionId)
    );

    const getCollectionName = (id: number) => {
      switch (id) {
        case 0:
          return 'All Collections';
        case -1:
          return 'Unsorted';
        case -99:
          return 'Trash';
        default:
          return `Collection ${id}`;
      }
    };

    const formattedOutput = [
      `**Filter Statistics for ${getCollectionName(collectionId)}**`,
      '',
      '**Content Types:**',
      response.types && response.types.length > 0
        ? response.types
            .sort((a, b) => b.count - a.count)
            .map((type) => `• ${type._id}: ${type.count} items`)
            .join('\n')
        : 'No type data available',
      '',
      '**Status Counts:**',
      [
        response.important
          ? `• Important: ${response.important.count} items`
          : '',
        response.broken ? `• Broken links: ${response.broken.count} items` : '',
        response.duplicate
          ? `• Duplicates: ${response.duplicate.count} items`
          : '',
      ]
        .filter(Boolean)
        .join('\n') || 'No status data available',
      '',
      '**Most Used Tags:**',
      response.tags && response.tags.length > 0
        ? response.tags
            .sort((a, b) => b.count - a.count)
            .slice(0, 20) // Show top 20 tags
            .map((tag, index) => `${index + 1}. ${tag._id}: ${tag.count} items`)
            .join('\n')
        : 'No tags found',
      '',
      response.tags && response.tags.length > 20
        ? `... and ${response.tags.length - 20} more tags`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: formattedOutput,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error retrieving filters: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
