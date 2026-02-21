import { and, desc, eq, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  events,
  invitations,
  notifications,
  userNotifications,
  users,
  vipOrders,
  type InsertEvent,
  type InsertInvitation,
  type InsertNotification,
  type InsertUser,
  type InsertVipOrder,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod", "phone", "avatarUrl"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function createEvent(data: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(events).values(data);
  return result[0].insertId;
}

export async function updateEvent(id: number, data: Partial<InsertEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(events).set(data).where(eq(events.id, id));
}

export async function deleteEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(events).where(eq(events.id, id));
}

export async function getEventById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPublishedEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events).where(eq(events.status, "published")).orderBy(events.date);
}

export async function getAllEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events).orderBy(desc(events.createdAt));
}

export async function getUpcomingEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events).where(and(eq(events.status, "published"), gte(events.date, new Date()))).orderBy(events.date);
}

export async function createInvitation(data: InsertInvitation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(invitations).values(data);
  return result[0].insertId;
}

export async function getInvitationByQrCode(qrCode: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invitations).where(eq(invitations.qrCode, qrCode)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getInvitationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invitations).where(eq(invitations.userId, userId)).orderBy(desc(invitations.createdAt));
}

export async function getInvitationsByEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invitations).where(eq(invitations.eventId, eventId)).orderBy(desc(invitations.createdAt));
}

export async function getUserInvitationForEvent(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invitations).where(and(eq(invitations.userId, userId), eq(invitations.eventId, eventId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateInvitation(id: number, data: Partial<InsertInvitation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(invitations).set(data).where(eq(invitations.id, id));
}

export async function checkInInvitation(qrCode: string, adminId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const inv = await getInvitationByQrCode(qrCode);
  if (!inv) throw new Error("Invitation not found");
  if (inv.status === "checked_in") throw new Error("Already checked in");
  if (inv.status !== "paid") throw new Error("Invitation not paid");
  await db.update(invitations).set({ status: "checked_in", checkedInAt: new Date(), checkedInBy: adminId }).where(eq(invitations.qrCode, qrCode));
  return inv;
}

export async function createVipOrder(data: InsertVipOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(vipOrders).values(data);
  return result[0].insertId;
}

export async function getVipOrdersByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vipOrders).where(eq(vipOrders.userId, userId)).orderBy(desc(vipOrders.createdAt));
}

export async function getVipOrdersByEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vipOrders).where(eq(vipOrders.eventId, eventId)).orderBy(desc(vipOrders.createdAt));
}

export async function updateVipOrder(id: number, data: Partial<InsertVipOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(vipOrders).set(data).where(eq(vipOrders.id, id));
}

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(data);
  return result[0].insertId;
}

export async function getNotifications(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).orderBy(desc(notifications.sentAt)).limit(limit);
}

export async function getNotificationsByEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.eventId, eventId)).orderBy(desc(notifications.sentAt));
}

export async function markNotificationRead(userId: number, notificationId: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userNotifications).values({ userId, notificationId, isRead: true }).onDuplicateKeyUpdate({ set: { isRead: true } });
}

export async function getUserUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const allNotifs = await db.select().from(notifications).orderBy(desc(notifications.sentAt)).limit(100);
  const readNotifs = await db.select().from(userNotifications).where(and(eq(userNotifications.userId, userId), eq(userNotifications.isRead, true)));
  const readIds = new Set(readNotifs.map((n) => n.notificationId));
  return allNotifs.filter((n) => !readIds.has(n.id)).length;
}
