import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  phone: varchar("phone", { length: 20 }),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Events table — VIP events created by admin
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  endDate: timestamp("endDate"),
  location: varchar("location", { length: 500 }),
  locationLat: decimal("locationLat", { precision: 10, scale: 7 }),
  locationLng: decimal("locationLng", { precision: 10, scale: 7 }),
  locationInstructions: text("locationInstructions"),
  price: decimal("price", { precision: 10, scale: 2 }).default("500.00").notNull(),
  maxGuests: int("maxGuests").default(40).notNull(),
  imageUrl: text("imageUrl"),
  mercadoPagoLink: text("mercadoPagoLink"),
  status: mysqlEnum("status", ["draft", "published", "cancelled", "completed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Invitations table — QR codes per user per event
 */
export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventId: int("eventId").notNull(),
  qrCode: varchar("qrCode", { length: 128 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "paid", "checked_in", "cancelled"]).default("pending").notNull(),
  paymentReference: varchar("paymentReference", { length: 255 }),
  checkedInAt: timestamp("checkedInAt"),
  checkedInBy: int("checkedInBy"),
  guestCount: int("guestCount").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;

/**
 * VIP Orders — service orders during events
 */
export const vipOrders = mysqlTable("vip_orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventId: int("eventId").notNull(),
  invitationId: int("invitationId").notNull(),
  items: text("items").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "delivered", "cancelled"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VipOrder = typeof vipOrders.$inferSelect;
export type InsertVipOrder = typeof vipOrders.$inferInsert;

/**
 * Notifications table — push notifications sent to users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId"),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  type: mysqlEnum("type", ["event_reminder", "location", "general", "payment", "order"]).default("general").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * User notification reads
 */
export const userNotifications = mysqlTable("user_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  notificationId: int("notificationId").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = typeof userNotifications.$inferInsert;
