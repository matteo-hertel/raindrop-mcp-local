const config = {
  name: 'raindrop-mcp',
  description: 'Simple MCP server for Raindrop.io API',
  http: {
    port: 2007,
  },
  stdio: true,
  tools: {
    directory: './src/tools',
  },
};

export default config;
