import pool from "../config";

export const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        userId VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        link VARCHAR(255),
        duration INTEGER,
        feedback TEXT,
        feedback_by VARCHAR(255),
        feedback_at TIMESTAMP,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        platformContext JSONB,
        items JSONB
      );
    `);
    console.log("✅ Database tables created successfully");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
  } finally {
    await pool.end(); // Close the connection pool
  }
};

// Execute the function if this file is run directly
if (require.main === module) {
  createTables()
    .then(() => console.log("Migration completed"))
    .catch((error) => console.error("Migration failed:", error));
}
