import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Usuário de desenvolvimento para testes manuais
  const devUser = await prisma.user.upsert({
    where: { phone: '+5511999990001' },
    update: {},
    create: {
      phone: '+5511999990001',
      status: 'ACTIVE',
    },
  })

  // Perfil de produtor associado
  const producerProfile = await prisma.profile.upsert({
    where: { userId: devUser.id },
    update: {},
    create: {
      userId: devUser.id,
      type: 'PRODUCER',
      name: 'Produtor Demo',
      bio: 'Perfil de desenvolvimento para testes manuais.',
      badge: 'NONE',
    },
  })

  // Localização do perfil (São Paulo - SP)
  await prisma.location.upsert({
    where: { profileId: producerProfile.id },
    update: {},
    create: {
      profileId: producerProfile.id,
      latitude: -23.5505,
      longitude: -46.6333,
      city: 'São Paulo',
      state: 'SP',
    },
  })

  console.log('✅ Seed concluído:', {
    userId: devUser.id,
    profileId: producerProfile.id,
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
