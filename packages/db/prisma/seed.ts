import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // ─── User A — faz login no browser para testar ────────────────────────────
  const userA = await prisma.user.upsert({
    where: { phone: '+5511999990001' },
    update: {},
    create: { phone: '+5511999990001', status: 'ACTIVE' },
  })

  const profileA = await prisma.profile.upsert({
    where: { userId: userA.id },
    update: {},
    create: {
      userId: userA.id,
      type: 'PRODUCER',
      name: 'João Produtor',
      bio: 'Produtor de grãos na região de Ribeirão Preto há 15 anos.',
      badge: 'GOLD',
      currentRating: 4.7,
      ratingCount: 23,
    },
  })

  // Ribeirão Preto — SP
  await prisma.location.upsert({
    where: { profileId: profileA.id },
    update: {},
    create: {
      profileId: profileA.id,
      latitude: -21.1775,
      longitude: -47.8103,
      city: 'Ribeirão Preto',
      state: 'SP',
    },
  })

  // Listing A — OFFER de soja
  const listingA = await prisma.listing.upsert({
    where: { id: 'seed-listing-a' },
    update: {},
    create: {
      id: 'seed-listing-a',
      profileId: profileA.id,
      kind: 'OFFER',
      category: 'GRAINS',
      title: 'Soja safra 2025 disponível para venda',
      description:
        'Soja limpa a granel disponível para entrega imediata. Qualidade certificada, umidade 13%. Capacidade de 500 sacas/mês.',
      price: 125.5,
      status: 'ACTIVE',
    },
  })

  // ─── User B — candidato de match (só no banco, sem login necessário) ───────
  const userB = await prisma.user.upsert({
    where: { phone: '+5511999990002' },
    update: {},
    create: { phone: '+5511999990002', status: 'ACTIVE' },
  })

  const profileB = await prisma.profile.upsert({
    where: { userId: userB.id },
    update: {},
    create: {
      userId: userB.id,
      type: 'PRODUCER',
      name: 'Maria Compradora',
      bio: 'Compradora de grãos para indústria de ração. Contratos de longo prazo.',
      badge: 'SILVER',
      currentRating: 4.2,
      ratingCount: 8,
    },
  })

  // Sertãozinho — SP (~25 km de Ribeirão Preto)
  await prisma.location.upsert({
    where: { profileId: profileB.id },
    update: {},
    create: {
      profileId: profileB.id,
      latitude: -21.1394,
      longitude: -47.9875,
      city: 'Sertãozinho',
      state: 'SP',
    },
  })

  // Listing B — DEMAND de soja (complementa o OFFER de A)
  await prisma.listing.upsert({
    where: { id: 'seed-listing-b' },
    update: {},
    create: {
      id: 'seed-listing-b',
      profileId: profileB.id,
      kind: 'DEMAND',
      category: 'GRAINS',
      title: 'Procuro fornecedor de soja orgânica',
      description:
        'Indústria de ração busca fornecedor de soja orgânica para contrato mensal. Volume mínimo 300 sacas. Pagamento à vista.',
      status: 'ACTIVE',
    },
  })

  // ─── User C — prestador de serviço (segundo candidato) ────────────────────
  const userC = await prisma.user.upsert({
    where: { phone: '+5511999990003' },
    update: {},
    create: { phone: '+5511999990003', status: 'ACTIVE' },
  })

  const profileC = await prisma.profile.upsert({
    where: { userId: userC.id },
    update: {},
    create: {
      userId: userC.id,
      type: 'PROVIDER',
      name: 'Carlos Agrônomo',
      bio: 'Engenheiro agrônomo especializado em soja e milho. CREA ativo.',
      badge: 'NONE',
      currentRating: 4.9,
      ratingCount: 41,
    },
  })

  // Jardinópolis — SP (~18 km de Ribeirão Preto)
  await prisma.location.upsert({
    where: { profileId: profileC.id },
    update: {},
    create: {
      profileId: profileC.id,
      latitude: -21.0177,
      longitude: -47.7628,
      city: 'Jardinópolis',
      state: 'SP',
    },
  })

  // Listing C — SERVICE que atende DEMAND/OFFER de grãos
  await prisma.listing.upsert({
    where: { id: 'seed-listing-c' },
    update: {},
    create: {
      id: 'seed-listing-c',
      profileId: profileC.id,
      kind: 'SERVICE',
      category: 'AGRONOMY',
      title: 'Consultoria agronômica para soja e milho',
      description:
        'Serviço de consultoria completa: análise de solo, planejamento de plantio, controle fitossanitário. Atendo propriedades a partir de 50 ha.',
      price: 800,
      status: 'ACTIVE',
    },
  })

  // ─── Update geog via raw SQL (PostGIS) ────────────────────────────────────
  await prisma.$executeRaw`
    UPDATE locations
    SET geog = ST_MakePoint(longitude, latitude)::geography
    WHERE geog IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL
  `

  console.log('✅ Seed concluído:')
  console.log('   User A (login):', userA.id, '— phone: +5511999990001')
  console.log('   Listing A (OFFER/GRAINS):', listingA.id)
  console.log('   User B (candidato):', userB.id, '— 25 km de A')
  console.log('   User C (candidato):', userC.id, '— 18 km de A')
  console.log('')
  console.log('👉 Para testar: acesse http://localhost:3000')
  console.log('   Faça login com +5511999990001')
  console.log('   Leia o OTP em: pnpm db:studio → OtpCode')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
