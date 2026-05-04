export type UserRole = 'PRODUCER' | 'PROVIDER' | 'ADMIN'

export type ServiceCategory =
  | 'MACHINERY'
  | 'PEST_CONTROL'
  | 'CONSULTING'
  | 'LOGISTICS'
  | 'SOIL_ANALYSIS'
  | 'IRRIGATION'
  | 'OTHER'

export type ListingStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export interface User {
  id: string
  email: string
  name: string
  phone?: string | null
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface ProducerProfile {
  id: string
  userId: string
  farmName: string
  state: string
  city: string
  hectares?: number | null
  cropTypes: string[]
}

export interface ProviderProfile {
  id: string
  userId: string
  companyName: string
  services: string[]
  states: string[]
  verified: boolean
}

export interface Listing {
  id: string
  providerId: string
  title: string
  description: string
  category: ServiceCategory
  priceFrom?: number | null
  status: ListingStatus
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  success: false
  error: string
  statusCode: number
}
