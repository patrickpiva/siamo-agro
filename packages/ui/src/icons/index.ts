/**
 * Sistema de ícones do Siamo
 *
 * Fonte única para todos os ícones do projeto. Combina:
 * - Lucide React (ícones genéricos UI)
 * - Ícones Siamo custom (domínio agropecuário)
 * - Ícones de tipo de anúncio (kinds)
 * - Logos sociais (WhatsApp, etc.)
 *
 * REGRA: nenhum componente da aplicação importa de 'lucide-react' direto.
 * Sempre importa daqui: import { Bell, CoffeeBean } from '@siamo/ui/icons'
 *
 * Tamanhos padrão:
 *   size={16} — inline em texto, badges, chips
 *   size={20} — botões de header, tabs
 *   size={24} — ícones de seção, cards (default)
 *   size={40+} — ilustrações, estados vazios
 *
 * Stroke width padrão: 1.8 (override do default 2 do Lucide)
 * Cor: sempre via Tailwind className, nunca prop color (usa currentColor)
 */

// ============================================================
// LUCIDE — ícones UI genéricos
// Re-exportamos só o que usamos, para tree-shaking explícito
// ============================================================
export {
  // Navegação
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Menu,

  // Ações
  Plus,
  Minus,
  Check,
  Edit,
  Edit2,
  Pen,
  Pencil,
  Trash,
  Trash2,
  Save,
  Send,
  Search,
  Filter,
  Share2,
  Bookmark,
  Copy,
  Download,
  Upload,
  RefreshCw,
  MoreHorizontal,
  MoreVertical,

  // Mídia
  Camera,
  Image,
  Paperclip,
  Mic,

  // Comunicação
  Bell,
  BellOff,
  MessageCircle,
  MessageSquare,
  Phone,
  Mail,

  // Localização e mapa
  MapPin,
  Map,
  Navigation,
  Compass,
  Globe,

  // Usuário
  User,
  Users,
  UserPlus,
  LogIn,
  LogOut,
  Settings,
  Shield,
  Lock,
  Eye,
  EyeOff,

  // Feedback
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,

  // Avaliação e qualidade
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Award,

  // Time e data
  Clock,
  Calendar,
  CalendarDays,

  // Tema e acessibilidade
  Moon,
  Sun,
  Monitor,
  Zap,
  Contrast,

  // Visual
  Home,
  Grid,
  List,
  LayoutGrid,
  Tag,
  Tags,

  // Dados e financeiro
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart,
  PieChart,

  // Ferramentas (fallback antes dos custom)
  Wrench,
  Hammer,
  Package,
  Truck,

  // Agro — categorias adicionais
  Wheat,
  Milk,
  LeafyGreen,

  // Conexão
  Wifi,
  WifiOff,
  Signal,
  Battery,

  // Loading
  Loader2,
} from 'lucide-react'

// ============================================================
// SIAMO CUSTOM — domínio agropecuário
// ============================================================
export { CoffeeBean } from './siamo/coffee-bean'
export { Soybean } from './siamo/soybean'
export { Corn } from './siamo/corn'
export { Cattle } from './siamo/cattle'
export { Tractor } from './siamo/tractor'
export { Agronomist } from './siamo/agronomist'
export { Harvester } from './siamo/harvester'
export { Irrigation } from './siamo/irrigation'
export { Soil } from './siamo/soil'
export { Farm } from './siamo/farm'
export { Citrus } from './siamo/citrus'

// ============================================================
// KINDS — tipos de anúncio
// ============================================================
export { OfferKind } from './kinds/offer'
export { DemandKind } from './kinds/demand'
export { ServiceKind } from './kinds/service'
export { EquipmentKind } from './kinds/equipment'

// ============================================================
// SOCIAL — logos externos
// ============================================================
export { WhatsAppLogo } from './social/whatsapp-logo'

// ============================================================
// TIPOS UTILITÁRIOS
// ============================================================
import type * as React from 'react'

export type IconProps = {
  size?: number
  strokeWidth?: number
  className?: string
} & React.SVGProps<SVGSVGElement>

/**
 * Mapeamento de categorias → ícone do domínio.
 * Usado em ListingCard, filtros, busca, etc.
 *
 * Exemplo de uso:
 *   const Icon = CATEGORY_ICONS[listing.category] ?? Package;
 *   <Icon size={24} />
 */
import { CoffeeBean } from './siamo/coffee-bean'
import { Soybean } from './siamo/soybean'
import { Corn } from './siamo/corn'
import { Cattle } from './siamo/cattle'
import { Tractor } from './siamo/tractor'
import { Agronomist } from './siamo/agronomist'
import { Harvester } from './siamo/harvester'
import { Irrigation } from './siamo/irrigation'
import { Soil } from './siamo/soil'
import { Farm } from './siamo/farm'
import { Citrus } from './siamo/citrus'
import { Wheat, Milk, LeafyGreen } from 'lucide-react'

export const CATEGORY_ICONS = {
  // Grãos e produção vegetal
  COFFEE: CoffeeBean,
  SOY: Soybean,
  CORN: Corn,
  GRAINS: Wheat,
  FRUITS: Citrus,
  VEGETABLES: LeafyGreen,

  // Pecuária
  LIVESTOCK: Cattle,
  DAIRY: Milk,

  // Equipamentos
  TRACTOR: Tractor,
  HARVESTER: Harvester,
  IRRIGATION_SYSTEM: Irrigation,

  // Serviços
  AGRONOMY: Agronomist,
  VETERINARY: Cattle,
  CONSULTING: Agronomist,
  IRRIGATION: Irrigation,

  // Estrutural
  PROPERTY: Farm,
  SOIL: Soil,
} as const

export type CategoryKey = keyof typeof CATEGORY_ICONS
