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
  process.env.LTI_KEY ||
    "LTIKEY_" + Math.random().toString(36).substring(2, 15),
  {
    plugin: db,
  },
  {
    appUrl: "/",
    loginUrl: "/login",
    staticPath: path.join(__dirname, "../public"),
    cookies: {
      secure: false, // Set secure to true if the testing platform is in a different domain and https is being used
      sameSite: "", // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
    },
    devMode: true,
  }
);

// Configure view engine
lti.app.set("views", path.join(__dirname, "views"));
lti.app.set("view engine", "ejs");

// Add route handler for the root path
lti.onConnect((token, req, res) => {
  return res.render("index", {
    title: "LTI Tool",
    message: "Platform confirmation successful!",
    token: token,
  });
});

// Setup and deploy
const setup = async () => {
  const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  try {
    // Deploy first
    await lti.deploy({ port: PORT });

    // Then register platform
    const platform = await lti.registerPlatform({
      url: "https://canvas.instructure.com",
      name: "Docker Canvas",
      clientId: process.env.CANVAS_CLIENT_ID || "client_id",
      authenticationEndpoint: `${process.env.CANVAS_URL}/api/lti/authorize_redirect`,
      accesstokenEndpoint: `${process.env.CANVAS_URL}/login/oauth2/token`,
      authConfig: {
        method: "JWK_SET",
        key: `${process.env.CANVAS_URL}/api/lti/security/jwks`,
      },
    });

    console.log(`\n✅ LTI tool running on http://localhost:${PORT}`);
    console.log("Configuration URLs for Canvas:");
    console.log(`Launch URL: http://localhost:${PORT}/ltijs/launch`);
    console.log(`Login URL: http://localhost:${PORT}/ltijs/login`);
    console.log(`JWKS URL: http://localhost:${PORT}/ltijs/keys`);
    console.log(`OIDC URL: http://localhost:${PORT}/ltijs/oidc`);
  } catch (error) {
    console.error("\n❌ Setup failed!");
    console.error("Error details:", error);
    process.exit(1);
  }
};

setup().catch(console.error);
