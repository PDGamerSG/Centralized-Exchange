import { ClientConfig } from "pg";

export const pgConfig: ClientConfig = {
    user: process.env.PGUSER || "exchange",
    host: process.env.PGHOST || "localhost",
    database: process.env.PGDATABASE || "exchange",
    password: process.env.PGPASSWORD || "exchange",
    port: Number(process.env.PGPORT) || 5432,
};
