import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse } from '../../types';

// Define the schema for tool parameters
export const schema = {
  id: z.number().describe('The ID of the raindrop to get permanent copy for'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'get_permanent_copy',
  description:
    'Get permanent copy/cache of a raindrop (Pro feature) - creates an archived version of the webpage content',
  annotations: {
    title: 'Get Permanent Copy',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Interface for permanent copy response
interface PermanentCopyResponse {
  result: boolean;
  cache?: {
    status:
      | 'ready'
      | 'retry'
      | 'failed'
      | 'invalid-origin'
      | 'invalid-timeout'
      | 'invalid-size'
      | 'creating';
    size: number;
    created: string;
  };
  link?: string; // Direct link to cached content
  errorMessage?: string;
}

// Tool implementation
export default async function getPermanentCopy({
  id,
}: InferSchema<typeof schema>) {
  try {
    // First, let's try to get the current raindrop to check if it already has a cache
    const raindropResponse = await apiClient.get<ApiResponse<any>>(
      `/raindrop/${id}`
    );

    if (!raindropResponse.item) {
      throw new Error(`Raindrop with ID ${id} not found`);
    }

    const raindrop = raindropResponse.item;

    // Check if cache already exists
    if (raindrop.cache && raindrop.cache.status === 'ready') {
      const cacheInfo = raindrop.cache;
      const sizeInMB = (cacheInfo.size / (1024 * 1024)).toFixed(2);

      try {
        // Use fetch directly on the cache endpoint since it returns HTML content, not JSON
        const cacheUrl = `https://api.raindrop.io/rest/v1/raindrop/${id}/cache`;
        const cacheResponse = await fetch(cacheUrl, {
          headers: {
            Authorization: `Bearer ${process.env.RAINDROP_TOKEN}`,
            'User-Agent': 'raindrop-mcp-server/0.1.0',
          },
        });

        if (cacheResponse.ok) {
          const content = await cacheResponse.text();
          const maxLength = 8000;
          const truncatedContent =
            content.length > maxLength
              ? `${content.substring(0, maxLength)}\n\n... [Content truncated - total size: ${sizeInMB} MB]`
              : content;

          return {
            content: [
              {
                type: 'text',
                text:
                  `Permanent copy content for "${raindrop.title}":\n\n` +
                  `• Status: ${cacheInfo.status}\n` +
                  `• Size: ${sizeInMB} MB\n` +
                  `• Created: ${cacheInfo.created}\n` +
                  `• Source URL: ${raindrop.link}\n` +
                  `• Cache API URL: ${cacheUrl}\n\n` +
                  `--- CACHED CONTENT ---\n${truncatedContent}`,
              },
            ],
          };
        } else {
          throw new Error(
            `Failed to fetch cached content: ${cacheResponse.status} ${cacheResponse.statusText}`
          );
        }
      } catch (error) {
        // Fallback to just showing cache info if content fetch fails
        return {
          content: [
            {
              type: 'text',
              text:
                `Permanent copy exists for "${raindrop.title}" but content could not be fetched:\n\n` +
                `• Status: ${cacheInfo.status}\n` +
                `• Size: ${sizeInMB} MB\n` +
                `• Created: ${cacheInfo.created}\n` +
                `• Cache URL: https://cache.raindrop.io/${id}\n\n` +
                `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }

    // Try to create/request permanent copy
    // The API endpoint for creating cache might be POST /raindrop/{id}/cache
    let cacheResponse: PermanentCopyResponse;

    try {
      cacheResponse = await apiClient.post<PermanentCopyResponse>(
        `/raindrop/${id}/cache`
      );
    } catch (error) {
      // If POST doesn't work, try PUT as some APIs use PUT for this operation
      try {
        cacheResponse = await apiClient.put<PermanentCopyResponse>(
          `/raindrop/${id}/cache`
        );
      } catch (putError) {
        // If both fail, check if it's a Pro feature limitation
        if (
          error instanceof Error &&
          (error.message.includes('pro') ||
            error.message.includes('premium') ||
            error.message.includes('upgrade') ||
            error.message.includes('subscription'))
        ) {
          throw new Error(
            'Permanent copy feature requires a Pro subscription. Please upgrade your Raindrop.io account to access this feature.'
          );
        }
        throw error;
      }
    }

    if (!cacheResponse.result) {
      const errorMsg =
        cacheResponse.errorMessage || 'Failed to create permanent copy';
      throw new Error(errorMsg);
    }

    const cache = cacheResponse.cache;

    if (!cache) {
      throw new Error('Cache information not available in response');
    }

    let statusMessage = '';
    switch (cache.status) {
      case 'ready':
        const sizeInMB = (cache.size / (1024 * 1024)).toFixed(2);
        statusMessage = `✅ Permanent copy is ready!\n• Size: ${sizeInMB} MB\n• Created: ${cache.created}\n• Cache URL: https://cache.raindrop.io/${id}`;
        break;
      case 'creating':
        statusMessage = `⏳ Permanent copy is being created. This may take a few moments.\n• Check back later to see when it's ready.`;
        break;
      case 'retry':
        statusMessage = `🔄 Permanent copy creation is being retried.\n• The system will attempt to create the cache again.`;
        break;
      case 'failed':
        statusMessage = `❌ Permanent copy creation failed.\n• The webpage content could not be archived.`;
        break;
      case 'invalid-origin':
        statusMessage = `⚠️ Cannot create permanent copy: Invalid origin.\n• The source website doesn't allow archiving.`;
        break;
      case 'invalid-timeout':
        statusMessage = `⚠️ Cannot create permanent copy: Timeout.\n• The webpage took too long to load.`;
        break;
      case 'invalid-size':
        statusMessage = `⚠️ Cannot create permanent copy: Size limit exceeded.\n• The webpage content is too large to archive.`;
        break;
      default:
        statusMessage = `Status: ${cache.status}`;
    }

    return {
      content: [
        {
          type: 'text',
          text: `Permanent copy request for "${raindrop.title}":\n\n${statusMessage}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error creating permanent copy: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
