import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  events: router({
    list: publicProcedure.query(() => db.getPublishedEvents()),
    listAll: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return db.getAllEvents();
    }),
    upcoming: publicProcedure.query(() => db.getUpcomingEvents()),
    get: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getEventById(input.id)),
    create: protectedProcedure.input(z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      date: z.string(),
      endDate: z.string().optional(),
      location: z.string().optional(),
      locationLat: z.string().optional(),
      locationLng: z.string().optional(),
      locationInstructions: z.string().optional(),
      price: z.string().optional(),
      maxGuests: z.number().optional(),
      imageUrl: z.string().optional(),
      mercadoPagoLink: z.string().optional(),
      status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
    })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return db.createEvent({ ...input, date: new Date(input.date), endDate: input.endDate ? new Date(input.endDate) : undefined });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      date: z.string().optional(),
      endDate: z.string().optional(),
      location: z.string().optional(),
      locationLat: z.string().optional(),
      locationLng: z.string().optional(),
      locationInstructions: z.string().optional(),
      price: z.string().optional(),
      maxGuests: z.number().optional(),
      imageUrl: z.string().optional(),
      mercadoPagoLink: z.string().optional(),
      status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
    })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      const { id, date, endDate, ...rest } = input;
      return db.updateEvent(id, { ...rest, date: date ? new Date(date) : undefined, endDate: endDate ? new Date(endDate) : undefined });
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return db.deleteEvent(input.id);
    }),
  }),
  invitations: router({
    myInvitations: protectedProcedure.query(({ ctx }) => db.getInvitationsByUser(ctx.user.id)),
    getByEvent: protectedProcedure.input(z.object({ eventId: z.number() })).query(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return db.getInvitationsByEvent(input.eventId);
    }),
    getMyInvitationForEvent: protectedProcedure.input(z.object({ eventId: z.number() })).query(({ ctx, input }) =>
      db.getUserInvitationForEvent(ctx.user.id, input.eventId)
    ),
    create: protectedProcedure.input(z.object({
      eventId: z.number(),
      qrCode: z.string(),
      guestCount: z.number().optional(),
    })).mutation(({ ctx, input }) =>
      db.createInvitation({ userId: ctx.user.id, eventId: input.eventId, qrCode: input.qrCode, guestCount: input.guestCount ?? 1 })
    ),
    markPaid: protectedProcedure.input(z.object({ id: z.number(), paymentReference: z.string().optional() })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return db.updateInvitation(input.id, { status: "paid", paymentReference: input.paymentReference });
    }),
    checkIn: protectedProcedure.input(z.object({ qrCode: z.string() })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return db.checkInInvitation(input.qrCode, ctx.user.id);
    }),
    scanQr: protectedProcedure.input(z.object({ qrCode: z.string() })).query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      const inv = await db.getInvitationByQrCode(input.qrCode);
      if (!inv) return null;
      const user = await db.getUserById(inv.userId);
      const event = await db.getEventById(inv.eventId);
      return { invitation: inv, user, event };
    }),
  }),
  vipOrders: router({
    myOrders: protectedProcedure.query(({ ctx }) => db.getVipOrdersByUser(ctx.user.id)),
    getByEvent: protectedProcedure.input(z.object({ eventId: z.number() })).query(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return db.getVipOrdersByEvent(input.eventId);
    }),
    getAllOrders: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return db.getAllVipOrders();
    }),
    create: protectedProcedure.input(z.object({
      eventId: z.number(),
      invitationId: z.number(),
      items: z.string(),
      notes: z.string().optional(),
    })).mutation(({ ctx, input }) =>
      db.createVipOrder({ userId: ctx.user.id, eventId: input.eventId, invitationId: input.invitationId, items: input.items, notes: input.notes })
    ),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending", "confirmed", "delivered", "cancelled"]),
    })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return db.updateVipOrder(input.id, { status: input.status });
    }),
  }),
  notifications: router({
    list: protectedProcedure.query(() => db.getNotifications(50)),
    unreadCount: protectedProcedure.query(({ ctx }) => db.getUserUnreadNotificationCount(ctx.user.id)),
    markRead: protectedProcedure.input(z.object({ notificationId: z.number() })).mutation(({ ctx, input }) =>
      db.markNotificationRead(ctx.user.id, input.notificationId)
    ),
    send: protectedProcedure.input(z.object({
      eventId: z.number().optional(),
      title: z.string().min(1).max(255),
      body: z.string().min(1),
      type: z.enum(["event_reminder", "location", "general", "payment", "order"]).optional(),
    })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return db.createNotification({ eventId: input.eventId, title: input.title, body: input.body, type: input.type ?? "general" });
    }),
  }),
  admin: router({
    users: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return db.getAllUsers();
    }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      const [allUsers, allEvents] = await Promise.all([db.getAllUsers(), db.getAllEvents()]);
      return {
        totalUsers: allUsers.length,
        totalEvents: allEvents.length,
        publishedEvents: allEvents.filter((e) => e.status === "published").length,
      };
    }),
    accessCodes: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      return db.getAllAccessCodes();
    }),
  }),
  accessCodes: router({
    // Seed codes on startup (called from app init)
    seed: publicProcedure.mutation(() => db.seedAccessCodes()),
    // Validate and login with code
    login: publicProcedure.input(z.object({ code: z.string() })).mutation(async ({ input }) => {
      await db.seedAccessCodes();
      const accessCode = await db.getAccessCodeByCode(input.code);
      if (!accessCode) throw new Error("Código inválido. Verifica e intenta de nuevo.");
      if (!accessCode.isActive) throw new Error("Este código ha sido desactivado.");
      // Create or get user for this code
      const openId = `code_${accessCode.code}`;
      await db.upsertUser({
        openId,
        name: accessCode.displayName,
        loginMethod: "access_code",
        role: accessCode.role,
        lastSignedIn: new Date(),
      });
      const user = await db.getUserByOpenId(openId);
      if (!user) throw new Error("Error al crear usuario");
      // Link code to user
      await db.linkAccessCodeToUser(accessCode.id, user.id);
      return { user, accessCode };
    }),
  }),
  users: router({
    updateName: protectedProcedure.input(z.object({ name: z.string().min(1).max(100) })).mutation(async ({ ctx, input }) => {
      await db.updateUserName(ctx.user.id, input.name.trim());
      // Also update chat presence name
      const userCode = (ctx.user as any).openId?.replace("code_", "") ?? "";
      await db.upsertPresence({
        userId: ctx.user.id,
        userName: input.name.trim(),
        userCode,
        isAdmin: ctx.user.role === "admin",
        isOnline: true,
      });
      return { success: true };
    }),
    savePushToken: protectedProcedure.input(z.object({ token: z.string() })).mutation(async ({ ctx, input }) => {
      await db.savePushToken(ctx.user.id, input.token);
      return { success: true };
    }),
    me: protectedProcedure.query(({ ctx }) => ctx.user),
  }),
  push: router({
    sendToAll: protectedProcedure.input(z.object({
      title: z.string().min(1).max(255),
      body: z.string().min(1).max(1000),
      data: z.record(z.string(), z.unknown()).optional(),
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      const tokens = await db.getAllPushTokens();
      if (tokens.length === 0) return { sent: 0, failed: 0 };
      const messages = tokens.map((token) => ({
        to: token,
        title: input.title,
        body: input.body,
        data: input.data ?? {},
        sound: "default" as const,
        priority: "high" as const,
      }));
      // Send in chunks of 100 (Expo limit)
      let sent = 0;
      let failed = 0;
      for (let i = 0; i < messages.length; i += 100) {
        const chunk = messages.slice(i, i + 100);
        try {
          const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json", "Accept-Encoding": "gzip, deflate" },
            body: JSON.stringify(chunk),
          });
          const result = await response.json();
          const data = result.data ?? [];
          for (const item of data) {
            if (item.status === "ok") sent++;
            else failed++;
          }
        } catch (e) {
          failed += chunk.length;
        }
      }
      // Also save as notification in DB
      await db.createNotification({
        title: input.title,
        body: input.body,
        type: "general",
      });
      return { sent, failed, total: tokens.length };
    }),
  }),
  chat: router({
    // Get recent messages
    messages: protectedProcedure.input(z.object({ afterId: z.number().optional() })).query(({ input }) =>
      db.getLatestChatMessages(input.afterId, 80)
    ),
    // Send a message
    send: protectedProcedure.input(z.object({ message: z.string().min(1).max(1000) })).mutation(({ ctx, input }) => {
      const userCode = (ctx.user as any).openId?.replace("code_", "") ?? "";
      return db.createChatMessage({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "Invitado",
        userCode,
        isAdmin: ctx.user.role === "admin",
        message: input.message,
      });
    }),
    // Update presence (heartbeat)
    heartbeat: protectedProcedure.mutation(({ ctx }) => {
      const userCode = (ctx.user as any).openId?.replace("code_", "") ?? "";
      return db.upsertPresence({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "Invitado",
        userCode,
        isAdmin: ctx.user.role === "admin",
        isOnline: true,
      });
    }),
    // Go offline
    offline: protectedProcedure.mutation(({ ctx }) =>
      db.setPresenceOffline(ctx.user.id)
    ),
    // Get online users
    onlineUsers: protectedProcedure.query(() => db.getOnlineUsers()),
  }),
  reactions: router({
    add: protectedProcedure.input(z.object({
      messageId: z.number(),
      emoji: z.string().min(1).max(10),
    })).mutation(({ ctx, input }) =>
      db.addReaction({
        messageId: input.messageId,
        userId: ctx.user.id,
        userName: ctx.user.name ?? "Invitado",
        emoji: input.emoji,
      })
    ),
    byMessages: protectedProcedure.input(z.object({ messageIds: z.array(z.number()) })).query(({ input }) =>
      db.getReactionsByMessages(input.messageIds)
    ),
  }),
  photos: router({
    list: protectedProcedure.input(z.object({ eventId: z.number() })).query(({ input }) =>
      db.getEventPhotos(input.eventId)
    ),
    add: protectedProcedure.input(z.object({
      eventId: z.number(),
      photoUrl: z.string().url(),
      caption: z.string().optional(),
    })).mutation(({ ctx, input }) =>
      db.addEventPhoto({
        eventId: input.eventId,
        userId: ctx.user.id,
        userName: ctx.user.name ?? "Invitado",
        photoUrl: input.photoUrl,
        caption: input.caption,
      })
    ),
    delete: protectedProcedure.input(z.object({ photoId: z.number() })).mutation(({ ctx, input }) =>
      db.deleteEventPhoto(input.photoId, ctx.user.id)
    ),
  }),
});
export type AppRouter = typeof appRouter;

