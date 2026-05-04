import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  const admin = await prisma.user.upsert({
    where: { email: 'admin@agrolink.com.br' },
    update: {},
    create: {
      email: 'admin@agrolink.com.br',
      name: 'Admin AgroLink',
      role: 'ADMIN',
    },
  })

  console.log('✅ Seed concluído:', { admin })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
