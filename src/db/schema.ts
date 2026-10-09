import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// 1. Listings Table
export const listings = pgTable('listings', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  price: text('price').notNull(),
  category: text('category').notNull(),
  location: text('location').notNull(),
  phone: text('phone').notNull(),
  ownerName: text('owner_name'),
  imageUrl: text('image_url').notNull(),
  images: text('images').array(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Users Table (ለስልክ ቁጥር Auth)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: text('phone').notNull().unique(),
  fullName: text('full_name'),
  role: text('role').default('user'), // 'user' ወይም 'broker'
  createdAt: timestamp('created_at').defaultNow(),
});
