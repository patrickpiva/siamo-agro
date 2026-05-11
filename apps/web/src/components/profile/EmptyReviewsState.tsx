import { Star } from 'lucide-react'

export function EmptyReviewsState() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
        <Star className="text-muted-foreground h-7 w-7" aria-hidden="true" />
      </div>
      <div>
        <p className="font-medium">Sem avaliações ainda</p>
        <p className="text-muted-foreground mt-1 text-sm">
          As avaliações aparecem após a conclusão de transações.
        </p>
      </div>
    </div>
  )
}
