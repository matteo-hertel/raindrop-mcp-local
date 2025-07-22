# Raindrop.io MCP Server

A Model Context Protocol (MCP) server for interacting with the Raindrop.io API. This server provides tools for managing bookmarks, collections, tags, highlights, and more through Raindrop.io's REST API.

## Features

### 🔖 Collections Management
- List all collections
- Create new collections
- Update collection properties
- Delete collections

### 📰 Raindrops (Bookmarks) Management
- Get individual raindrops or search through collections
- Create new bookmarks
- Update existing bookmarks
- Delete bookmarks
- Bulk operations (create, update, delete multiple raindrops)
- **Permanent copy/cache** - Archive webpage content (Pro feature)

### 🏷️ Tags Management
- List tags for collections
- Rename tags
- Merge tags
- Delete tags

### ✨ Highlights Management
- Get highlights for raindrops
- Create new highlights
- Update existing highlights
- Delete highlights

### 🔍 Import & Utility Tools
- Parse URLs to extract metadata
- Check if URLs exist in Raindrop.io
- Parse import files
- Get user profile information
- List available filters

## Prerequisites

1. **Node.js 20+** - This server requires Node.js version 20 or higher
2. **Raindrop.io Account** - You need a Raindrop.io account to get an API token
3. **API Token** - Get your API token from [Raindrop.io App Settings](https://app.raindrop.io/settings/integrations)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd raindrop-mcp-local
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   # or npm install
   # or yarn install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```bash
   RAINDROP_TOKEN=your_raindrop_api_token_here
   ```

   Alternatively, export the environment variable:
   ```bash
   export RAINDROP_TOKEN="your_raindrop_api_token_here"
   ```

4. **Build the project:**
   ```bash
   pnpm build
   ```

## Getting Your Raindrop.io API Token

1. Visit [Raindrop.io App Settings](https://app.raindrop.io/settings/integrations)
2. Go to the "For Developers" section
3. Click "Create new app"
4. Fill in the required information
5. Copy your API token
6. Add it to your environment variables

## Usage

### Development Mode

Start the server in development mode with hot reloading:

```bash
pnpm dev
```

The server will start on `http://localhost:3002` by default.

### Production Mode

Build and start the server for production:

```bash
pnpm build
pnpm start
```

### Debug Mode

Debug and test your MCP server using the MCP Inspector:

```bash
# First build the server
pnpm build

# Then launch the debugger
pnpm debug
```

This will:
1. Build the MCP server
2. Start the MCP Inspector in your browser
3. Connect to your server via STDIO transport
4. Allow you to test all 26 tools interactively
5. View detailed request/response data
6. Debug tool parameters and outputs

The MCP Inspector provides a web interface at `http://localhost:5173` where you can:
- Browse all available tools
- Test tool functionality with different parameters
- View formatted responses
- Debug authentication and API connectivity
- Monitor real-time tool execution

**Debug Tips:**
- Set your `RAINDROP_TOKEN` environment variable before running debug
- Test the `get_user` tool first to verify authentication
- Use `get_collections` to see your available collections
- Try `get_permanent_copy` to test Pro features
- Check the console for detailed error messages

### Configuration

The server configuration is defined in `xmcp.config.ts`:

```typescript
const config: XmcpConfig = {
  name: 'raindrop-mcp',
  description: 'Simple MCP server for Raindrop.io API',
  http: {
    port: 3002,  // Change this if needed
  },
  tools: {
    directory: './src/tools'
  }
};
```

## Available Tools

### Collections
- `get_collections` - List all collections
- `create_collection` - Create a new collection
- `update_collection` - Update an existing collection
- `delete_collection` - Delete a collection

### Raindrops (Bookmarks)
- `get_raindrops` - Search and list raindrops in a collection
- `get_raindrop` - Get a specific raindrop by ID
- `create_raindrop` - Create a new bookmark
- `update_raindrop` - Update an existing bookmark
- `delete_raindrop` - Delete a bookmark
- `bulk_create_raindrops` - Create multiple bookmarks at once
- `bulk_update_raindrops` - Update multiple bookmarks at once
- `bulk_delete_raindrops` - Delete multiple bookmarks at once
- `get_permanent_copy` - Create/get permanent archived copy of a webpage (Pro feature)

### Tags
- `get_tags` - List tags for a collection
- `rename_tag` - Rename a tag
- `merge_tags` - Merge multiple tags into one
- `delete_tags` - Delete tags

### Highlights
- `get_highlights` - Get highlights for a raindrop
- `create_highlight` - Create a new highlight
- `update_highlight` - Update an existing highlight
- `delete_highlight` - Delete a highlight

### Utilities
- `get_user` - Get current user profile
- `get_filters` - Get available filters for a collection
- `parse_url` - Parse a URL to extract metadata
- `check_url_exists` - Check if a URL exists in your Raindrop.io account
- `parse_import_file` - Parse import files (various formats)

## Usage Examples

### Creating a New Bookmark

```json
{
  "tool": "create_raindrop",
  "arguments": {
    "link": "https://example.com",
    "title": "Example Website",
    "excerpt": "A great example website",
    "collectionId": 0,
    "tags": ["example", "website"]
  }
}
```

### Getting Permanent Copy (Pro Feature)

The permanent copy feature creates an archived version of a webpage that's stored on Raindrop.io servers. This is useful for preserving content even if the original webpage becomes unavailable.

```json
{
  "tool": "get_permanent_copy",
  "arguments": {
    "id": 123456
  }
}
```

**Note:** This feature requires a Raindrop.io Pro subscription.

### Searching Raindrops

```json
{
  "tool": "get_raindrops",
  "arguments": {
    "collectionId": 0,
    "search": "javascript tutorials",
    "page": 0,
    "perpage": 25
  }
}
```

### Managing Collections

```json
{
  "tool": "create_collection",
  "arguments": {
    "title": "Web Development",
    "description": "Resources for web development",
    "public": false
  }
}
```

### Bulk Operations

```json
{
  "tool": "bulk_create_raindrops",
  "arguments": {
    "raindrops": [
      {
        "link": "https://example1.com",
        "title": "Example 1",
        "collectionId": 0
      },
      {
        "link": "https://example2.com", 
        "title": "Example 2",
        "collectionId": 0
      }
    ]
  }
}
```

### Tag Management

```json
{
  "tool": "rename_tag",
  "arguments": {
    "replace": "old-tag-name",
    "with": "new-tag-name"
  }
}
```

## Error Handling

The server handles various error scenarios:

- **Invalid API Token:** Returns clear error message asking to check RAINDROP_TOKEN
- **Network Errors:** Gracefully handles connection issues with Raindrop.io API
- **Pro Feature Access:** Specific error messages for Pro-only features like permanent copy
- **Rate Limiting:** Respects Raindrop.io API rate limits
- **Invalid Parameters:** Validates all input parameters and provides helpful error messages

## Common Issues

### Invalid Token Error
```
Error: Raindrop API token is required. Set RAINDROP_TOKEN environment variable or pass token to constructor.
```
**Solution:** Make sure you've set the `RAINDROP_TOKEN` environment variable with your API token.

### Pro Feature Limitation
```
Error: Permanent copy feature requires a Pro subscription. Please upgrade your Raindrop.io account to access this feature.
```
**Solution:** The permanent copy feature requires a Raindrop.io Pro subscription.

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use 127.0.0.1:3002
```
**Solution:** Change the port in `xmcp.config.ts` or stop the existing process.

## Development

### Project Structure

```
src/
├── tools/               # All MCP tools
│   ├── collections/     # Collection management tools
│   ├── raindrops/       # Raindrop management tools
│   ├── tags/           # Tag management tools
│   ├── highlights/     # Highlight management tools
│   ├── user/           # User profile tools
│   ├── import/         # Import and utility tools
│   └── filters/        # Filter tools
├── utils/              # Utility functions
│   ├── api-client.ts   # Raindrop.io API client
│   └── constants.ts    # API constants
└── types.ts           # TypeScript type definitions
```

### Adding New Tools

1. Create a new `.ts` file in the appropriate `src/tools/` subdirectory
2. Follow the existing pattern:
   ```typescript
   import { z } from "zod";
   import { type ToolMetadata, type InferSchema } from "xmcp";
   
   export const schema = {
     // Define parameters using Zod
   };
   
   export const metadata: ToolMetadata = {
     name: "tool_name",
     description: "Tool description",
     annotations: {
       title: "Human Readable Title",
       readOnlyHint: true/false,
       destructiveHint: true/false,
       idempotentHint: true/false,
     },
   };
   
   export default async function toolFunction({ }: InferSchema<typeof schema>) {
     // Implementation
   }
   ```

### API Client

The `apiClient` utility provides a robust interface to the Raindrop.io API with:
- Automatic authentication handling
- Error handling and retry logic
- Request/response type safety
- Connection testing capabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Links

- [Raindrop.io](https://raindrop.io)
- [Raindrop.io API Documentation](https://developer.raindrop.io)
- [MCP Protocol](https://modelcontextprotocol.io)
- [xmcp Framework](https://xmcp.dev)