'use client'

import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ProfileRating } from './ProfileRating'
import { EmptyListingsState } from './EmptyListingsState'
import { EmptyReviewsState } from './EmptyReviewsState'
import type { ProfileData } from '@/lib/profile-mock'

interface ProfileTabsProps {
  profile: ProfileData
  isOwn?: boolean
}

export function ProfileTabs({ profile, isOwn }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="listings" className="w-full">
      <div className="bg-background sticky top-0 z-10">
        <TabsList className="w-full rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="listings"
            className="data-[state=active]:border-primary data-[state=active]:text-foreground flex-1 rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent"
          >
            Anúncios ({profile.listings.length})
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="data-[state=active]:border-primary data-[state=active]:text-foreground flex-1 rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent"
          >
            Avaliações ({profile.reviews.length})
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="data-[state=active]:border-primary data-[state=active]:text-foreground flex-1 rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent"
          >
            Stats
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Anúncios */}
      <TabsContent value="listings" className="mt-0 p-4">
        {profile.listings.length === 0 ? (
          <EmptyListingsState isOwn={isOwn} />
        ) : (
          <ul className="flex flex-col gap-3">
            {profile.listings.map((listing) => (
              <li key={listing.id}>
                <Link
                  href={`/anuncio/${listing.id}`}
                  className="bg-card hover:bg-muted flex items-start justify-between gap-2 rounded-xl border p-4 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{listing.title}</p>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                      {listing.description}
                    </p>
                    <p className="text-muted-foreground mt-2 text-xs">
                      {listing.city}, {listing.state}
                    </p>
                  </div>
                  {listing.price && (
                    <span className="text-accent shrink-0 font-mono text-sm font-semibold">
                      {listing.price}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      {/* Avaliações */}
      <TabsContent value="reviews" className="mt-0 p-4">
        {profile.reviews.length === 0 ? (
          <EmptyReviewsState />
        ) : (
          <ul className="flex flex-col divide-y">
            {profile.reviews.map((review) => (
              <li key={review.id} className="py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{review.authorName}</p>
                    <ProfileRating score={review.score} count={0} showCount={false} />
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-foreground/80 mt-2 text-sm">{review.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      {/* Estatísticas */}
      <TabsContent value="stats" className="mt-0 p-4">
        <div className="flex flex-col gap-4">
          <div className="bg-card rounded-xl border p-4">
            <p className="text-muted-foreground text-sm">Serviços concluídos</p>
            <p className="font-mono text-3xl font-bold">{profile.completedTransactions}</p>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-xl border p-4">
              <p className="text-muted-foreground text-sm">Avaliações</p>
              <p className="font-mono text-2xl font-bold">{profile.rating.count}</p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <p className="text-muted-foreground text-sm">Nota média</p>
              <p className="font-mono text-2xl font-bold">
                {profile.rating.count > 0 ? profile.rating.score.toFixed(1) : '—'}
              </p>
            </div>
          </div>
          <div className="bg-card rounded-xl border p-4">
            <p className="text-muted-foreground text-sm">Anúncios ativos</p>
            <p className="font-mono text-2xl font-bold">{profile.listings.length}</p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
