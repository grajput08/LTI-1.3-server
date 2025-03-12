import pool from "../config";

export const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS platform (
        platformId VARCHAR(255) PRIMARY KEY,
        platformName VARCHAR(255),
        platformUrl VARCHAR(255),
        clientId VARCHAR(255),
        authEndpoint VARCHAR(255),
        accesstokenEndpoint VARCHAR(255),
        kid VARCHAR(255),
        authConfig JSONB,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      // ... rest of the table creation queries ...
    `);
    console.log("✅ Database tables created successfully");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
  }
};
