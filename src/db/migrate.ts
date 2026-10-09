import { db } from './index';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Creating table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS listings (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      price TEXT NOT NULL,
      location TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT NOT NULL,
      images JSONB DEFAULT '[]'::jsonb,
      phone TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('Table created successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
