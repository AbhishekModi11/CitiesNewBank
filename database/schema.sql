CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  mobile TEXT UNIQUE,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  date_of_birth TEXT,
  parent_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS otp_requests (
  id TEXT PRIMARY KEY,
  mobile TEXT NOT NULL,
  otp_salt TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER,
  created_at INTEGER NOT NULL,
  consumed_at INTEGER
);
CREATE INDEX IF NOT EXISTS otp_requests_mobile_idx ON otp_requests (mobile, created_at);
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  date_of_birth TEXT,
  gender TEXT,
  bio TEXT NOT NULL DEFAULT '',
  avatar TEXT,
  guardian_id TEXT,
  completed_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS bank_links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_last4 TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS guardian_links (
  id TEXT PRIMARY KEY,
  teen_id TEXT NOT NULL,
  parent_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  consent_recorded_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS qr_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  amount INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  address TEXT NOT NULL,
  expires_at INTEGER,
  rotate_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS device_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS family_links (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL,
  teen_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  last4 TEXT NOT NULL,
  balance INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS mandates (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  label TEXT NOT NULL,
  amount INTEGER NOT NULL,
  due TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  family_id TEXT,
  teen_id TEXT,
  scope TEXT NOT NULL,
  category TEXT,
  amount_cap INTEGER,
  daily_cap INTEGER,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE,
  user_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  payee TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL,
  reason TEXT,
  risk_score INTEGER NOT NULL DEFAULT 0,
  cooling_until INTEGER,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER
);
CREATE TABLE IF NOT EXISTS payment_events (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  reason TEXT,
  at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL,
  approver_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  decided_at INTEGER
);
CREATE TABLE IF NOT EXISTS chores (
  id TEXT PRIMARY KEY,
  family_id TEXT,
  teen_id TEXT,
  title TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  approved_at INTEGER,
  released_at INTEGER
);
CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deadline INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT,
  auth TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  sequence INTEGER NOT NULL,
  entry_type TEXT NOT NULL,
  payment_id TEXT,
  payload TEXT NOT NULL,
  prev_hash TEXT,
  hash TEXT NOT NULL,
  signature TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  run_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);



