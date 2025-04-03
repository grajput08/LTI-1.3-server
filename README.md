# LTI 1.3 Assignment Submission Tool

A TypeScript-based Learning Tools Interoperability (LTI) 1.3 tool for integration with Canvas LMS, built using the LTIJS framework.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- Canvas LMS instance (local or remote)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/grajput08/LTI-1.3-server.git
cd lti-hello-world
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env.sample .env
```

4. Create a PostgreSQL database:

```bash
CREATE DATABASE lti_tool;
```

5. Run the development server:

```bash
npm run dev
```

## Usage

1. Start the development server:

```bash
npm run dev
```

2. Configure the LTI tool in Canvas:

- Go to the LTI tool configuration page in Canvas.
- Set the tool's launch URL to `http://localhost:3000/`.
- Set the tool's login URL to `http://localhost:3000/login`.

## Configuration

The `.env` file contains the following environment variables:

- `DB_NAME`: The name of the PostgreSQL database.
- `DB_USER`: The username for the PostgreSQL database.
- `DB_PASS`: The password for the PostgreSQL database.
- `DB_HOST`: The host of the PostgreSQL database.
- `DB_PORT`: The port of the PostgreSQL database.
- `CANVAS_URL`: The URL of the Canvas LMS instance.
- `CANVAS_CLIENT_ID`: The client ID for the Canvas LMS instance.

## Canvas Integration Guide

### Step 1: Configure LTI Key in Canvas

1. Navigate to your Canvas Admin panel
2. Go to Settings > Developer Keys
3. Click "+ Developer Key" and select "LTI Key"
4. Configure the following settings:
   - Title: "LTI Hello World"
   - Target Link URI: `http://localhost:3000`
   - OpenID Connect Initiation URL: `http://localhost:3000/login`
   - JWK Method: Public JWK URL
   - Public JWK URL: `http://localhost:3000/keys`
   - Additional Settings:
     - Can create and update submission results
     - Can view submission results
     - Can create and update submission comments
5. Save the key and make note of the Client ID

Reference: [Guide to Configure LTI Key](https://docs.instructure.com/en/canvas-developer-guide/guides/lti-key-configuration)

### Step 2: Configure the Tool in Canvas

1. Go to Course Settings > Apps
2. Click "+ App"
3. Select "By Client ID" configuration type
4. Enter the following details:
   - Client ID: (from Step 1)
   - Name: "LTI Hello World"
5. Submit and verify the tool appears in your Apps list

Reference: [Guide to Configure External App](https://docs.instructure.com/en/canvas-developer-guide/guides/configure-external-app)

### Step 3: Create an Assignment

1. Go to Assignments in your course
2. Create a new assignment
3. For Submission Type, select "External Tool"
4. Click "Find" and select "LTI Hello World"
5. Configure assignment settings:
   - Points possible
   - Due dates
   - Assignment group
6. Save and publish the assignment

Reference: [Guide to Add Assignment Using External App](https://docs.instructure.com/en/canvas-developer-guide/guides/add-assignment-using-external-app)

### Step 4: Verify Integration

1. Launch the tool from your assignment
2. Verify that you see the welcome message:
   ```
   Platform confirmation successful!
   ```
3. Test the grade submission by:
   - Completing an activity
   - Checking the gradebook for the score

For more details about the configuration, see the [LTIJS documentation](https://cvmcosta.github.io/ltijs).

## Database Migrations

The project includes custom migration scripts. To manage the database:

```bash
# Run both cleanup and create migrations
npm run migrate

# Create database tables
npm run migrate:create

# Test database connection
npm run db:test
```

## Testing

To test the LTI tool:

```bash
npm run lti:test
```
## Local Development with ngrok

### Step 1: Install and Set Up ngrok

1. Download and install ngrok from [https://ngrok.com/download](https://ngrok.com/download)
2. Sign up for a free ngrok account to get your authtoken
3. Configure ngrok with your authtoken:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Step 2: Start Your Local Development Environment

1. Start your LTI application:

```bash
npm run dev
```

2. In a new terminal window, start ngrok to create a secure tunnel to your local server:

```bash
ngrok http 3000
```

3. Note the HTTPS URL provided by ngrok (e.g., `https://1234-abcd-xyz.ngrok.io`)

### Step 3: Update Canvas Configuration

When using ngrok, you'll need to update your Canvas LTI tool configuration with the ngrok URL. Replace `http://localhost:3000` with your ngrok HTTPS URL in the following fields:

1. In Canvas Developer Key settings:

   - Target Link URI: `https://your-ngrok-url/ltijs/launch`
   - OpenID Connect Initiation URL: `https://your-ngrok-url/ltijs/login`
   - Public JWK URL: `https://your-ngrok-url/ltijs/keys`

2. Update your `.env` file with the ngrok URL:

```bash
PLATFORM_URL=https://your-ngrok-url
```

Note: Each time you restart ngrok, you'll get a new URL and will need to update these configurations accordingly.

### Important Considerations

- ngrok free tier provides temporary URLs that change each time you restart ngrok
- For persistent URLs, consider upgrading to a paid ngrok plan
- Make sure your Canvas instance can reach your ngrok URL
- Keep your ngrok terminal window open while testing
