import { Provider } from "ltijs";
import { config } from "dotenv";
import path from "path";
import Database from "ltijs-sequelize";

config();

// Initialize ltijs provider
const lti = Provider;

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
lti.setup(
  process.env.LTI_KEY || "LTIKEY",
  {
    plugin: db,
  },
  {
    appUrl: "/",
    loginUrl: "/login",
    staticPath: path.join(__dirname, "../public"),
    cookies: {
      secure: false,
      sameSite: "Lax",
    },
  }
);

// Configure view engine
lti.app.set("views", path.join(__dirname, "views"));
lti.app.set("view engine", "ejs");

// Setup and deploy
const setup = async () => {
  const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Deploy first
  await lti.deploy({ port: PORT });

  // Then register platform
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

  console.log(`LTI tool running on http://localhost:${PORT}`);
  console.log("Configuration URLs for Canvas:");
  console.log(`Launch URL: http://localhost:${PORT}/ltijs/launch`);
  console.log(`Login URL: http://localhost:${PORT}/ltijs/login`);
  console.log(`JWKS URL: http://localhost:${PORT}/ltijs/keys`);
  console.log(`OIDC URL: http://localhost:${PORT}/ltijs/oidc`);
};

setup().catch(console.error);
