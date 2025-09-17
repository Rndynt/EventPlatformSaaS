import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  boolean, 
  integer, 
  decimal, 
  jsonb,
  uuid,
  serial
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for basic auth (keeping original)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Tenants table for multi-tenancy
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  domains: jsonb("domains").$type<string[]>().default([]),
  theme: jsonb("theme").$type<{
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    logoUrl?: string;
    hidePlatformBranding: boolean;
  }>().default({
    primaryColor: "#6366F1",
    secondaryColor: "#EC4899", 
    accentColor: "#10B981",
    fontFamily: "Inter",
    hidePlatformBranding: false
  }),
  settings: jsonb("settings").$type<{
    allowRegistration: boolean;
    timezone: string;
    currency: string;
  }>().default({
    allowRegistration: true,
    timezone: "UTC",
    currency: "USD"
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Events table
export const events = pgTable("events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  slug: varchar("slug", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // webinar, workshop, concert
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  location: varchar("location", { length: 255 }),
  capacity: integer("capacity"),
  status: varchar("status", { length: 50 }).default("draft"), // draft, published, cancelled
  imageUrl: text("image_url"),
  speakers: jsonb("speakers").$type<Array<{
    name: string;
    title: string;
    bio: string;
    imageUrl: string;
    socialLinks: Record<string, string>;
  }>>().default([]),
  agenda: jsonb("agenda").$type<Array<{
    time: string;
    title: string;
    description: string;
    duration: number;
    speaker?: string;
  }>>().default([]),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Ticket types
export const ticketTypes = pgTable("ticket_types", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid("event_id").notNull().references(() => events.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00"),
  currency: varchar("currency", { length: 3 }).default("USD"),
  quantity: integer("quantity"),
  quantitySold: integer("quantity_sold").default(0),
  isPaid: boolean("is_paid").default(false),
  isVisible: boolean("is_visible").default(true),
  perks: jsonb("perks").$type<string[]>().default([]),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow()
});

// Tickets (individual purchases)
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  token: varchar("token", { length: 255 }).notNull().unique(),
  eventId: uuid("event_id").notNull().references(() => events.id),
  ticketTypeId: uuid("ticket_type_id").notNull().references(() => ticketTypes.id),
  attendeeId: uuid("attendee_id").notNull().references(() => attendees.id),
  status: varchar("status", { length: 50 }).default("pending"), // pending, issued, used, cancelled
  qrCode: text("qr_code"),
  checkedInAt: timestamp("checked_in_at"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow()
});

// Attendees
export const attendees = pgTable("attendees", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow()
});

// Transactions
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  status: varchar("status", { length: 50 }).default("pending"), // pending, completed, failed, refunded
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow()
});

// Admin users
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("admin"), // admin, manager, staff
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Referrals
export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  eventId: uuid("event_id").notNull().references(() => events.id),
  referrerId: uuid("referrer_id").references(() => attendees.id),
  uses: integer("uses").default(0),
  maxUses: integer("max_uses"),
  discount: decimal("discount", { precision: 5, scale: 2 }),
  discountType: varchar("discount_type", { length: 20 }).default("percent"), // percent, fixed
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  events: many(events),
  adminUsers: many(adminUsers)
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [events.tenantId],
    references: [tenants.id]
  }),
  ticketTypes: many(ticketTypes),
  tickets: many(tickets),
  referrals: many(referrals)
}));

export const ticketTypesRelations = relations(ticketTypes, ({ one, many }) => ({
  event: one(events, {
    fields: [ticketTypes.eventId],
    references: [events.id]
  }),
  tickets: many(tickets)
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  event: one(events, {
    fields: [tickets.eventId],
    references: [events.id]
  }),
  ticketType: one(ticketTypes, {
    fields: [tickets.ticketTypeId],
    references: [ticketTypes.id]
  }),
  attendee: one(attendees, {
    fields: [tickets.attendeeId],
    references: [attendees.id]
  }),
  transaction: one(transactions, {
    fields: [tickets.id],
    references: [transactions.ticketId]
  })
}));

export const attendeesRelations = relations(attendees, ({ many }) => ({
  tickets: many(tickets),
  referrals: many(referrals)
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  ticket: one(tickets, {
    fields: [transactions.ticketId],
    references: [tickets.id]
  })
}));

export const adminUsersRelations = relations(adminUsers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [adminUsers.tenantId],
    references: [tenants.id]
  })
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  event: one(events, {
    fields: [referrals.eventId],
    references: [events.id]
  }),
  referrer: one(attendees, {
    fields: [referrals.referrerId],
    references: [attendees.id]
  })
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTicketTypeSchema = createInsertSchema(ticketTypes).omit({
  id: true,
  createdAt: true
});

export const insertAttendeeSchema = createInsertSchema(attendees).omit({
  id: true,
  createdAt: true
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true
});

// Select schemas
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type TicketType = typeof ticketTypes.$inferSelect;
export type InsertTicketType = z.infer<typeof insertTicketTypeSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Attendee = typeof attendees.$inferSelect;
export type InsertAttendee = z.infer<typeof insertAttendeeSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
