const fs = require('fs');
const path = require('path');

require('dotenv-flow').config({ path: path.resolve(__dirname, '../apps/backend/') });
const DATABASE_URL = process.env.DATABASE_URL;
const dsn = DATABASE_URL.replace('localhost', 'host.docker.internal');

if (!dsn) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}
const npxCommand = `docker run --rm --init \
  --detach \
  --name dbhub \
  --publish 5430:5430 \
  bytebase/dbhub \
  --transport http \
  --port 5430 \
  --dsn "${dsn}"`;
require('child_process').execSync(npxCommand, { stdio: 'inherit' });

console.log(
  `
  The DBhub container has been started successfully.
  Access the DBhub UI at: http://localhost:5430
  Access the MCP endpoint at: http://localhost:5430/mcp
  `,
);
