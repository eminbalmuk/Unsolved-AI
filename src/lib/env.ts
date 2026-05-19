export function isPostgresUrl(value: string | undefined) {
  return Boolean(
    value &&
      (value.startsWith("postgresql://") || value.startsWith("postgres://")),
  );
}

export function getDatabaseUrl() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
  ];

  return candidates.find(isPostgresUrl) ?? null;
}
