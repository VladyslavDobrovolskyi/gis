const { execSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../apps/backend/.env') });
let dsn = process.env.DATABASE_URL;
if (!dsn) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

// Convert to PG connection string
const match = dsn.match(/^postgres(?:ql)?:\/\/(.*?):(.*?)@(.*?):(\d+)\/(.*)$/);
if (!match) {
  console.error('DATABASE_URL format is invalid');
  process.exit(1);
}
const [_, user, password, host, port, dbname] = match;
const PG_CONN = `PG:host=${host} port=${port} dbname=${dbname} user=${user} password=${password}`;

const files = [
  {
    file: path.resolve(__dirname, '../database/__init__/countries.geojson'),
    table: 'countries',
    geom: 'geom',
    nlt: 'POLYGON',
  },
  {
    file: path.resolve(__dirname, '../database/__init__/regions.geojson'),
    table: 'regions',
    geom: 'geom',
    nlt: 'MULTIPOLYGON',
  },
  {
    file: path.resolve(__dirname, '../database/__init__/cities.geojson'),
    table: 'cities',
    geom: 'geom',
    nlt: 'POINT',
  },
];

for (const { file, table, geom, nlt } of files) {
  const cmd = [
    'ogr2ogr',
    '-f',
    'PostgreSQL',
    `"${PG_CONN}"`,
    `"${file}"`,
    '-nln',
    table,
    '-overwrite',
    '-nlt',
    nlt,
    '-lco',
    `GEOMETRY_NAME=${geom}`,
  ].join(' ');
  console.log('Выполняется:', cmd);
  execSync(cmd, { stdio: 'inherit', shell: true });
}

console.log('Import GIS data completed successfully.');
