'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@agrolink/ui'
import { updateProfileAction } from '@/actions/profile'
import { profileDataFormSchema } from '@/lib/schemas'
import type { ProfileData } from '@/lib/profile-mock'

interface EditProfileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: ProfileData
  onSaved?: () => void
}

export function EditProfileSheet({ open, onOpenChange, profile, onSaved }: EditProfileSheetProps) {
  const router = useRouter()
  const [name, setName] = useState(profile.name)
  const [bio, setBio] = useState(profile.bio)
  const [errors, setErrors] = useState<{ name?: string; bio?: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  function handleSave() {
    setErrors(null)
    setServerError(null)

    const parsed = profileDataFormSchema.safeParse({ name, bio: bio || undefined })
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      setErrors({ name: fieldErrors.name?.[0], bio: fieldErrors.bio?.[0] })
      return
    }

    startTransition(async () => {
      const result = await updateProfileAction(profile.id, { name, bio })
      if (!result.ok) {
        setServerError(result.message)
        return
      }
      onOpenChange(false)
      onSaved?.()
      router.refresh() // re-renderiza o Server Component com os dados atualizados
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Editar perfil</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              error={errors?.name}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-bio">Bio</Label>
              <span className="text-muted-foreground text-xs">{bio.length}/300</span>
            </div>
            <textarea
              id="edit-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={4}
              disabled={isPending}
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[100px] w-full resize-none rounded-md border px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors?.bio && (
              <p className="text-destructive text-sm" role="alert">
                {errors.bio}
              </p>
            )}
          </div>

          {serverError && (
            <p className="text-destructive text-sm" role="alert">
              {serverError}
            </p>
          )}
        </div>

        <SheetFooter className="mt-6">
          <Button className="w-full" onClick={handleSave} disabled={isPending || !name.trim()}>
            {isPending ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
