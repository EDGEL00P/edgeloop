import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';
export const teams = pgTable('teams', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 3 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    conference: varchar('conference', { length: 10 }).notNull(),
    division: varchar('division', { length: 20 }).notNull(),
    logoUrl: varchar('logo_url', { length: 500 }),
    primaryColor: varchar('primary_color', { length: 7 }),
    secondaryColor: varchar('secondary_color', { length: 7 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
