import { defineConfig } from 'drizzle-kit';

import * as dotenv from 'dotenv';

dotenv.config({
	path: '.env',
});

export default defineConfig({
	schema: './db/schema/*',
	out: './migrations',
	dialect: 'sqlite',
	driver: 'turso',
	dbCredentials: {
		url: process.env.TURSO_CONNECTION_URL!,
		authToken: process.env.TURSO_AUTH_TOKEN!,
	},
});
