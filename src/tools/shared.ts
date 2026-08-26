import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { asEuLawError } from '../errors/errors.js';

export type RegisterTool = (server: McpServer) => void;

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
export const languageSchema = z.string().min(2).max(32).optional();
export const limitSchema = z.number().int().min(1).max(100).optional();
export const versionSchema = z
  .union([z.literal('original'), z.literal('current_consolidated'), dateSchema])
  .optional();
export const numberSelectionSchema = z.union([
  z.array(z.number().int().positive()).min(1).max(100),
  z.object({ from: z.number().int().positive(), to: z.number().int().positive() })
]);
export const looseOutputSchema = z.looseObject({});

export function success(value: Record<string, unknown>) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value) }],
    structuredContent: value
  };
}

export function failure(error: unknown) {
  const value = asEuLawError(error).toJSON();
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value) }],
    structuredContent: value,
    isError: true
  };
}

export const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true
} as const;
