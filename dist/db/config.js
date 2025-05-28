"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: parseInt(process.env.DB_PORT || "5432"),
    ssl: process.env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: false,
        }
        : false,
});
// Test the connection
const testConnection = async () => {
    try {
        const client = await exports.pool.connect();
        const result = await client.query("SELECT NOW()");
        console.log("Database connection successful!");
        console.log("Current timestamp:", result.rows[0].now);
        client.release();
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("Database connection failed:", error.message);
        }
        else {
            console.error("Database connection failed:", String(error));
        }
    }
};
// Run the test
testConnection();
exports.default = exports.pool;
