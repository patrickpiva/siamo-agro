import type { PrismaClient } from '@siamo/db'
import { AppError } from '@siamo/shared'
import type { ListNotificationsQuery } from './schema.js'

export class NotificationsService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(userId: string, query: ListNotificationsQuery) {
    const { type, cursor, limit } = query

    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    })

    const hasMore = notifications.length > limit
    const items = hasMore ? notifications.slice(0, limit) : notifications
    const nextCursor = hasMore ? (items[items.length - 1]?.createdAt.toISOString() ?? null) : null

    const unreadCount = await this.prisma.notification.count({
      where: { userId, read: false },
    })

    return {
      data: items.map((n) => ({
        id: n.id,
        type: n.type,
        read: n.read,
        data: n.data as Record<string, unknown>,
        createdAt: n.createdAt.toISOString(),
      })),
      meta: { nextCursor, limit, unreadCount },
    }
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })
    return { ok: true as const }
  }

  async markOneRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    })
    if (!notification) throw new NotificationNotFoundError()

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    })
    return { ok: true as const }
  }
}

export class NotificationNotFoundError extends AppError {
  constructor() {
    super('Notificação não encontrada', 'NOTIFICATION_NOT_FOUND', 404)
  }
}
