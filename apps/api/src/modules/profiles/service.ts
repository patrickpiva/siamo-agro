import type { PrismaClient } from '@agraia/db'
import { ProfileAlreadyExistsError } from './errors.js'
import type { CreateProfileBody } from './schema.js'

export class ProfilesService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(userId: string, body: CreateProfileBody) {
    const existing = await this.prisma.profile.findUnique({ where: { userId } })
    if (existing) throw new ProfileAlreadyExistsError()

    return this.prisma.profile.create({
      data: {
        userId,
        type: body.type,
        name: body.name,
        propertyName: body.propertyName,
        bio: body.bio,
        photo: body.avatarUrl,
        location: body.location
          ? {
              create: {
                latitude: body.location.latitude,
                longitude: body.location.longitude,
                city: body.location.city,
                state: body.location.state,
              },
            }
          : undefined,
      },
    })
  }
}
