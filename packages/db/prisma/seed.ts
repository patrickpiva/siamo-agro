import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // ─── User A — João Silva (demo login +5511999990001) ──────────────────────
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
      name: 'João Silva',
      propertyName: 'Fazenda Santa Cruz',
      bio: 'Produtor de soja e milho na região de Ribeirão Preto há 20 anos. Propriedade de 800 ha com armazém próprio.',
      badge: 'GOLD',
      currentRating: 4.7,
      ratingCount: 23,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  })

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

  await prisma.listing.upsert({
    where: { id: 'seed-listing-a1' },
    update: {},
    create: {
      id: 'seed-listing-a1',
      profileId: profileA.id,
      kind: 'OFFER',
      category: 'SOY',
      title: 'Soja safra 2025/26 — 1.500 sacas disponíveis',
      description:
        'Soja limpa a granel, armazenada em silo metálico. Umidade 13%, impureza < 1%. Certificação de origem disponível. Entrega em caminhão graneleiro ou retirada na propriedade.',
      price: 128.5,
      negotiable: true,
      status: 'ACTIVE',
    },
  })

  await prisma.listing.upsert({
    where: { id: 'seed-listing-a2' },
    update: {},
    create: {
      id: 'seed-listing-a2',
      profileId: profileA.id,
      kind: 'OFFER',
      category: 'CORN',
      title: 'Milho safrinha — entrega imediata em Ribeirão Preto',
      description:
        'Milho safrinha 2025, seco e limpo, em silo. 600 sacas disponíveis para entrega imediata. Adequado para ração animal e exportação. Laudo de classificação disponível.',
      price: 64.0,
      negotiable: false,
      status: 'ACTIVE',
    },
  })

  // ─── User B — Maria Santos (demo login +5511999990002) ────────────────────
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
      name: 'Maria Santos',
      propertyName: 'Sítio Boa Vista',
      bio: 'Produtora familiar com foco em produção orgânica certificada e pecuária leiteira em Sertãozinho. Fornecimento regular para industrias da região.',
      badge: 'SILVER',
      currentRating: 4.2,
      ratingCount: 11,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  })

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

  await prisma.listing.upsert({
    where: { id: 'seed-listing-b1' },
    update: {},
    create: {
      id: 'seed-listing-b1',
      profileId: profileB.id,
      kind: 'DEMAND',
      category: 'SOY',
      title: 'Compramos soja orgânica certificada',
      description:
        'Indústria de alimentos busca fornecedor de soja orgânica certificada (IBD ou Ecocert). Contrato mensal, volume mínimo 200 sacas. Pagamento à vista ou D+3.',
      status: 'ACTIVE',
    },
  })

  await prisma.listing.upsert({
    where: { id: 'seed-listing-b2' },
    update: {},
    create: {
      id: 'seed-listing-b2',
      profileId: profileB.id,
      kind: 'OFFER',
      category: 'DAIRY',
      title: 'Leite in natura — disponível para laticínios',
      description:
        'Produção diária de 800 litros de leite in natura. CCS e CBT dentro dos padrões Instrução Normativa 76/77. Retirada na propriedade ou entrega em raio de 50 km.',
      price: 2.8,
      negotiable: true,
      status: 'ACTIVE',
    },
  })

  // ─── User C — Carlos Melo (demo login +5511999990003) ────────────────────
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
      name: 'Carlos Melo',
      bio: 'Engenheiro agrônomo (CREA-SP 123456) com 12 anos de experiência em soja, milho e cana. Atendo propriedades a partir de 50 ha no interior de SP.',
      badge: 'BRONZE',
      currentRating: 4.9,
      ratingCount: 41,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  })

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

  await prisma.listing.upsert({
    where: { id: 'seed-listing-c1' },
    update: {},
    create: {
      id: 'seed-listing-c1',
      profileId: profileC.id,
      kind: 'SERVICE',
      category: 'AGRONOMY',
      title: 'Consultoria agronômica — soja e milho',
      description:
        'Acompanhamento técnico completo: análise de solo, adubação, manejo integrado de pragas e doenças, colheita. Relatórios semanais. Atendo SP e Triângulo Mineiro.',
      price: 800.0,
      status: 'ACTIVE',
    },
  })

  await prisma.listing.upsert({
    where: { id: 'seed-listing-c2' },
    update: {},
    create: {
      id: 'seed-listing-c2',
      profileId: profileC.id,
      kind: 'SERVICE',
      category: 'CONSULTING',
      title: 'Planejamento de safra 2025/2026',
      description:
        'Elaboração de plano de safra com análise de custo de produção, escolha de cultivares, cronograma de aplicações e projeção de rentabilidade. Inclui 3 visitas técnicas.',
      price: 1200.0,
      negotiable: true,
      status: 'ACTIVE',
    },
  })

  // ─── User D — Lucas Ferreira — PRODUCER — Sorriso, MT ────────────────────
  const userD = await prisma.user.upsert({
    where: { phone: '+5566999990001' },
    update: {},
    create: { phone: '+5566999990001', status: 'ACTIVE' },
  })

  const profileD = await prisma.profile.upsert({
    where: { userId: userD.id },
    update: {},
    create: {
      userId: userD.id,
      type: 'PRODUCER',
      name: 'Lucas Ferreira',
      propertyName: 'Fazenda Cerrado Verde',
      bio: 'Grande produtor de soja e pecuária em Mato Grosso. 2.400 ha de lavoura, armazém próprio com capacidade de 60.000 sacas.',
      badge: 'GOLD',
      currentRating: 4.5,
      ratingCount: 17,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  })

  await prisma.location.upsert({
    where: { profileId: profileD.id },
    update: {},
    create: {
      profileId: profileD.id,
      latitude: -12.5474,
      longitude: -55.721,
      city: 'Sorriso',
      state: 'MT',
    },
  })

  await prisma.listing.upsert({
    where: { id: 'seed-listing-d1' },
    update: {},
    create: {
      id: 'seed-listing-d1',
      profileId: profileD.id,
      kind: 'OFFER',
      category: 'SOY',
      title: 'Soja Mato Grosso — lotes a partir de 1.000 sacas',
      description:
        'Soja convencional safra 2025, a granel, armazenada em silo metálico. Classificação disponível. Aceita retirada no armazém ou FOB Sorriso-MT.',
      price: 126.0,
      negotiable: true,
      status: 'ACTIVE',
    },
  })

  await prisma.listing.upsert({
    where: { id: 'seed-listing-d2' },
    update: {},
    create: {
      id: 'seed-listing-d2',
      profileId: profileD.id,
      kind: 'OFFER',
      category: 'LIVESTOCK',
      title: 'Novilhos Nelore para engorda — 80 cabeças',
      description:
        'Novilhos Nelore puros, 18–22 meses, peso médio 340 kg. Vacinados (aftosa, brucelose), documentação completa GTA. Excelente padrão racial. Frete a negociar.',
      price: 285.0,
      negotiable: false,
      status: 'ACTIVE',
    },
  })

  // ─── User E — Ana Oliveira — PRODUCER — Campo Grande, MS ─────────────────
  const userE = await prisma.user.upsert({
    where: { phone: '+5567999990001' },
    update: {},
    create: { phone: '+5567999990001', status: 'ACTIVE' },
  })

  const profileE = await prisma.profile.upsert({
    where: { userId: userE.id },
    update: {},
    create: {
      userId: userE.id,
      type: 'PRODUCER',
      name: 'Ana Oliveira',
      propertyName: 'Estância Pantanal',
      bio: 'Pecuarista no Mato Grosso do Sul. Especializada em cria e recria de bovinos Nelore. Rebanho de 1.800 cabeças em pastagem rotacionada.',
      badge: 'SILVER',
      currentRating: 4.3,
      ratingCount: 8,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  })

  await prisma.location.upsert({
    where: { profileId: profileE.id },
    update: {},
    create: {
      profileId: profileE.id,
      latitude: -20.4697,
      longitude: -54.6201,
      city: 'Campo Grande',
      state: 'MS',
    },
  })

  await prisma.listing.upsert({
    where: { id: 'seed-listing-e1' },
    update: {},
    create: {
      id: 'seed-listing-e1',
      profileId: profileE.id,
      kind: 'OFFER',
      category: 'LIVESTOCK',
      title: 'Novilhas Nelore — prontas para engorda ou reprodução',
      description:
        'Lote de 60 novilhas Nelore, 14–18 meses, peso médio 290 kg. Excelente padrão racial. Vacinação em dia, GTA e rastreabilidade disponíveis. Entrega a combinar.',
      price: 275.0,
      negotiable: true,
      status: 'ACTIVE',
    },
  })

  await prisma.listing.upsert({
    where: { id: 'seed-listing-e2' },
    update: {},
    create: {
      id: 'seed-listing-e2',
      profileId: profileE.id,
      kind: 'DEMAND',
      category: 'CORN',
      title: 'Compramos milho para confinamento bovino',
      description:
        'Estância com capacidade para confinar 600 animais busca fornecedor de milho em grão para ração. Volume mensal: 800 sacas. Contrato de 6 meses, pagamento quinzenal.',
      status: 'ACTIVE',
    },
  })

  // ─── User F — Pedro Costa — PROVIDER — Uberlândia, MG ───────────────────
  const userF = await prisma.user.upsert({
    where: { phone: '+5534999990001' },
    update: {},
    create: { phone: '+5534999990001', status: 'ACTIVE' },
  })

  const profileF = await prisma.profile.upsert({
    where: { userId: userF.id },
    update: {},
    create: {
      userId: userF.id,
      type: 'PROVIDER',
      name: 'Pedro Costa',
      bio: 'Técnico em mecânica agrícola com 18 anos de experiência. Especialista em New Holland, John Deere e Case IH. Atendo Triângulo Mineiro e Alto Paranaíba.',
      badge: 'NONE',
      currentRating: 4.1,
      ratingCount: 29,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  })

  await prisma.location.upsert({
    where: { profileId: profileF.id },
    update: {},
    create: {
      profileId: profileF.id,
      latitude: -18.9133,
      longitude: -48.2773,
      city: 'Uberlândia',
      state: 'MG',
    },
  })

  await prisma.listing.upsert({
    where: { id: 'seed-listing-f1' },
    update: {},
    create: {
      id: 'seed-listing-f1',
      profileId: profileF.id,
      kind: 'EQUIPMENT',
      category: 'TRACTOR',
      title: 'Trator New Holland T7.210 — locação diária ou semanal',
      description:
        'Trator 210 cv, cabine fechada, tração 4×4, engate triplo. Disponível para locação com operador incluso. Manutenção em dia, pneus novos. Diária inclui combustível.',
      price: 2800.0,
      negotiable: false,
      status: 'ACTIVE',
    },
  })

  await prisma.listing.upsert({
    where: { id: 'seed-listing-f2' },
    update: {},
    create: {
      id: 'seed-listing-f2',
      profileId: profileF.id,
      kind: 'EQUIPMENT',
      category: 'HARVESTER',
      title: 'Colheitadeira Case IH 8120 — locação por safra',
      description:
        'Case IH Axial-Flow 8120, 350 cv, plataforma 30 pés. Disponível para locação por período de safra com operador incluso. Mais de 15.000 ha colhidos.',
      price: 18000.0,
      negotiable: true,
      status: 'ACTIVE',
    },
  })

  await prisma.listing.upsert({
    where: { id: 'seed-listing-f3' },
    update: {},
    create: {
      id: 'seed-listing-f3',
      profileId: profileF.id,
      kind: 'SERVICE',
      category: 'MECHANICS',
      title: 'Manutenção preventiva e corretiva de tratores',
      description:
        'Revisão completa, troca de óleo e filtros, diagnóstico eletrônico, regulagem de injetores. Atendimento na fazenda com kit móvel. Orçamento sem compromisso.',
      price: 180.0,
      negotiable: false,
      status: 'ACTIVE',
    },
  })

  // ─── User G — Fernanda Lima — PROVIDER — Londrina, PR ───────────────────
  const userG = await prisma.user.upsert({
    where: { phone: '+5543999990001' },
    update: {},
    create: { phone: '+5543999990001', status: 'ACTIVE' },
  })

  const profileG = await prisma.profile.upsert({
    where: { userId: userG.id },
    update: {},
    create: {
      userId: userG.id,
      type: 'PROVIDER',
      name: 'Fernanda Lima',
      bio: 'Médica veterinária (CRMV-PR 12345) especializada em bovinos e suínos. Gestão sanitária, nutrição animal e bem-estar. Atendo sul do PR e norte de SC.',
      badge: 'BRONZE',
      currentRating: 4.8,
      ratingCount: 36,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  })

  await prisma.location.upsert({
    where: { profileId: profileG.id },
    update: {},
    create: {
      profileId: profileG.id,
      latitude: -23.3105,
      longitude: -51.1628,
      city: 'Londrina',
      state: 'PR',
    },
  })

  await prisma.listing.upsert({
    where: { id: 'seed-listing-g1' },
    update: {},
    create: {
      id: 'seed-listing-g1',
      profileId: profileG.id,
      kind: 'SERVICE',
      category: 'VETERINARY',
      title: 'Atendimento veterinário rural — bovinos e suínos',
      description:
        'Consultas, diagnóstico, vacinação, exame andrológico e ginecológico, ultrassom reprodutivo. Atendimento na propriedade. Contrato mensal ou por visita avulsa.',
      price: 600.0,
      negotiable: true,
      status: 'ACTIVE',
    },
  })

  await prisma.listing.upsert({
    where: { id: 'seed-listing-g2' },
    update: {},
    create: {
      id: 'seed-listing-g2',
      profileId: profileG.id,
      kind: 'SERVICE',
      category: 'CONSULTING',
      title: 'Gestão sanitária e nutricional do rebanho bovino',
      description:
        'Programa completo de sanidade: calendário vacinal, controle de ecto e endoparasitas, escore corporal, ajuste de dieta. Relatórios mensais e suporte por WhatsApp.',
      price: 1500.0,
      negotiable: false,
      status: 'ACTIVE',
    },
  })

  // ─── User H — Beatriz Horta — PRODUCER — Campinas, SP ───────────────────
  const userH = await prisma.user.upsert({
    where: { phone: '+5519999990001' },
    update: {},
    create: { phone: '+5519999990001', status: 'ACTIVE' },
  })

  const profileH = await prisma.profile.upsert({
    where: { userId: userH.id },
    update: {},
    create: {
      userId: userH.id,
      type: 'PRODUCER',
      name: 'Beatriz Horta',
      propertyName: 'Sítio Verde Vida',
      bio: 'Produtora de hortaliças e frutas orgânicas certificadas em Campinas. Fornecimento para supermercados, restaurantes e CEASA da região.',
      badge: 'NONE',
      currentRating: 3.9,
      ratingCount: 5,
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    },
  })

  await prisma.location.upsert({
    where: { profileId: profileH.id },
    update: {},
    create: {
      profileId: profileH.id,
      latitude: -22.9056,
      longitude: -47.0608,
      city: 'Campinas',
      state: 'SP',
    },
  })

  await prisma.listing.upsert({
    where: { id: 'seed-listing-h1' },
    update: {},
    create: {
      id: 'seed-listing-h1',
      profileId: profileH.id,
      kind: 'OFFER',
      category: 'VEGETABLES',
      title: 'Hortaliças orgânicas certificadas — kit semanal para atacado',
      description:
        'Mix de hortaliças orgânicas (alface, rúcula, couve, espinafre, cenoura, beterraba). Certificação IBD. Pedido mínimo 50 kg/semana. Entrega em Campinas e região.',
      negotiable: true,
      status: 'ACTIVE',
    },
  })

  await prisma.listing.upsert({
    where: { id: 'seed-listing-h2' },
    update: {},
    create: {
      id: 'seed-listing-h2',
      profileId: profileH.id,
      kind: 'OFFER',
      category: 'FRUITS',
      title: 'Frutas tropicais para atacado — manga, citros e goiaba',
      description:
        'Produção orgânica de manga Palmer e Tommy, lima da Pérsia e goiaba Paluma. Caixas de 20 kg. Disponível para contratos com supermercados e distribuidoras.',
      price: 3.5,
      negotiable: true,
      status: 'ACTIVE',
    },
  })

  // ─── Update geog via raw SQL (PostGIS) ────────────────────────────────────
  await prisma.$executeRaw`
    UPDATE locations
    SET geog = ST_MakePoint(longitude, latitude)::geography
    WHERE geog IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL
  `

  console.log('✅ Seed concluído.')
  console.log('')
  console.log('Demo users (login via DEMO_PHONES + DEMO_OTP):')
  console.log('  +5511999990001 — João Silva      — Ribeirão Preto/SP — PRODUCER (GOLD)')
  console.log('  +5511999990002 — Maria Santos    — Sertãozinho/SP   — PRODUCER (SILVER)')
  console.log('  +5511999990003 — Carlos Melo     — Jardinópolis/SP  — PROVIDER (BRONZE)')
  console.log('')
  console.log('Content users:')
  console.log('  Lucas Ferreira  — Sorriso/MT       — PRODUCER (GOLD)')
  console.log('  Ana Oliveira    — Campo Grande/MS  — PRODUCER (SILVER)')
  console.log('  Pedro Costa     — Uberlândia/MG    — PROVIDER')
  console.log('  Fernanda Lima   — Londrina/PR      — PROVIDER (BRONZE)')
  console.log('  Beatriz Horta   — Campinas/SP      — PRODUCER')
  console.log('')
  console.log('Listings: 19 total')
  console.log('  OFFER:  SOY×2, CORN×1, LIVESTOCK×2, DAIRY×1, VEGETABLES×1, FRUITS×1')
  console.log('  DEMAND: SOY×1, CORN×1')
  console.log('  SERVICE: AGRONOMY×1, CONSULTING×2, VETERINARY×1, MECHANICS×1')
  console.log('  EQUIPMENT: TRACTOR×1, HARVESTER×1')
  console.log('')
  console.log('→ http://localhost:3000 | Login: +5511999990001 | OTP: 123456 (DEMO_OTP)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
