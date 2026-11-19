const { Pool } = require('pg');

// One pool for the whole app; every file that needs the database does require('./db').
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = pool;
