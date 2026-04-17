import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __mcsDbPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString =
    process.env.DATABASE_URL ||
    (process.env.NODE_ENV === "test"
      ? "postgresql://localhost:5432/mcs_test"
      : undefined);
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  return new Pool({ connectionString });
}

function getPool(): Pool {
  if (!globalThis.__mcsDbPool) {
    globalThis.__mcsDbPool = createPool();
  }
  return globalThis.__mcsDbPool;
}

// Lazy proxy — pool is only created on first actual use, not at module load time.
// This prevents build-time failures when DATABASE_URL is not available.
export const dbPool: Pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    const pool = getPool();
    const value = Reflect.get(pool, prop, receiver);
    return typeof value === "function" ? value.bind(pool) : value;
  },
});

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[]
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, values);
}

export async function withDbClient<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function withDbTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  return withDbClient(async (client) => {
    await client.query("BEGIN");
    try {
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}
