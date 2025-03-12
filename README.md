# LTI Hello World

A TypeScript-based Learning Tools Interoperability (LTI) 1.3 tool for integration with Canvas LMS, built using the LTIJS framework.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- Canvas LMS instance (local or remote)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/lti-hello-world.git
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
- Set the tool's launch URL to `http://localhost:3000/ltijs/launch`.
- Set the tool's login URL to `http://localhost:3000/ltijs/login`.

## Configuration

The `.env` file contains the following environment variables:

- `DB_NAME`: The name of the PostgreSQL database.
- `DB_USER`: The username for the PostgreSQL database.
- `DB_PASS`: The password for the PostgreSQL database.
- `DB_HOST`: The host of the PostgreSQL database.
- `DB_PORT`: The port of the PostgreSQL database.
- `CANVAS_URL`: The URL of the Canvas LMS instance.
- `CANVAS_CLIENT_ID`: The client ID for the Canvas LMS instance.

## Database Migrations

The project includes custom migration scripts. To manage the database:

```bash
# Run both cleanup and create migrations
npm run migrate

# Create database tables
npm run migrate:create

# Clean up the database
npm run migrate:cleanup

# Test database connection
npm run db:test
```

## Testing

To test the LTI tool:

```bash
npm run lti:test
```

## Cleanup

To cleanup the database:

```bash
npm run migrate:cleanup
```
