import { Provider } from "ltijs";
import { config } from "dotenv";
import path from "path";
import Database from "ltijs-sequelize";

config();

async function testLTIConnection() {
  try {
    console.log("🔍 Starting LTI connection test...");

    // Initialize provider
    const lti = Provider;
    const LTI_KEY =
      process.env.LTI_KEY ||
      "LTIKEY_" + Math.random().toString(36).substring(2, 15);

    // Initialize database
    const db = new Database(
      process.env.DB_NAME || "lti_tool",
      process.env.DB_USER || "gatikrajput",
      process.env.DB_PASS || "Gatik@12345",
      {
        host: process.env.DB_HOST || "localhost",
        dialect: "postgres",
        logging: false,
        port: parseInt(process.env.DB_PORT || "5432"),
      }
    );

    // Setup ltijs with Sequelize
    await lti.setup(
      LTI_KEY,
      { plugin: db },
      {
        staticPath: path.join(__dirname, "../public"),
        cookies: {
          secure: false,
          sameSite: "Lax",
        },
      }
    );

    // Deploy the provider
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await lti.deploy({ port: PORT, serverless: true });

    // Register platform
    await lti.registerPlatform({
      url: process.env.CANVAS_URL || "http://canvas.docker",
      name: "Docker Canvas",
      clientId: process.env.CANVAS_CLIENT_ID || "client_id",
      authenticationEndpoint: `${process.env.CANVAS_URL}/api/lti/authorize_redirect`,
      accesstokenEndpoint: `${process.env.CANVAS_URL}/login/oauth2/token`,
      authConfig: {
        method: "JWK_SET",
        key: `${process.env.CANVAS_URL}/api/lti/security/jwks`,
      },
    });

    console.log("\n✅ All tests passed successfully!");
    await lti.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed!");
    console.error("Error details:", error);
    process.exit(1);
  }
}

testLTIConnection();
