import { Pool } from "pg";

// Setup PostgreSQL connection
const pool = new Pool({
  user: "avinh", // e.g., 'postgres'
  host: "localhost", // or your database host
  database: "gameapp", // e.g., 'gameapp'
  password: "password", // e.g., 'password'
  port: 5432, // default PostgreSQL port
});

// Export the pool to use it in other files
export default pool;
