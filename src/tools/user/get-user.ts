import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { apiClient } from '../../utils/api-client';
import type { ApiResponse, User } from '../../types';

// Define the schema for tool parameters
export const schema = {
  // No parameters needed for getting user profile
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'get_user',
  description: 'Retrieve current user profile information from Raindrop.io',
  annotations: {
    title: 'Get User Profile',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function getUser({}: InferSchema<typeof schema>) {
  try {
    const response = await apiClient.get<{result: boolean; user: User}>('/user');
    
    console.log('API Response:', JSON.stringify(response, null, 2));

    const user = response.user;

    if (!user) {
      throw new Error('User profile not found');
    }

    const formattedOutput = [
      `**${user.fullName}** ${user.pro ? '(Pro Account)' : '(Free Account)'}`,
      `Email: ${user.email}`,
      `User ID: ${user._id}`,
      user.name ? `Username: ${user.name}` : '',
      `Member since: ${new Date(user.registered).toLocaleDateString()}`,
      user.lastAction
        ? `Last active: ${new Date(user.lastAction).toLocaleDateString()}`
        : '',
      '',
      '**Configuration:**',
      user.config
        ? [
            `• Default view: ${user.config.default_collection_view || 'Not set'}`,
            `• Font size: ${user.config.font_size || 0}`,
            `• Default collection: ${user.config.add_default_collection || -1}`,
            `• Broken link handling: ${user.config.broken_level || 'default'}`,
            `• Legacy nested view: ${user.config.nested_view_legacy ? 'Enabled' : 'Disabled'}`,
            `• AI suggestions: ${user.config.ai_suggestions ? 'Enabled' : 'Disabled'}`,
          ].join('\n')
        : 'No configuration details available',
      '',
      '**Collection Groups:**',
      user.groups && user.groups.length > 0
        ? user.groups
            .map(
              (group) =>
                `• ${group.title} (${group.collections.length} collections)${group.hidden ? ' - Hidden' : ''}`
            )
            .join('\n')
        : 'No custom groups',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `User Profile:\n\n${formattedOutput}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error retrieving user profile: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
