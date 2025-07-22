# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
```bash
# Install dependencies
pnpm install

# Development with hot reloading
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start

# Type checking
pnpm typecheck

# Code formatting
pnpm format          # Auto-format code
pnpm format:check   # Check formatting without changing files

# Debug with MCP Inspector
pnpm debug          # Opens interactive debugger at http://localhost:5173
```

### Environment Setup
```bash
# Required: Set Raindrop.io API token
export RAINDROP_TOKEN="your_api_token_here"
# Or create .env file with: RAINDROP_TOKEN=your_api_token_here
```

## Architecture Overview

### xmcp Framework
This project uses the xmcp framework for building MCP (Model Context Protocol) servers. The framework:
- Auto-discovers tools in `src/tools/` directory
- Handles HTTP/STDIO transport based on `xmcp.config.ts`
- Provides TypeScript types via `InferSchema` and `ToolMetadata`
- Manages tool execution and error handling

### Tool Structure Pattern
All tools follow this consistent pattern in `src/tools/`:
```typescript
import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";
import { apiClient } from "../../utils/api-client";

export const schema = {
  paramName: z.string().describe("Parameter description"),
  // ... more parameters
};

export const metadata: ToolMetadata = {
  name: "tool_name",
  description: "Tool description",
  annotations: {
    title: "Human Readable Title",
    readOnlyHint: true/false,      // Does not modify data
    destructiveHint: true/false,   // Deletes or modifies data
    idempotentHint: true/false,   // Safe to run multiple times
  },
};

export default async function toolFunction({ paramName }: InferSchema<typeof schema>) {
  // Implementation using apiClient
}
```

### API Client Architecture
The `RaindropAPI` class (`src/utils/api-client.ts`) provides:
- Centralized HTTP client with automatic authentication
- Error handling with custom `RaindropAPIError` class
- Type-safe methods: `get()`, `post()`, `put()`, `delete()`
- Automatic token management from environment variables
- Connection testing capabilities

### Type System
All API types are defined in `src/types.ts`:
- Core entities: `Raindrop`, `Collection`, `User`, `Tag`, `Highlight`
- Request/Response types for each operation
- Consistent `ApiResponse<T>` wrapper for all API responses

### Tool Organization
Tools are organized by domain in subdirectories:
- `collections/` - Collection CRUD operations
- `raindrops/` - Bookmark management including bulk operations
- `tags/` - Tag management (rename, merge, delete)
- `highlights/` - Text highlight annotations
- `user/` - User profile information
- `import/` - URL parsing and import utilities
- `filters/` - Collection statistics and filters

## Backlog.md Task Management

When working on tasks, follow the Backlog.md workflow:

1. **View available tasks**: `backlog task list -s "To Do" --plain`
2. **Start a task**: `backlog task edit <id> -a @me -s "In Progress"`
3. **Add implementation plan**: `backlog task edit <id> --plan "1. Step one\n2. Step two"`
4. **Complete task**: 
   - Update acceptance criteria checkboxes in task file
   - Add implementation notes
   - Run: `backlog task edit <id> -s Done --notes "Implementation summary"`

### Task File Structure
Tasks are stored in `backlog/tasks/` with format `task-<id> - <title>.md`:
- **Description**: Why the task exists
- **Acceptance Criteria**: Measurable outcomes (what)
- **Implementation Plan**: Steps to complete (how) - added when starting
- **Implementation Notes**: Summary of work done - added when completing

## Adding New Tools

1. Create a new file in appropriate subdirectory of `src/tools/`
2. Follow the tool pattern with schema, metadata, and default export
3. Use `apiClient` for all Raindrop.io API calls
4. Return consistent response format with `content` array
5. Handle errors gracefully with descriptive messages
6. The tool will be auto-discovered by xmcp framework

## Testing and Debugging

- Use `pnpm debug` to test tools interactively with MCP Inspector
- Test authentication with `get_user` tool first
- Check Pro features with `get_permanent_copy` tool
- Monitor console for detailed error messages
- All tools are accessible at `http://localhost:3002` in dev mode