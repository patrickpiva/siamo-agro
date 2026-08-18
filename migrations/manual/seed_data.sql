-- Siamo — Seed de dados
-- Execute APÓS reset_data.sql no Supabase SQL Editor.
-- Cria 8 usuários, 8 perfis, 8 localizações e 19 anúncios.
--
-- Demo login (usa DEMO_PHONES + DEMO_OTP do .env):
--   +5511999990001 — João Silva      (PRODUCER / GOLD)
--   +5511999990002 — Maria Santos    (PRODUCER / SILVER)
--   +5511999990003 — Carlos Melo     (PROVIDER / BRONZE)

-- ─── Users ────────────────────────────────────────────────────────────────────
INSERT INTO users (id, phone, status, created_at, updated_at) VALUES
  ('seed-user-a', '+5511999990001', 'ACTIVE', NOW(), NOW()),
  ('seed-user-b', '+5511999990002', 'ACTIVE', NOW(), NOW()),
  ('seed-user-c', '+5511999990003', 'ACTIVE', NOW(), NOW()),
  ('seed-user-d', '+5566999990001', 'ACTIVE', NOW(), NOW()),
  ('seed-user-e', '+5567999990001', 'ACTIVE', NOW(), NOW()),
  ('seed-user-f', '+5534999990001', 'ACTIVE', NOW(), NOW()),
  ('seed-user-g', '+5543999990001', 'ACTIVE', NOW(), NOW()),
  ('seed-user-h', '+5519999990001', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ─── Profiles ─────────────────────────────────────────────────────────────────
INSERT INTO profiles (
  id, user_id, type, name, property_name, bio,
  badge, current_rating, rating_count,
  terms_accepted_at, privacy_accepted_at,
  created_at, updated_at
) VALUES
  (
    'seed-profile-a', 'seed-user-a', 'PRODUCER',
    'João Silva', 'Fazenda Santa Cruz',
    'Produtor de soja e milho na região de Ribeirão Preto há 20 anos. Propriedade de 800 ha com armazém próprio.',
    'GOLD', 4.7, 23,
    NOW(), NOW(), NOW(), NOW()
  ),
  (
    'seed-profile-b', 'seed-user-b', 'PRODUCER',
    'Maria Santos', 'Sítio Boa Vista',
    'Produtora familiar com foco em produção orgânica certificada e pecuária leiteira em Sertãozinho. Fornecimento regular para indústrias da região.',
    'SILVER', 4.2, 11,
    NOW(), NOW(), NOW(), NOW()
  ),
  (
    'seed-profile-c', 'seed-user-c', 'PROVIDER',
    'Carlos Melo', NULL,
    'Engenheiro agrônomo (CREA-SP 123456) com 12 anos de experiência em soja, milho e cana. Atendo propriedades a partir de 50 ha no interior de SP.',
    'BRONZE', 4.9, 41,
    NOW(), NOW(), NOW(), NOW()
  ),
  (
    'seed-profile-d', 'seed-user-d', 'PRODUCER',
    'Lucas Ferreira', 'Fazenda Cerrado Verde',
    'Grande produtor de soja e pecuária em Mato Grosso. 2.400 ha de lavoura, armazém próprio com capacidade de 60.000 sacas.',
    'GOLD', 4.5, 17,
    NOW(), NOW(), NOW(), NOW()
  ),
  (
    'seed-profile-e', 'seed-user-e', 'PRODUCER',
    'Ana Oliveira', 'Estância Pantanal',
    'Pecuarista no Mato Grosso do Sul. Especializada em cria e recria de bovinos Nelore. Rebanho de 1.800 cabeças em pastagem rotacionada.',
    'SILVER', 4.3, 8,
    NOW(), NOW(), NOW(), NOW()
  ),
  (
    'seed-profile-f', 'seed-user-f', 'PROVIDER',
    'Pedro Costa', NULL,
    'Técnico em mecânica agrícola com 18 anos de experiência. Especialista em New Holland, John Deere e Case IH. Atendo Triângulo Mineiro e Alto Paranaíba.',
    'NONE', 4.1, 29,
    NOW(), NOW(), NOW(), NOW()
  ),
  (
    'seed-profile-g', 'seed-user-g', 'PROVIDER',
    'Fernanda Lima', NULL,
    'Médica veterinária (CRMV-PR 12345) especializada em bovinos e suínos. Gestão sanitária, nutrição animal e bem-estar. Atendo sul do PR e norte de SC.',
    'BRONZE', 4.8, 36,
    NOW(), NOW(), NOW(), NOW()
  ),
  (
    'seed-profile-h', 'seed-user-h', 'PRODUCER',
    'Beatriz Horta', 'Sítio Verde Vida',
    'Produtora de hortaliças e frutas orgânicas certificadas em Campinas. Fornecimento para supermercados, restaurantes e CEASA da região.',
    'NONE', 3.9, 5,
    NOW(), NOW(), NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Locations ────────────────────────────────────────────────────────────────
INSERT INTO locations (id, profile_id, latitude, longitude, city, state, created_at, updated_at) VALUES
  ('seed-loc-a', 'seed-profile-a', -21.1775, -47.8103, 'Ribeirão Preto', 'SP', NOW(), NOW()),
  ('seed-loc-b', 'seed-profile-b', -21.1394, -47.9875, 'Sertãozinho',   'SP', NOW(), NOW()),
  ('seed-loc-c', 'seed-profile-c', -21.0177, -47.7628, 'Jardinópolis',  'SP', NOW(), NOW()),
  ('seed-loc-d', 'seed-profile-d', -12.5474, -55.7210, 'Sorriso',       'MT', NOW(), NOW()),
  ('seed-loc-e', 'seed-profile-e', -20.4697, -54.6201, 'Campo Grande',  'MS', NOW(), NOW()),
  ('seed-loc-f', 'seed-profile-f', -18.9133, -48.2773, 'Uberlândia',    'MG', NOW(), NOW()),
  ('seed-loc-g', 'seed-profile-g', -23.3105, -51.1628, 'Londrina',      'PR', NOW(), NOW()),
  ('seed-loc-h', 'seed-profile-h', -22.9056, -47.0608, 'Campinas',      'SP', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ─── Listings ─────────────────────────────────────────────────────────────────

-- João Silva — OFFER: SOY + CORN
INSERT INTO listings (id, profile_id, kind, category, title, description, price, negotiable, status, view_count, created_at, updated_at) VALUES
  (
    'seed-listing-a1', 'seed-profile-a', 'OFFER', 'SOY',
    'Soja safra 2025/26 — 1.500 sacas disponíveis',
    'Soja limpa a granel, armazenada em silo metálico. Umidade 13%, impureza < 1%. Certificação de origem disponível. Entrega em caminhão graneleiro ou retirada na propriedade.',
    128.50, true, 'ACTIVE', 0, NOW(), NOW()
  ),
  (
    'seed-listing-a2', 'seed-profile-a', 'OFFER', 'CORN',
    'Milho safrinha — entrega imediata em Ribeirão Preto',
    'Milho safrinha 2025, seco e limpo, em silo. 600 sacas disponíveis para entrega imediata. Adequado para ração animal e exportação. Laudo de classificação disponível.',
    64.00, false, 'ACTIVE', 0, NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Maria Santos — DEMAND: SOY | OFFER: DAIRY
INSERT INTO listings (id, profile_id, kind, category, title, description, price, negotiable, status, view_count, created_at, updated_at) VALUES
  (
    'seed-listing-b1', 'seed-profile-b', 'DEMAND', 'SOY',
    'Compramos soja orgânica certificada',
    'Indústria de alimentos busca fornecedor de soja orgânica certificada (IBD ou Ecocert). Contrato mensal, volume mínimo 200 sacas. Pagamento à vista ou D+3.',
    NULL, true, 'ACTIVE', 0, NOW(), NOW()
  ),
  (
    'seed-listing-b2', 'seed-profile-b', 'OFFER', 'DAIRY',
    'Leite in natura — disponível para laticínios',
    'Produção diária de 800 litros de leite in natura. CCS e CBT dentro dos padrões Instrução Normativa 76/77. Retirada na propriedade ou entrega em raio de 50 km.',
    2.80, true, 'ACTIVE', 0, NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Carlos Melo — SERVICE: AGRONOMY + CONSULTING
INSERT INTO listings (id, profile_id, kind, category, title, description, price, negotiable, status, view_count, created_at, updated_at) VALUES
  (
    'seed-listing-c1', 'seed-profile-c', 'SERVICE', 'AGRONOMY',
    'Consultoria agronômica — soja e milho',
    'Acompanhamento técnico completo: análise de solo, adubação, manejo integrado de pragas e doenças, colheita. Relatórios semanais. Atendo SP e Triângulo Mineiro.',
    800.00, false, 'ACTIVE', 0, NOW(), NOW()
  ),
  (
    'seed-listing-c2', 'seed-profile-c', 'SERVICE', 'CONSULTING',
    'Planejamento de safra 2025/2026',
    'Elaboração de plano de safra com análise de custo de produção, escolha de cultivares, cronograma de aplicações e projeção de rentabilidade. Inclui 3 visitas técnicas.',
    1200.00, true, 'ACTIVE', 0, NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Lucas Ferreira — OFFER: SOY + LIVESTOCK
INSERT INTO listings (id, profile_id, kind, category, title, description, price, negotiable, status, view_count, created_at, updated_at) VALUES
  (
    'seed-listing-d1', 'seed-profile-d', 'OFFER', 'SOY',
    'Soja Mato Grosso — lotes a partir de 1.000 sacas',
    'Soja convencional safra 2025, a granel, armazenada em silo metálico. Classificação disponível. Aceita retirada no armazém ou FOB Sorriso-MT.',
    126.00, true, 'ACTIVE', 0, NOW(), NOW()
  ),
  (
    'seed-listing-d2', 'seed-profile-d', 'OFFER', 'LIVESTOCK',
    'Novilhos Nelore para engorda — 80 cabeças',
    'Novilhos Nelore puros, 18–22 meses, peso médio 340 kg. Vacinados (aftosa, brucelose), documentação completa GTA. Excelente padrão racial. Frete a negociar.',
    285.00, false, 'ACTIVE', 0, NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Ana Oliveira — OFFER: LIVESTOCK | DEMAND: CORN
INSERT INTO listings (id, profile_id, kind, category, title, description, price, negotiable, status, view_count, created_at, updated_at) VALUES
  (
    'seed-listing-e1', 'seed-profile-e', 'OFFER', 'LIVESTOCK',
    'Novilhas Nelore — prontas para engorda ou reprodução',
    'Lote de 60 novilhas Nelore, 14–18 meses, peso médio 290 kg. Excelente padrão racial. Vacinação em dia, GTA e rastreabilidade disponíveis. Entrega a combinar.',
    275.00, true, 'ACTIVE', 0, NOW(), NOW()
  ),
  (
    'seed-listing-e2', 'seed-profile-e', 'DEMAND', 'CORN',
    'Compramos milho para confinamento bovino',
    'Estância com capacidade para confinar 600 animais busca fornecedor de milho em grão para ração. Volume mensal: 800 sacas. Contrato de 6 meses, pagamento quinzenal.',
    NULL, true, 'ACTIVE', 0, NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Pedro Costa — EQUIPMENT: TRACTOR + HARVESTER | SERVICE: MECHANICS
INSERT INTO listings (id, profile_id, kind, category, title, description, price, negotiable, status, view_count, created_at, updated_at) VALUES
  (
    'seed-listing-f1', 'seed-profile-f', 'EQUIPMENT', 'TRACTOR',
    'Trator New Holland T7.210 — locação diária ou semanal',
    'Trator 210 cv, cabine fechada, tração 4×4, engate triplo. Disponível para locação com operador incluso. Manutenção em dia, pneus novos. Diária inclui combustível.',
    2800.00, false, 'ACTIVE', 0, NOW(), NOW()
  ),
  (
    'seed-listing-f2', 'seed-profile-f', 'EQUIPMENT', 'HARVESTER',
    'Colheitadeira Case IH 8120 — locação por safra',
    'Case IH Axial-Flow 8120, 350 cv, plataforma 30 pés. Disponível para locação por período de safra com operador incluso. Mais de 15.000 ha colhidos.',
    18000.00, true, 'ACTIVE', 0, NOW(), NOW()
  ),
  (
    'seed-listing-f3', 'seed-profile-f', 'SERVICE', 'MECHANICS',
    'Manutenção preventiva e corretiva de tratores',
    'Revisão completa, troca de óleo e filtros, diagnóstico eletrônico, regulagem de injetores. Atendimento na fazenda com kit móvel. Orçamento sem compromisso.',
    180.00, false, 'ACTIVE', 0, NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Fernanda Lima — SERVICE: VETERINARY + CONSULTING
INSERT INTO listings (id, profile_id, kind, category, title, description, price, negotiable, status, view_count, created_at, updated_at) VALUES
  (
    'seed-listing-g1', 'seed-profile-g', 'SERVICE', 'VETERINARY',
    'Atendimento veterinário rural — bovinos e suínos',
    'Consultas, diagnóstico, vacinação, exame andrológico e ginecológico, ultrassom reprodutivo. Atendimento na propriedade. Contrato mensal ou por visita avulsa.',
    600.00, true, 'ACTIVE', 0, NOW(), NOW()
  ),
  (
    'seed-listing-g2', 'seed-profile-g', 'SERVICE', 'CONSULTING',
    'Gestão sanitária e nutricional do rebanho bovino',
    'Programa completo de sanidade: calendário vacinal, controle de ecto e endoparasitas, escore corporal, ajuste de dieta. Relatórios mensais e suporte por WhatsApp.',
    1500.00, false, 'ACTIVE', 0, NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Beatriz Horta — OFFER: VEGETABLES + FRUITS
INSERT INTO listings (id, profile_id, kind, category, title, description, price, negotiable, status, view_count, created_at, updated_at) VALUES
  (
    'seed-listing-h1', 'seed-profile-h', 'OFFER', 'VEGETABLES',
    'Hortaliças orgânicas certificadas — kit semanal para atacado',
    'Mix de hortaliças orgânicas (alface, rúcula, couve, espinafre, cenoura, beterraba). Certificação IBD. Pedido mínimo 50 kg/semana. Entrega em Campinas e região.',
    NULL, true, 'ACTIVE', 0, NOW(), NOW()
  ),
  (
    'seed-listing-h2', 'seed-profile-h', 'OFFER', 'FRUITS',
    'Frutas tropicais para atacado — manga, citros e goiaba',
    'Produção orgânica de manga Palmer e Tommy, lima da Pérsia e goiaba Paluma. Caixas de 20 kg. Disponível para contratos com supermercados e distribuidoras.',
    3.50, true, 'ACTIVE', 0, NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ─── PostGIS — sincroniza geog com lat/lng ────────────────────────────────────
UPDATE locations
SET    geog = ST_MakePoint(longitude, latitude)::geography
WHERE  geog      IS NULL
  AND  latitude  IS NOT NULL
  AND  longitude IS NOT NULL;
