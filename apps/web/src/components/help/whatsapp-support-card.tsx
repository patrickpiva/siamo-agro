import { WhatsAppLogo } from '@siamo/ui/icons'

function isSupportOnline(): boolean {
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay() // 0=Sun, 6=Sat
  return day >= 1 && day <= 6 && hour >= 8 && hour < 18
}

export function WhatsAppSupportCard() {
  const online = isSupportOnline()

  return (
    <div className="mx-4 mb-3 flex gap-[14px] rounded-[14px] border border-[rgba(37,211,102,0.2)] bg-[rgba(37,211,102,0.08)] p-4">
      <div className="flex size-[44px] flex-shrink-0 items-center justify-center rounded-[12px] bg-[rgba(37,211,102,0.15)]">
        <WhatsAppLogo size={24} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-[2px] text-[14px] font-medium text-[#25D366]">Suporte via WhatsApp</p>
        <p className="text-muted-foreground mb-3 text-[11px]">
          {online
            ? 'Online agora · Resposta em até 2h'
            : 'Fora do horário — respondemos amanhã às 8h'}
        </p>
        <a
          href="https://wa.me/5521999999999?text=Ol%C3%A1%2C+preciso+de+ajuda+com+o+Siamo."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-[8px] bg-[#25D366] px-4 py-[8px] text-[13px] font-medium text-white"
        >
          Abrir WhatsApp
        </a>
      </div>
    </div>
  )
}
