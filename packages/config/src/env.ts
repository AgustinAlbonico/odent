import { z } from 'zod';

const portSchema = z.coerce.number().int().positive();
const databaseUrlSchema = z
  .string()
  .min(1)
  .refine(
    (value) => value.startsWith('postgres://') || value.startsWith('postgresql://'),
    'DATABASE_URL must be a PostgreSQL connection string',
  );

export const sharedEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: portSchema.default(3001),
  WEB_PORT: portSchema.default(3000),
  DATABASE_URL: databaseUrlSchema,
  NEXT_PUBLIC_API_URL: z.string().url(),
});

export type SharedEnv = z.infer<typeof sharedEnvSchema>;

export function parseSharedEnv(input: Record<string, string | undefined>): SharedEnv {
  return sharedEnvSchema.parse(input);
}

export function safeParseSharedEnv(input: Record<string, string | undefined>) {
  return sharedEnvSchema.safeParse(input);
}
