export const CATEGORIES = {
  OFFER: {
    COFFEE: 'Café',
    SOY: 'Soja',
    CORN: 'Milho',
    GRAINS: 'Grãos e Cereais',
    LIVESTOCK: 'Pecuária',
    DAIRY: 'Laticínios',
    FRUITS: 'Frutas',
    VEGETABLES: 'Hortaliças e Legumes',
    OTHER: 'Outros',
  },
  DEMAND: {
    COFFEE: 'Café',
    SOY: 'Soja',
    CORN: 'Milho',
    GRAINS: 'Grãos e Cereais',
    LIVESTOCK: 'Pecuária',
    DAIRY: 'Laticínios',
    FRUITS: 'Frutas',
    VEGETABLES: 'Hortaliças e Legumes',
    OTHER: 'Outros',
  },
  SERVICE: {
    AGRONOMY: 'Agronomia',
    VETERINARY: 'Veterinária',
    MECHANICS: 'Mecânica Agrícola',
    CONSULTING: 'Consultoria',
    LABOR: 'Mão de Obra Rural',
    TRANSPORT: 'Transporte',
    IRRIGATION: 'Irrigação',
    OTHER: 'Outros',
  },
  EQUIPMENT: {
    TRACTOR: 'Trator',
    HARVESTER: 'Colheitadeira',
    TOOLS: 'Ferramentas',
    IRRIGATION_SYSTEM: 'Sistema de Irrigação',
    STORAGE: 'Armazenamento',
    OTHER: 'Outros',
  },
} as const satisfies Record<string, Record<string, string>>

export type ListingKindKey = keyof typeof CATEGORIES
export type CategoryForKind<K extends ListingKindKey> = keyof (typeof CATEGORIES)[K]
export type AnyCategory = { [K in ListingKindKey]: CategoryForKind<K> }[ListingKindKey]

export function isCategoryValidForKind(category: string, kind: string): boolean {
  const kindCategories = CATEGORIES[kind as ListingKindKey]
  return kindCategories ? Object.keys(kindCategories).includes(category) : false
}
