import { and, desc, eq, gte, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  accessCodes,
  chatMessages,
  chatReactions,
  eventPhotos,
  events,
  invitations,
  notifications,
  userNotifications,
  userPresence,
  users,
  vipOrders,
  type InsertAccessCode,
  type InsertChatMessage,
  type InsertEvent,
  type InsertInvitation,
  type InsertNotification,
  type InsertUser,
  type InsertUserPresence,
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

// ============================================================
// ACCESS CODES
// ============================================================

export async function seedAccessCodes() {
  const db = await getDb();
  if (!db) return;
  // Check if already seeded
  const existing = await db.select().from(accessCodes).limit(1);
  if (existing.length > 0) return;
  const codes: InsertAccessCode[] = [];
  for (let i = 1; i <= 50; i++) {
    const num = String(i).padStart(3, "0");
    const code = `tlc${num}`;
    const isAdmin = i <= 5; // tlc001 a tlc005 son admins
    codes.push({
      code,
      role: isAdmin ? "admin" : "user",
      displayName: isAdmin ? `Admin ${i}` : `Invitado ${i}`,
      isActive: true,
    });
  }
  await db.insert(accessCodes).values(codes);
}

export async function getAccessCodeByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(accessCodes).where(eq(accessCodes.code, code.toLowerCase().trim())).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function linkAccessCodeToUser(codeId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(accessCodes).set({ userId, lastUsedAt: new Date() }).where(eq(accessCodes.id, codeId));
}

export async function getAllAccessCodes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accessCodes).orderBy(accessCodes.id);
}

// ============================================================
// CHAT MESSAGES
// ============================================================

export async function getChatMessages(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).orderBy(desc(chatMessages.createdAt)).limit(limit);
}

export async function createChatMessage(data: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatMessages).values(data);
  return result[0].insertId;
}

export async function getLatestChatMessages(afterId?: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  if (afterId) {
    const { gt } = await import("drizzle-orm");
    return db.select().from(chatMessages).where(gt(chatMessages.id, afterId)).orderBy(chatMessages.createdAt).limit(limit);
  }
  const msgs = await db.select().from(chatMessages).orderBy(desc(chatMessages.createdAt)).limit(limit);
  return msgs.reverse();
}

// ============================================================
// USER PRESENCE
// ============================================================

export async function upsertPresence(data: InsertUserPresence) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userPresence).values({ ...data, lastSeenAt: new Date(), isOnline: true })
    .onDuplicateKeyUpdate({ set: { lastSeenAt: new Date(), isOnline: true, userName: data.userName, userCode: data.userCode, isAdmin: data.isAdmin } });
}

export async function setPresenceOffline(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(userPresence).set({ isOnline: false, lastSeenAt: new Date() }).where(eq(userPresence.userId, userId));
}

export async function getOnlineUsers() {
  const db = await getDb();
  if (!db) return [];
  // Users seen in last 2 minutes are considered online
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  const { gte: gteOp } = await import("drizzle-orm");
  return db.select().from(userPresence).where(and(eq(userPresence.isOnline, true), gteOp(userPresence.lastSeenAt, twoMinutesAgo))).orderBy(userPresence.userName);
}

export async function getAllPresence() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userPresence).orderBy(desc(userPresence.lastSeenAt));
}

// ============================================================
// USER NAME & PUSH TOKEN
// ============================================================
export async function updateUserName(userId: number, name: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ name, hasSetName: true, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function savePushToken(userId: number, pushToken: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ pushToken, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function getAllPushTokens(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ pushToken: users.pushToken }).from(users).where(isNotNull(users.pushToken));
  return result.map((r) => r.pushToken!).filter(Boolean);
}

export async function getPushTokensByUserIds(userIds: number[]): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  if (userIds.length === 0) return [];
  const { inArray } = await import("drizzle-orm");
  const result = await db.select({ pushToken: users.pushToken }).from(users).where(inArray(users.id, userIds));
  return result.map((r) => r.pushToken!).filter(Boolean);
}

// ============================================================
// CHAT REACTIONS
// ============================================================
export async function addReaction(data: { messageId: number; userId: number; userName: string; emoji: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Remove existing reaction from same user on same message (toggle)
  const existing = await db.select().from(chatReactions)
    .where(and(eq(chatReactions.messageId, data.messageId), eq(chatReactions.userId, data.userId), eq(chatReactions.emoji, data.emoji)));
  if (existing.length > 0) {
    await db.delete(chatReactions).where(eq(chatReactions.id, existing[0].id));
    return { toggled: false };
  }
  await db.insert(chatReactions).values(data);
  return { toggled: true };
}

export async function getReactionsByMessages(messageIds: number[]) {
  const db = await getDb();
  if (!db) return [];
  if (messageIds.length === 0) return [];
  const { inArray } = await import("drizzle-orm");
  return db.select().from(chatReactions).where(inArray(chatReactions.messageId, messageIds));
}

// ============================================================
// EVENT PHOTOS
// ============================================================
export async function addEventPhoto(data: { eventId: number; userId: number; userName: string; photoUrl: string; caption?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(eventPhotos).values(data);
  return result[0].insertId;
}

export async function getEventPhotos(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(eventPhotos).where(eq(eventPhotos.eventId, eventId)).orderBy(desc(eventPhotos.createdAt));
}

export async function deleteEventPhoto(photoId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(eventPhotos).where(and(eq(eventPhotos.id, photoId), eq(eventPhotos.userId, userId)));
}

export async function getAllVipOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vipOrders).orderBy(desc(vipOrders.createdAt));
}
