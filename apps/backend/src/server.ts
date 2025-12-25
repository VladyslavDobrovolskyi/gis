import express from 'express';
import cors from 'cors';
import { getAllCities } from '@generated/cities.types';
import { getDistanceFromTo } from '@generated/distance.types';
import { runQuery, runOne, runRaw } from '@db/runner';
import {
  City,
  CitiesSchema,
  GetDistanceFromToParamsSchema,
  GetDistanceFromToResultSchema,
} from '@gis/shared/schemas';

import { setupSwagger } from '@docs/swagger';

const app = express();
const port = 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

setupSwagger(app);

app.get('/', async (req, res) => {
  try {
    const result = await runQuery(getAllCities);
    const cities: City[] = CitiesSchema.parse(result);
    res.json(cities);
  } catch (err) {
    console.error('Database connection failed or validation failed:', err);
    res.status(500).json({ error: 'Database query or validation failed' });
  }
});

app.get('/distance', async (req, res) => {
  const { from, to } = GetDistanceFromToParamsSchema.parse(req.query);

  if (!from || !to) {
    return res.status(400).json({ error: 'Please provide "from" and "to" query parameters' });
  }

  try {
    const result = await runOne(getDistanceFromTo, { from: String(from), to: String(to) });
    const distance = GetDistanceFromToResultSchema.parse(result);
    res.json(distance);
  } catch (err) {
    console.error('Database query failed:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.get('/raw', async (req, res) => {
  try {
    const result = await runRaw('SELECT NOW() AS date');
    const date = result.rows[0];
    res.json(date);
  } catch (err) {
    console.error('Database query failed:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
