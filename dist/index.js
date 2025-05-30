"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ltijs_1 = require("ltijs");
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
const ltijs_sequelize_1 = __importDefault(require("ltijs-sequelize"));
const routes_1 = __importDefault(require("./routes/routes"));
(0, dotenv_1.config)();
// Initialize ltijs provider
const lti = ltijs_1.Provider;
// Initialize database
const db = new ltijs_sequelize_1.default(process.env.DB_NAME || "lti_tool", process.env.DB_USER || "gatikrajput", process.env.DB_PASS || "Gatik@12345", {
    host: process.env.DB_HOST || "localhost",
    dialect: "postgres",
    logging: false,
    port: parseInt(process.env.DB_PORT || "5432"),
    dialectOptions: {
        ssl: process.env.NODE_ENV === "production"
            ? {
                require: true,
                rejectUnauthorized: false,
            }
            : undefined,
    },
});
const LTI_KEY = process.env.LTI_KEY ||
    "LTIKEY_" + Math.random().toString(36).substring(2, 15);
// Setup ltijs with Sequelize
lti.setup(LTI_KEY, {
    plugin: db,
}, {
    appUrl: `https://ltijs-demo-client-h5wi.vercel.app/?ltik=${LTI_KEY}`,
    loginUrl: "/login",
    staticPath: path_1.default.join(__dirname, "../public"),
    cookies: {
        secure: false, // Set secure to true if the testing platform is in a different domain and https is being used
        sameSite: "None", // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
    },
    devMode: true,
});
lti.app.set("views", path_1.default.join(__dirname, "views"));
lti.app.set("view engine", "ejs");
// Add route handler for the root path
lti.onConnect((token, req, res) => {
    // Check the launch context and redirect accordingly
    console.log("Check the launch context and redirect accordingly Token:", token);
    // Default view for other launches
    return res.render("index", {
        title: "LTI Tool",
        message: "Platform confirmation successful!",
        token: token,
    });
});
// Setting up routes
lti.app.use(routes_1.default);
// Setup and deploy
const setup = async () => {
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    try {
        await lti.deploy({ port: PORT });
        await lti.registerPlatform({
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
        console.log(`\n✅ LTI tool running on ${process.env.CANVAS_URL}`);
        console.log("Configuration URLs for Canvas:");
        console.log(`Launch URL: ${process.env.CANVAS_URL}/launch`);
        console.log(`Login URL: ${process.env.CANVAS_URL}/login`);
        console.log(`JWKS URL: ${process.env.CANVAS_URL}/keys`);
        console.log(`OIDC URL: ${process.env.CANVAS_URL}/oidc`);
    }
    catch (error) {
        console.error("\n❌ Setup failed!");
        console.error("Error details:", error);
        process.exit(1);
    }
};
setup().catch(console.error);
