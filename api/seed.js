// Dev-only: wipes all data and recreates one household with the family members.
const { Pool } = require('pg');

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed: NODE_ENV is production.');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const householdName = "Caleb's family";
const members = ['Caleb', 'Laylah', 'Caylah', 'Trey', 'Caleb Jr.'];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE households RESTART IDENTITY CASCADE');

    const { rows } = await client.query(
      'INSERT INTO households (name) VALUES ($1) RETURNING id',
      [householdName]
    );
    const householdId = rows[0].id;

    for (const name of members) {
      await client.query(
        'INSERT INTO users (household_id, name) VALUES ($1, $2)',
        [householdId, name]
      );
    }

    await client.query('COMMIT');
    console.log(`Seeded household ${householdId} with ${members.length} users.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
