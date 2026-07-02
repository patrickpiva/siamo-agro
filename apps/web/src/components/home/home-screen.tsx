import { resolveHomeState, type HomeData } from '@/lib/home-state'
import { GreetingHeader } from './greeting-header'
import { QuestionHero } from './question-hero'
import { ChoiceCard } from './choice-card'
import { PendingAnchor } from './pending-anchor'
import { FoldHint } from './fold-hint'
import { SectionHead } from './section-head'
import { PendingCard } from './pending-card'
import { ContinueCard } from './continue-card'
import { OpportunityCard } from './opportunity-card'
import { OnboardChecklist, type OnboardStep } from './onboard-checklist'
import { HelpCard } from './help-card'
import { HOME_ACTIONS } from './home-actions'

/**
 * Home v2 (Lote 7 — Pergunta Única). Monta os quatro estados a partir do HomeData:
 * saudação → pergunta dominante → 2 escolhas → (âncora de pendência) → contexto
 * abaixo da dobra. Server Component; PendingAnchor é a única ilha client.
 */
export function HomeScreen({ data }: { data: HomeData }) {
  const { profile } = data
  const state = resolveHomeState({
    onboardingComplete: data.onboarding.profileComplete,
    listingsCount: data.counts.listings,
    transactionsCount: data.counts.transactions,
    pendingCount: data.pendingProposalCount,
  })

  const actions = HOME_ACTIONS[profile.type]
  const eyebrow =
    state === 'FIRST_ACCESS'
      ? 'COMECE POR AQUI'
      : state === 'RETURNING_PENDING'
        ? 'VAMOS AO TRABALHO'
        : 'TUDO EM DIA ✓'
  const question =
    profile.type === 'PRODUCER' && state !== 'FIRST_ACCESS'
      ? 'O que você precisa'
      : 'O que você quer fazer'
  const foldLabel =
    state === 'FIRST_ACCESS'
      ? '↓ COMPLETE SEU CADASTRO'
      : state === 'RETURNING_PENDING'
        ? '↓ SEU NEGÓCIO'
        : '↓ OPORTUNIDADES PERTO'

  const onboardSteps: OnboardStep[] = [
    { title: 'Conta criada', sub: 'Telefone verificado', state: 'done' },
    {
      title: 'Complete seu perfil',
      sub: 'Foto, propriedade e localização',
      state: data.onboarding.profileComplete ? 'done' : 'active',
    },
    {
      title: 'Publique seu primeiro anúncio',
      sub: 'O que você quer vender?',
      state: data.onboarding.firstListing
        ? 'done'
        : data.onboarding.profileComplete
          ? 'active'
          : 'todo',
    },
  ]

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <GreetingHeader
        firstName={profile.firstName}
        type={profile.type}
        badge={profile.badge}
        welcome={state === 'FIRST_ACCESS'}
      />
      <QuestionHero eyebrow={eyebrow} question={question} accent="hoje?" />

      <div className="flex flex-col gap-[14px] px-4 pt-7">
        {actions.map((a) => (
          <ChoiceCard
            key={a.href}
            href={a.href}
            variant={a.variant}
            title={a.label}
            subtitle={a.sublabel}
            icon={<a.Icon size={30} strokeWidth={1.8} />}
          />
        ))}
      </div>

      {state === 'RETURNING_PENDING' && data.pendingProposalCount > 0 && (
        <PendingAnchor
          targetId="pendencia"
          label={`Você tem ${data.pendingProposalCount} ${
            data.pendingProposalCount === 1 ? 'proposta esperando' : 'propostas esperando'
          } resposta`}
        />
      )}

      <FoldHint label={foldLabel} />

      {/* Zona abaixo da dobra — fundo levemente recuado (bg-muted = #EFEEE7/#0F0F0D) */}
      <div className="bg-muted border-border flex-1 border-t pt-[18px]">
        {state === 'FIRST_ACCESS' && (
          <>
            <SectionHead title="Vamos começar 🌱" />
            <OnboardChecklist steps={onboardSteps} />
            <HelpCard />
          </>
        )}

        {state === 'RETURNING_PENDING' && (
          <>
            <SectionHead title="Precisa de resposta" id="pendencia" />
            {data.pendingProposals[0] && <PendingCard proposal={data.pendingProposals[0]} />}

            {data.continueThreads.length > 0 && (
              <>
                <SectionHead title="Continue de onde parou" />
                {data.continueThreads.map((t) => (
                  <ContinueCard key={t.transactionId} thread={t} />
                ))}
              </>
            )}

            {data.opportunities.length > 0 && (
              <>
                <SectionHead title="Oportunidades perto" href="/explorar" />
                {data.opportunities.map((o) => (
                  <OpportunityCard key={o.listingId} opportunity={o} />
                ))}
              </>
            )}
          </>
        )}

        {state === 'RETURNING_CLEAR' && (
          <>
            <SectionHead title="Oportunidades perto" href="/explorar" />
            {data.opportunities.length > 0 ? (
              data.opportunities.map((o) => <OpportunityCard key={o.listingId} opportunity={o} />)
            ) : (
              <p className="text-muted-foreground px-5 pb-6 text-[13px] leading-relaxed">
                Nenhuma oportunidade nova por enquanto. Publique um anúncio para aparecer nos
                matches de outras pessoas.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
