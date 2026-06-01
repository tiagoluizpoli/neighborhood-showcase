import path from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';

async function setup() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable is not defined!');
    process.exit(1);
  }

  // Parse connection URL to get credentials for the template database
  const url = new URL(dbUrl);
  const targetDbName = url.pathname.slice(1);

  // Connect to the default 'postgres' database first to create the target database if needed
  url.pathname = '/postgres';
  const templateDbUrl = url.toString();

  console.log(
    `Connecting to template database to ensure "${targetDbName}" exists...`,
  );
  const client = new Client({ connectionString: templateDbUrl });
  try {
    await client.connect();
    const res = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [targetDbName],
    );
    if (res.rowCount === 0) {
      // Note: CREATE DATABASE cannot run inside a transaction, which is fine since we run it directly.
      // Also we need to sanitize/safely quote the database name. It is safe from our env file here.
      await client.query(`CREATE DATABASE "${targetDbName}"`);
      console.log(`✅ Database "${targetDbName}" created successfully.`);
    } else {
      console.log(`ℹ️ Database "${targetDbName}" already exists.`);
    }
  } catch (err) {
    console.error('❌ Error ensuring test database exists:', err);
    process.exit(1);
  } finally {
    await client.end();
  }

  console.log(
    `Running Drizzle migrations on the test database "${targetDbName}"...`,
  );
  const testClient = new Client({ connectionString: dbUrl });
  try {
    await testClient.connect();
    const db = drizzle(testClient);
    // Locate the migrations directory relative to this script
    const migrationsFolder = path.join(import.meta.dir, 'migrations');
    await migrate(db, { migrationsFolder });
    console.log('✅ Migrations applied successfully to the test database.');
  } catch (err) {
    console.error('❌ Error migrating test database:', err);
    process.exit(1);
  } finally {
    await testClient.end();
  }
}

setup().catch((err) => {
  console.error('❌ Setup script failed:', err);
  process.exit(1);
});
