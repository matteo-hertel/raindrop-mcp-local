import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse, Raindrop, CreateRaindropRequest } from '../../types';

// Define the schema for tool parameters
export const schema = {
  link: z.string().url().describe('The URL to bookmark'),
  title: z
    .string()
    .optional()
    .describe(
      'Custom title for the bookmark (if not provided, will be auto-parsed)'
    ),
  excerpt: z
    .string()
    .optional()
    .describe('Custom excerpt/description for the bookmark'),
  note: z.string().optional().describe('Personal note for the bookmark'),
  tags: z
    .array(z.string())
    .optional()
    .describe('Array of tags to assign to the bookmark'),
  important: z.boolean().optional().describe('Mark the bookmark as important'),
  collectionId: z
    .number()
    .optional()
    .describe('ID of the collection to add the bookmark to'),
  type: z
    .enum(['link', 'article', 'image', 'video', 'document', 'audio'])
    .optional()
    .describe('Type of the content'),
  cover: z.string().url().optional().describe('Custom cover image URL'),
  autoParseTitle: z
    .boolean()
    .optional()
    .default(true)
    .describe('Automatically parse title from the webpage'),
  autoParseExcerpt: z
    .boolean()
    .optional()
    .default(true)
    .describe('Automatically parse excerpt from the webpage'),
  autoParseLink: z
    .boolean()
    .optional()
    .default(true)
    .describe('Automatically parse and validate the link'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'create_raindrop',
  description:
    'Create a new raindrop (bookmark) in Raindrop.io with optional auto-parsing of webpage content',
  annotations: {
    title: 'Create Raindrop',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
  },
};

// Tool implementation
export default async function createRaindrop({
  link,
  title,
  excerpt,
  note,
  tags,
  important,
  collectionId,
  type,
  cover,
  autoParseTitle,
  autoParseExcerpt,
  autoParseLink,
}: InferSchema<typeof schema>) {
  try {
    const requestData: CreateRaindropRequest = {
      link,
      ...(title && { title }),
      ...(excerpt && { excerpt }),
      ...(note && { note }),
      ...(tags && { tags }),
      ...(important !== undefined && { important }),
      ...(collectionId && { collection: { $id: collectionId } }),
      ...(type && { type }),
      ...(cover && { cover }),
    };

    // Add auto-parsing preferences
    const pleaseParse: { link?: boolean; title?: boolean; excerpt?: boolean } =
      {};
    if (autoParseLink !== undefined) pleaseParse.link = autoParseLink;
    if (autoParseTitle !== undefined) pleaseParse.title = autoParseTitle;
    if (autoParseExcerpt !== undefined) pleaseParse.excerpt = autoParseExcerpt;

    if (Object.keys(pleaseParse).length > 0) {
      requestData.pleaseParse = pleaseParse;
    }

    const response = await apiClient.post<ApiResponse<Raindrop>>(
      '/raindrop',
      requestData
    );

    const raindrop = response.item;

    if (!raindrop) {
      throw new Error('Raindrop was not created successfully');
    }

    const formattedOutput = [
      `**${raindrop.title}**`,
      `URL: ${raindrop.link}`,
      `ID: ${raindrop._id}`,
      `Collection: ${raindrop.collection?.$id || 'Unsorted'}`,
      `Type: ${raindrop.type || 'link'}`,
      `Domain: ${raindrop.domain || 'Unknown'}`,
      `Created: ${raindrop.created}`,
      raindrop.excerpt ? `Excerpt: ${raindrop.excerpt}` : '',
      raindrop.note ? `Note: ${raindrop.note}` : '',
      raindrop.tags.length > 0
        ? `Tags: ${raindrop.tags.join(', ')}`
        : 'No tags',
      raindrop.important ? 'Status: Important ⭐' : '',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Successfully created raindrop:\n\n${formattedOutput}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error creating raindrop: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
