import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Next.js
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Optional environment variables
  REPLIT_DOMAINS: z.string().optional(),
  REPL_ID: z.string().optional(),
  
  // Payment processing
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Email
  RESEND_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Environment validation failed:\n${error.errors
          .map((err) => `- ${err.path.join('.')}: ${err.message}`)
          .join('\n')}`
      );
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();