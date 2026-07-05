import pg from "pg"

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const statements = [
  `CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "emailVerified" boolean NOT NULL DEFAULT false,
    "image" text,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY,
    "expiresAt" timestamp NOT NULL,
    "token" text NOT NULL UNIQUE,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now(),
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp,
    "refreshTokenExpiresAt" timestamp,
    "scope" text,
    "password" text,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expiresAt" timestamp NOT NULL,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "ideas" (
    "id" serial PRIMARY KEY,
    "problem" text NOT NULL,
    "raisedBy" text,
    "source" text,
    "ideaType" text,
    "roughValue" text,
    "roughEffort" text,
    "confidence" text DEFAULT 'M',
    "disposition" text NOT NULL DEFAULT 'New',
    "dropReason" text,
    "promoted" boolean NOT NULL DEFAULT false,
    "requestId" integer,
    "createdBy" text NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "requests" (
    "id" serial PRIMARY KEY,
    "title" text NOT NULL,
    "source" text,
    "bucket" text NOT NULL DEFAULT 'Client',
    "reqType" text,
    "refLinks" text,
    "description" text,
    "neededBy" timestamp,
    "status" text NOT NULL DEFAULT 'Intake',
    "stageGate" text NOT NULL DEFAULT 'Not Started',
    "owner" text,
    "ideaId" integer,
    "factorValue" integer,
    "factorReach" integer,
    "factorUrgency" integer,
    "factorStrategic" integer,
    "priorityScore" integer,
    "priorityBand" text,
    "riskGate" boolean NOT NULL DEFAULT false,
    "createdBy" text NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "sprint_items" (
    "id" serial PRIMARY KEY,
    "requestId" integer NOT NULL,
    "sprintName" text NOT NULL,
    "boardStatus" text NOT NULL DEFAULT 'Committed',
    "percentComplete" integer NOT NULL DEFAULT 0,
    "blocker" text,
    "estDays" integer NOT NULL DEFAULT 1,
    "bucket" text NOT NULL DEFAULT 'Client',
    "createdBy" text NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now()
  )`,
]

for (const sql of statements) {
  await pool.query(sql)
  console.log("ok:", sql.slice(0, 48).replace(/\s+/g, " ") + "...")
}

await pool.end()
console.log("migration complete")
