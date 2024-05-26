import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as usersSchema from './schema/users';
import * as financeSchema from './schema/finance';

const client = createClient({
	url: process.env.TURSO_CONNECTION_URL!,
	authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle(client, {
	schema: { ...usersSchema, ...financeSchema },
});
