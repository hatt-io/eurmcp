#!/usr/bin/env node
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createServer } from './server/createServer.js';

try {
  serveStdio(() => createServer());
} catch (error) {
  // stdout is reserved exclusively for MCP protocol messages.
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
}
