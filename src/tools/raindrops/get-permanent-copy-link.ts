import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse } from '../../types';

// Define the schema for tool parameters
export const schema = {
  id: z.number().describe('The ID of the raindrop to get permanent copy link for'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'get_permanent_copy_link',
  description:
    'Get permanent copy/cache link of a raindrop. For documents, returns the signed download URL. For webpages, returns the signed cached content URL.',
  annotations: {
    title: 'Get Permanent Copy Link',
    readOnlyHint: true,
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
  link?: string;
  errorMessage?: string;
}

// Tool implementation
export default async function getPermanentCopyLink({
  id,
}: InferSchema<typeof schema>) {
  try {
    // Get the raindrop details
    const raindropResponse = await apiClient.get<ApiResponse<any>>(
      `/raindrop/${id}`
    );

    if (!raindropResponse.item) {
      throw new Error(`Raindrop with ID ${id} not found`);
    }

    const raindrop = raindropResponse.item;

    // Handle document types - get the signed URL directly
    if (raindrop.type === 'document') {
      try {
        const fileEndpoint = `https://api.raindrop.io/rest/v1/raindrop/${id}/file`;
        
        const response = await fetch(fileEndpoint, {
          headers: {
            'Authorization': `Bearer ${process.env.RAINDROP_TOKEN}`,
            'User-Agent': 'raindrop-mcp-server/0.1.0'
          },
          redirect: 'manual'
        });

        if (response.status === 307) {
          const signedUrl = response.headers.get('location');
          
          if (signedUrl && signedUrl.includes('amazonaws.com')) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Document download link retrieved successfully!\n\n` +
                        `• Title: ${raindrop.title}\n` +
                        `• Type: Document\n` +
                        `• Original URL: ${raindrop.link}\n\n` +
                        `**Signed Download URL:**\n${signedUrl}\n\n` +
                        `This is a temporary signed URL that provides direct access to the document file. ` +
                        `The URL includes AWS signature parameters and will expire after a certain time period.`,
                },
              ],
            };
          } else {
            throw new Error('Could not get signed URL for document download');
          }
        } else {
          throw new Error(`Unexpected response from file endpoint: ${response.status}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error getting document link: ${error instanceof Error ? error.message : String(error)}\n\n` +
                    `Note: Document downloads require a valid Pro subscription.`,
            },
          ],
        };
      }
    }

    // Handle non-document types - get cached content link
    if (raindrop.cache && raindrop.cache.status === 'ready') {
      const cacheInfo = raindrop.cache;
      const sizeInMB = (cacheInfo.size / (1024 * 1024)).toFixed(2);

      try {
        // Get the signed URL for cached content
        const response = await apiClient.requestWithDetails(`/raindrop/${id}/cache`);
        
        if (response.status === 307 && response.headers.location) {
          const signedUrl = response.headers.location;
          
          return {
            content: [
              {
                type: 'text',
                text:
                  `Cached content link retrieved successfully!\n\n` +
                  `• Title: ${raindrop.title}\n` +
                  `• Status: ${cacheInfo.status}\n` +
                  `• Size: ${sizeInMB} MB\n` +
                  `• Created: ${cacheInfo.created}\n` +
                  `• Source URL: ${raindrop.link}\n\n` +
                  `**Signed Cache URL:**\n${signedUrl}\n\n` +
                  `This is a temporary signed URL that provides direct access to the cached webpage content. ` +
                  `The URL includes signature parameters and will expire after a certain time period.`,
              },
            ],
          };
        } else {
          throw new Error(`Unexpected response from cache endpoint: ${response.status}`);
        }
      } catch (error) {
        // Fallback to cache info only
        return {
          content: [
            {
              type: 'text',
              text:
                `Permanent copy exists for "${raindrop.title}":\n\n` +
                `• Status: ${cacheInfo.status}\n` +
                `• Size: ${sizeInMB} MB\n` +
                `• Created: ${cacheInfo.created}\n` +
                `• Source URL: ${raindrop.link}\n\n` +
                `Cache is available but signed URL could not be retrieved.`,
            },
          ],
        };
      }
    }

    // Try to create permanent copy if it doesn't exist
    let cacheResponse: PermanentCopyResponse;

    try {
      cacheResponse = await apiClient.post<PermanentCopyResponse>(
        `/raindrop/${id}/cache`
      );
    } catch (error) {
      // Try PUT if POST fails
      try {
        cacheResponse = await apiClient.put<PermanentCopyResponse>(
          `/raindrop/${id}/cache`
        );
      } catch (putError) {
        // Check for Pro feature limitation
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

    // Return status message based on cache status
    let statusMessage = '';
    switch (cache.status) {
      case 'ready':
        const sizeInMB = (cache.size / (1024 * 1024)).toFixed(2);
        statusMessage = `✅ Permanent copy is ready!\n• Size: ${sizeInMB} MB\n• Created: ${cache.created}\n\nRun this command again to get the signed URL.`;
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
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}