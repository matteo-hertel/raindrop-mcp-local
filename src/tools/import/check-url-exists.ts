import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { UrlExistsResponse } from '../../types';

// Define the schema for tool parameters
export const schema = {
  url: z
    .string()
    .url()
    .describe('URL to check if it already exists in Raindrop.io'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'check_url_exists',
  description: 'Check if a URL already exists as a bookmark in Raindrop.io',
  annotations: {
    title: 'Check URL Exists',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function checkUrlExists({
  url,
}: InferSchema<typeof schema>) {
  try {
    // Use the import/url endpoint with a check flag to see if URL already exists
    const response = await apiClient.post<UrlExistsResponse>(
      '/import/url/exists',
      {
        link: url,
      }
    );

    if (response.exists && response.raindrop) {
      const raindrop = response.raindrop;
      const formattedOutput = [
        `**URL Already Exists!**`,
        '',
        `**Original URL:** ${url}`,
        `**Stored URL:** ${response.link || url}`,
        '',
        '**Existing Bookmark Details:**',
        `• Title: ${raindrop.title}`,
        `• ID: ${raindrop._id}`,
        `• Collection: ${raindrop.collection?.$id || 'Unsorted'}`,
        `• Created: ${new Date(raindrop.created).toLocaleDateString()}`,
      ].join('\n');

      return {
        content: [
          {
            type: 'text',
            text: formattedOutput,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `**URL is not bookmarked yet**\n\nThe URL ${url} does not exist in your Raindrop.io collection. You can safely create a new bookmark for this URL.`,
          },
        ],
      };
    }
  } catch (error) {
    // If the endpoint doesn't exist, fall back to searching for the URL
    try {
      const searchResponse = await apiClient.get<any>('/raindrops/0', {
        search: url,
        perpage: 10,
      });

      const exactMatch = searchResponse.items?.find(
        (item: any) =>
          item.link === url ||
          item.link === url.replace(/\/$/, '') ||
          url.replace(/\/$/, '') === item.link
      );

      if (exactMatch) {
        const formattedOutput = [
          `**URL Already Exists!**`,
          '',
          `**URL:** ${url}`,
          '',
          '**Existing Bookmark Details:**',
          `• Title: ${exactMatch.title}`,
          `• ID: ${exactMatch._id}`,
          `• Collection: ${exactMatch.collection?.$id || 'Unsorted'}`,
          `• Created: ${new Date(exactMatch.created).toLocaleDateString()}`,
          exactMatch.tags?.length > 0
            ? `• Tags: ${exactMatch.tags.join(', ')}`
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
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `**URL is not bookmarked yet**\n\nThe URL ${url} does not exist in your Raindrop.io collection. You can safely create a new bookmark for this URL.`,
            },
          ],
        };
      }
    } catch (searchError) {
      return {
        content: [
          {
            type: 'text',
            text: `Error checking URL existence: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
}
