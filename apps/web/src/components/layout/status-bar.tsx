/**
 * StatusBar — barra de status do sistema (mockup mobile)
 * Server Component — sem estado. Apenas visual para as telas mobile-first.
 */
export function StatusBar() {
  return (
    <div className="flex h-7 flex-shrink-0 items-center justify-between px-5">
      <span className="text-xs font-medium">9:41</span>
      <div className="flex items-center gap-1.5">
        {/* Sinal */}
        <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true">
          <rect x="0" y="6" width="2" height="4" rx="0.5" fill="currentColor" />
          <rect x="3" y="4" width="2" height="6" rx="0.5" fill="currentColor" />
          <rect x="6" y="2" width="2" height="8" rx="0.5" fill="currentColor" />
          <rect x="9" y="0" width="2" height="10" rx="0.5" fill="currentColor" />
        </svg>
        {/* Bateria */}
        <svg width="22" height="10" viewBox="0 0 26 12" aria-hidden="true">
          <rect x="0.5" y="0.5" width="22" height="11" rx="2.5" stroke="currentColor" fill="none" />
          <rect x="2" y="2" width="16" height="8" rx="1" fill="currentColor" />
          <path d="M23.5 4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}
