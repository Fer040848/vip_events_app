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
  }),
});

export type AppRouter = typeof appRouter;
