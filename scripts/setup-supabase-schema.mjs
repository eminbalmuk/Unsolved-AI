import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl?.startsWith("postgres")) {
  throw new Error("DATABASE_URL must be a PostgreSQL connection string.");
}

const statements = [
  `
  DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('FOUNDER', 'PRODUCT_MANAGER', 'ENTERPRISE', 'ADMIN');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  `,
  `
  DO $$ BEGIN
    CREATE TYPE "SubscriptionPlan" AS ENUM ('FREEMIUM', 'PRO', 'ENTERPRISE');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  `,
  `
  DO $$ BEGIN
    CREATE TYPE "EmailServiceStatus" AS ENUM ('DISABLED', 'ENABLED');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  `,
  `
  CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'FOUNDER',
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREEMIUM',
    "company" TEXT,
    "emailService" "EmailServiceStatus" NOT NULL DEFAULT 'DISABLED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "emailService" "EmailServiceStatus" NOT NULL DEFAULT 'DISABLED';
  `,
  `
  CREATE TABLE IF NOT EXISTS "ProblemRecord" (
    "id" TEXT PRIMARY KEY,
    "slug" TEXT NOT NULL UNIQUE,
    "title" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "aiSummary" TEXT NOT NULL,
    "painScore" INTEGER NOT NULL,
    "frequency" INTEGER NOT NULL,
    "emotionalScore" INTEGER NOT NULL,
    "willingnessPay" INTEGER NOT NULL,
    "validationCount" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "sourcePlatforms" TEXT[] NOT NULL,
    "trend" JSONB NOT NULL,
    "competitors" JSONB NOT NULL,
    "opportunity" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS "ProblemSourceRecord" (
    "id" TEXT PRIMARY KEY,
    "problemId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS "ProblemAnalysisRecord" (
    "id" TEXT PRIMARY KEY DEFAULT concat('cm', replace(gen_random_uuid()::text, '-', '')),
    "problemId" TEXT NOT NULL UNIQUE,
    "turkishSummary" TEXT NOT NULL,
    "painDrivers" TEXT[] NOT NULL,
    "solutionIdeas" TEXT[] NOT NULL,
    "mvpSteps" TEXT[] NOT NULL,
    "risks" TEXT[] NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL DEFAULT 'tr-analysis-v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS "ProblemValidation" (
    "id" TEXT PRIMARY KEY DEFAULT concat('cm', replace(gen_random_uuid()::text, '-', '')),
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'app',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS "SavedProblem" (
    "id" TEXT PRIMARY KEY DEFAULT concat('cm', replace(gen_random_uuid()::text, '-', '')),
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE UNIQUE INDEX IF NOT EXISTS "ProblemValidation_userId_problemId_key"
    ON "ProblemValidation" ("userId", "problemId");
  `,
  `
  CREATE UNIQUE INDEX IF NOT EXISTS "SavedProblem_userId_problemId_key"
    ON "SavedProblem" ("userId", "problemId");
  `,
  `
  CREATE UNIQUE INDEX IF NOT EXISTS "ProblemSourceRecord_problemId_url_key"
    ON "ProblemSourceRecord" ("problemId", "url");
  `,
  `CREATE INDEX IF NOT EXISTS "ProblemValidation_problemId_idx" ON "ProblemValidation" ("problemId");`,
  `CREATE INDEX IF NOT EXISTS "SavedProblem_problemId_idx" ON "SavedProblem" ("problemId");`,
  `CREATE INDEX IF NOT EXISTS "ProblemRecord_painScore_idx" ON "ProblemRecord" ("painScore");`,
  `CREATE INDEX IF NOT EXISTS "ProblemRecord_lastSeenAt_idx" ON "ProblemRecord" ("lastSeenAt");`,
  `CREATE INDEX IF NOT EXISTS "ProblemRecord_sector_idx" ON "ProblemRecord" ("sector");`,
  `CREATE INDEX IF NOT EXISTS "ProblemRecord_category_idx" ON "ProblemRecord" ("category");`,
  `CREATE INDEX IF NOT EXISTS "ProblemSourceRecord_capturedAt_idx" ON "ProblemSourceRecord" ("capturedAt");`,
  `CREATE INDEX IF NOT EXISTS "ProblemAnalysisRecord_createdAt_idx" ON "ProblemAnalysisRecord" ("createdAt");`,
  `
  DO $$ BEGIN
    ALTER TABLE "ProblemSourceRecord"
      ADD CONSTRAINT "ProblemSourceRecord_problemId_fkey"
      FOREIGN KEY ("problemId") REFERENCES "ProblemRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  `,
  `
  DO $$ BEGIN
    ALTER TABLE "ProblemAnalysisRecord"
      ADD CONSTRAINT "ProblemAnalysisRecord_problemId_fkey"
      FOREIGN KEY ("problemId") REFERENCES "ProblemRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  `,
  `
  DO $$ BEGIN
    ALTER TABLE "ProblemValidation"
      ADD CONSTRAINT "ProblemValidation_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  `,
  `
  DO $$ BEGIN
    ALTER TABLE "SavedProblem"
      ADD CONSTRAINT "SavedProblem_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  `,
];

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
  query_timeout: 30000,
});

await client.connect();

try {
  for (const statement of statements) {
    await client.query(statement);
  }

  const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'User',
        'ProblemRecord',
        'ProblemSourceRecord',
        'ProblemAnalysisRecord',
        'ProblemValidation',
        'SavedProblem'
      )
    ORDER BY table_name;
  `);

  console.log(`created_tables=${result.rows.map((row) => row.table_name).join(",")}`);
} finally {
  await client.end();
}
