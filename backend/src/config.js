import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.string().default('development'),
  DEMO: z.string().optional(),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default('15m'),
  FRONTEND_ORIGINS: z.string().default('http://localhost:5173'),
  LEDGER_MODE: z.enum(['local', 'drunix']).default('local'),
  LLM_PROVIDER: z.enum(['none', 'anthropic', 'openai']).default('none'),
  LLM_API_KEY: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  DB_PATH: z.string().default('./data/app.db'),
  DB_CLIENT: z.enum(['sqlite', 'postgres']).default('sqlite'),
  DATABASE_URL: z.string().optional(),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  throw new Error(`Invalid environment: ${JSON.stringify(parsed.error.flatten())}`)
}

const data = parsed.data
const placeholders = new Set(['change-me', 'dev-change-me', 'test', 'password', 'secret'])
if (placeholders.has(data.JWT_SECRET) || data.JWT_SECRET.includes('change-me')) {
  throw new Error('JWT_SECRET is missing or still a placeholder')
}

export const config = {
  port: data.PORT,
  nodeEnv: data.NODE_ENV,
  demo: data.DEMO === 'true' || data.DEMO === '1',
  jwtSecret: data.JWT_SECRET,
  jwtExpiresIn: data.JWT_EXPIRES_IN,
  frontendOrigins: data.FRONTEND_ORIGINS.split(',').map((s) => s.trim()),
  ledgerMode: data.LEDGER_MODE,
  llmProvider: data.LLM_PROVIDER,
  llmApiKey: data.LLM_API_KEY || '',
  vapidPublic: data.VAPID_PUBLIC_KEY || '',
  vapidPrivate: data.VAPID_PRIVATE_KEY || '',
  dbPath: data.DB_PATH,
  dbClient: data.DB_CLIENT,
  databaseUrl: data.DATABASE_URL || '',
}
