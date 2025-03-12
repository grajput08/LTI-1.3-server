import pool from "../config";

export const cleanup = async () => {
  try {
    await pool.query(`
      DROP TABLE IF EXISTS idtoken CASCADE;
      DROP TABLE IF EXISTS contexttoken CASCADE;
      DROP TABLE IF EXISTS platformtoken CASCADE;
      DROP TABLE IF EXISTS platform CASCADE;
    `);
    console.log("✅ Tables cleaned up successfully");
  } catch (error) {
    console.error("❌ Error cleaning up tables:", error);
  }
};
